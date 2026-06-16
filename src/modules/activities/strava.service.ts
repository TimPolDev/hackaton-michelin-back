import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { STRAVA_API_CLIENT } from './strava/strava-api.client';
import type {
  AuthorizationUrlOptions,
  StravaApiClient,
} from './strava/strava-api.client';
import {
  StravaSummaryActivity,
  StravaSummaryAthlete,
  StravaTokenResponse,
} from './strava/strava-api.types';

/** Refresh the access token if it expires within this window (seconds). */
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

@Injectable()
export class StravaService {
  private readonly logger = new Logger(StravaService.name);

  constructor(
    @Inject(STRAVA_API_CLIENT) private readonly api: StravaApiClient,
    private readonly prisma: PrismaService,
  ) {}

  /** Build the Strava authorization URL the user is redirected to. */
  getAuthorizationUrl(opts?: AuthorizationUrlOptions): string {
    return this.api.getAuthorizationUrl(opts);
  }

  /**
   * Exchange Strava authorization code for access token.
   */
  async exchangeToken(code: string) {
    try {
      return await this.api.exchangeToken(code);
    } catch (error) {
      this.logger.error('Failed to exchange Strava token', error);
      throw error;
    }
  }

  /**
   * Connect a cyclist to Strava: exchange the code, persist the tokens and
   * athlete id on the Cyclist, then import their activities.
   */
  async connect(
    cyclistId: string,
    code: string,
  ): Promise<{ athlete: StravaSummaryAthlete; imported: number }> {
    const token = await this.exchangeToken(code);

    await this.persistToken(cyclistId, token, {
      stravaId: token.athlete.id.toString(),
      stravaConnectedAt: new Date(),
    });

    const imported = await this.importActivities(cyclistId, token.access_token);
    return { athlete: token.athlete, imported };
  }

  /**
   * Sync new activities for a connected cyclist, refreshing the access token
   * first if it has (or is about to) expire.
   */
  async sync(cyclistId: string): Promise<number> {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { id: cyclistId },
    });

    if (!cyclist?.stravaAccessToken) {
      throw new BadRequestException('Strava not connected');
    }

    const accessToken = await this.getFreshAccessToken(cyclist);
    return this.syncActivities(cyclistId, accessToken);
  }

  /**
   * Disconnect Strava: revoke the token on Strava's side, then clear the
   * stored tokens. Activities are intentionally kept (RidingData is frozen,
   * not deleted, per the product spec).
   */
  async disconnect(cyclistId: string): Promise<void> {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { id: cyclistId },
    });

    if (cyclist?.stravaAccessToken) {
      try {
        await this.api.deauthorize(cyclist.stravaAccessToken);
      } catch (error) {
        // Best-effort: still clear our side even if Strava revoke fails.
        this.logger.warn(`Strava deauthorize failed for ${cyclistId}`, error);
      }
    }

    await this.prisma.cyclist.update({
      where: { id: cyclistId },
      data: {
        stravaId: null,
        stravaAccessToken: null,
        stravaRefreshToken: null,
        stravaTokenExpiresAt: null,
        stravaConnectedAt: null,
      },
    });
  }

  /**
   * Return a valid access token for the cyclist, refreshing it via the stored
   * refresh token when the current one is expired or about to expire.
   * Strava access tokens are only valid for 6 hours.
   */
  private async getFreshAccessToken(cyclist: {
    id: string;
    stravaAccessToken: string | null;
    stravaRefreshToken: string | null;
    stravaTokenExpiresAt: Date | null;
  }): Promise<string> {
    const stillValid =
      cyclist.stravaTokenExpiresAt &&
      cyclist.stravaTokenExpiresAt.getTime() - TOKEN_EXPIRY_BUFFER_MS >
        Date.now();

    if (cyclist.stravaAccessToken && stillValid) {
      return cyclist.stravaAccessToken;
    }

    if (!cyclist.stravaRefreshToken) {
      // No way to refresh — fall back to whatever we have.
      if (cyclist.stravaAccessToken) return cyclist.stravaAccessToken;
      throw new BadRequestException('Strava not connected');
    }

    this.logger.log(`Refreshing Strava access token for cyclist ${cyclist.id}`);
    const token = await this.api.refreshToken(cyclist.stravaRefreshToken);
    await this.persistToken(cyclist.id, token);
    return token.access_token;
  }

  /** Persist token fields (access/refresh/expiry) plus optional extra fields. */
  private async persistToken(
    cyclistId: string,
    token: StravaTokenResponse,
    extra: { stravaId?: string; stravaConnectedAt?: Date } = {},
  ): Promise<void> {
    await this.prisma.cyclist.update({
      where: { id: cyclistId },
      data: {
        stravaAccessToken: token.access_token,
        stravaRefreshToken: token.refresh_token,
        stravaTokenExpiresAt: new Date(token.expires_at * 1000),
        ...extra,
      },
    });
  }

  /**
   * Import activities from Strava for a cyclist (last 200).
   */
  async importActivities(cyclistId: string, accessToken: string): Promise<number> {
    try {
      const activities = await this.api.getActivities(accessToken, {
        perPage: 200,
      });

      const imported = await this.persistActivities(cyclistId, activities);
      this.logger.log(`Imported ${imported} activities for cyclist ${cyclistId}`);
      return imported;
    } catch (error) {
      this.logger.error('Failed to import Strava activities', error);
      throw error;
    }
  }

  /**
   * Sync new activities since the last imported one.
   */
  async syncActivities(cyclistId: string, accessToken: string): Promise<number> {
    const lastActivity = await this.prisma.activity.findFirst({
      where: {
        cyclistId,
        isManual: false,
      },
      orderBy: {
        activityDate: 'desc',
      },
    });

    const after = lastActivity
      ? Math.floor(lastActivity.activityDate.getTime() / 1000)
      : undefined;

    try {
      const activities = await this.api.getActivities(accessToken, {
        perPage: 100,
        after,
      });

      return await this.persistActivities(cyclistId, activities);
    } catch (error) {
      this.logger.error('Failed to sync Strava activities', error);
      throw error;
    }
  }

  /**
   * Persist a batch of Strava activities, deduplicating by stravaId and
   * converting units to the app's storage format (km, km/h).
   */
  private async persistActivities(
    cyclistId: string,
    activities: StravaSummaryActivity[],
  ): Promise<number> {
    let imported = 0;

    for (const stravaActivity of activities) {
      const existing = await this.prisma.activity.findUnique({
        where: { stravaId: stravaActivity.id.toString() },
      });

      if (existing) continue; // Skip already imported

      const bikeType = this.mapStravaToBikeType(
        stravaActivity.type,
        stravaActivity.sport_type,
      );

      await this.prisma.activity.create({
        data: {
          cyclistId,
          stravaId: stravaActivity.id.toString(),
          bikeType,
          activityDate: new Date(stravaActivity.start_date),
          distance: stravaActivity.distance / 1000, // meters to km
          elevationGain: stravaActivity.total_elevation_gain,
          movingTime: stravaActivity.moving_time,
          averageSpeed: stravaActivity.average_speed
            ? stravaActivity.average_speed * 3.6 // m/s to km/h
            : null,
          // Default terrain (could be improved with route analysis)
          terrainAsphalt: bikeType === 'ROAD' ? 100 : 50,
          terrainOffroad:
            bikeType === 'MTB' ? 100 : bikeType === 'GRAVEL' ? 50 : 0,
          terrainMixed: bikeType === 'GRAVEL' ? 50 : 0,
          isManual: false,
        },
      });

      imported++;
    }

    return imported;
  }

  /**
   * Map Strava activity type to our BikeType.
   */
  private mapStravaToBikeType(type: string, sportType?: string): string {
    // Sport type is more accurate if available
    if (sportType) {
      switch (sportType.toLowerCase()) {
        case 'mountainbikeride':
        case 'mtb':
          return 'MTB';
        case 'gravelride':
        case 'gravel':
          return 'GRAVEL';
        case 'ebikeride':
        case 'emountainbikeride':
          return 'E_BIKE';
        case 'ride':
        case 'virtualride':
        default:
          return 'ROAD';
      }
    }

    // Fallback to type
    switch (type.toLowerCase()) {
      case 'mountainbikeride':
        return 'MTB';
      case 'gravelride':
        return 'GRAVEL';
      case 'ebikeride':
        return 'E_BIKE';
      case 'ride':
      case 'virtualride':
      default:
        return 'ROAD';
    }
  }
}

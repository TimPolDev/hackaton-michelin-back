import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type?: string;
  start_date: string;
  average_speed?: number;
}

@Injectable()
export class StravaService {
  private readonly logger = new Logger(StravaService.name);
  private readonly stravaApiUrl = 'https://www.strava.com/api/v3';

  constructor(
    private http: HttpService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Exchange Strava authorization code for access token
   */
  async exchangeToken(code: string) {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.stravaApiUrl}/oauth/token`, {
          client_id: this.config.get('STRAVA_CLIENT_ID'),
          client_secret: this.config.get('STRAVA_CLIENT_SECRET'),
          code,
          grant_type: 'authorization_code',
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange Strava token', error);
      throw error;
    }
  }

  /**
   * Import activities from Strava for a cyclist
   */
  async importActivities(cyclistId: string, accessToken: string): Promise<number> {
    try {
      // Get activities from Strava (last 200)
      const response = await firstValueFrom(
        this.http.get<StravaActivity[]>(`${this.stravaApiUrl}/athlete/activities`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            per_page: 200,
          },
        }),
      );

      const activities = response.data;
      let imported = 0;

      for (const stravaActivity of activities) {
        // Check if already imported
        const existing = await this.prisma.activity.findUnique({
          where: { stravaId: stravaActivity.id.toString() },
        });

        if (existing) {
          continue; // Skip already imported
        }

        // Determine bike type from Strava activity type
        const bikeType = this.mapStravaToBikeType(stravaActivity.type, stravaActivity.sport_type);

        // Create activity
        await this.prisma.activity.create({
          data: {
            cyclistId,
            stravaId: stravaActivity.id.toString(),
            bikeType,
            activityDate: new Date(stravaActivity.start_date),
            distance: stravaActivity.distance / 1000, // meters to km
            elevationGain: stravaActivity.total_elevation_gain,
            movingTime: stravaActivity.moving_time,
            averageSpeed: stravaActivity.average_speed ? stravaActivity.average_speed * 3.6 : null, // m/s to km/h
            // Default terrain (could be improved with route analysis)
            terrainAsphalt: bikeType === 'ROAD' ? 100 : 50,
            terrainOffroad: bikeType === 'MTB' ? 100 : (bikeType === 'GRAVEL' ? 50 : 0),
            terrainMixed: bikeType === 'GRAVEL' ? 50 : 0,
            isManual: false,
          },
        });

        imported++;
      }

      this.logger.log(`Imported ${imported} activities for cyclist ${cyclistId}`);
      return imported;
    } catch (error) {
      this.logger.error('Failed to import Strava activities', error);
      throw error;
    }
  }

  /**
   * Map Strava activity type to our BikeType
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

  /**
   * Sync new activities since last sync
   */
  async syncActivities(cyclistId: string, accessToken: string): Promise<number> {
    // Get last activity date
    const lastActivity = await this.prisma.activity.findFirst({
      where: {
        cyclistId,
        isManual: false,
      },
      orderBy: {
        activityDate: 'desc',
      },
    });

    const after = lastActivity ? Math.floor(lastActivity.activityDate.getTime() / 1000) : undefined;

    try {
      const response = await firstValueFrom(
        this.http.get<StravaActivity[]>(`${this.stravaApiUrl}/athlete/activities`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            per_page: 100,
            after,
          },
        }),
      );

      const activities = response.data;
      let imported = 0;

      for (const stravaActivity of activities) {
        const existing = await this.prisma.activity.findUnique({
          where: { stravaId: stravaActivity.id.toString() },
        });

        if (existing) continue;

        const bikeType = this.mapStravaToBikeType(stravaActivity.type, stravaActivity.sport_type);

        await this.prisma.activity.create({
          data: {
            cyclistId,
            stravaId: stravaActivity.id.toString(),
            bikeType,
            activityDate: new Date(stravaActivity.start_date),
            distance: stravaActivity.distance / 1000,
            elevationGain: stravaActivity.total_elevation_gain,
            movingTime: stravaActivity.moving_time,
            averageSpeed: stravaActivity.average_speed ? stravaActivity.average_speed * 3.6 : null,
            terrainAsphalt: bikeType === 'ROAD' ? 100 : 50,
            terrainOffroad: bikeType === 'MTB' ? 100 : (bikeType === 'GRAVEL' ? 50 : 0),
            terrainMixed: bikeType === 'GRAVEL' ? 50 : 0,
            isManual: false,
          },
        });

        imported++;
      }

      return imported;
    } catch (error) {
      this.logger.error('Failed to sync Strava activities', error);
      throw error;
    }
  }
}

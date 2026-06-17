import { Injectable, Logger } from '@nestjs/common';
import {
  AuthorizationUrlOptions,
  GetActivitiesOptions,
  StravaApiClient,
} from './strava-api.client';
import {
  StravaSummaryActivity,
  StravaTokenResponse,
} from './strava-api.types';
import {
  generateMockActivities,
  generateMockAthlete,
} from './strava-mock.data';

/**
 * Mock Strava API client for the MVP.
 *
 * Mirrors the OAuth flow of https://developers.strava.com/docs/authentication/
 * (authorize URL, code exchange, refresh, deauthorize) and the activity feed,
 * returning data in the exact Strava response shapes without any network call.
 *
 * Because there is no real Strava consent screen, `getAuthorizationUrl` points
 * straight back at the configured redirect URI with a mock `code`, so the
 * frontend OAuth round-trip still completes end-to-end.
 *
 * StravaService is unaware it talks to a mock — flipping STRAVA_MOCK to "false"
 * switches to the real API with no other code change.
 */
@Injectable()
export class MockStravaApiClient implements StravaApiClient {
  private readonly logger = new Logger(MockStravaApiClient.name);
  private readonly accessTokenPrefix = 'mock_access_';
  private readonly defaultScope = 'read,activity:read_all';

  /** Frontend callback URL (STRAVA_REDIRECT_URI). Optional in mock mode. */
  constructor(private readonly redirectUri?: string) {}

  getAuthorizationUrl(opts: AuthorizationUrlOptions = {}): string {
    this.logger.warn('[MOCK] Building fake Strava authorize URL — no real consent screen');
    const redirect = this.redirectUri ?? 'http://localhost:3000/auth/strava/callback';
    const params = new URLSearchParams({
      code: 'mock-code',
      scope: opts.scope ?? this.defaultScope,
    });
    if (opts.state) params.set('state', opts.state);

    return `${redirect}?${params.toString()}`;
  }

  async exchangeToken(code: string): Promise<StravaTokenResponse> {
    this.logger.warn(
      `[MOCK] Strava token exchange for code "${code}" — no real API call`,
    );
    return this.buildToken(generateMockAthlete(code || 'mock-code').id);
  }

  async refreshToken(refreshToken: string): Promise<StravaTokenResponse> {
    this.logger.warn('[MOCK] Strava token refresh — no real API call');
    // Recover the athlete id from the "mock_refresh_<id>" token, else hash it.
    const idFromToken = Number(refreshToken.replace('mock_refresh_', ''));
    const athleteId = Number.isFinite(idFromToken)
      ? idFromToken
      : generateMockAthlete(refreshToken).id;
    return this.buildToken(athleteId);
  }

  async getActivities(
    accessToken: string,
    opts: GetActivitiesOptions = {},
  ): Promise<StravaSummaryActivity[]> {
    this.logger.warn('[MOCK] Returning mock Strava activities — no real API call');

    // Seed the deterministic generator from the athlete behind the token so the
    // same connection always produces the same activity history, even after a
    // refresh issues a new access token string.
    const seed = `athlete_${this.athleteIdFromAccessToken(accessToken)}`;
    let activities = generateMockActivities(seed, { now: new Date() });

    // Mimic the real `after` filter (epoch seconds) used by incremental sync.
    if (opts.after !== undefined) {
      const afterMs = opts.after * 1000;
      activities = activities.filter(
        (a) => new Date(a.start_date).getTime() > afterMs,
      );
    }

    const perPage = opts.perPage ?? 200;
    return activities.slice(0, perPage);
  }

  async deauthorize(accessToken: string): Promise<void> {
    this.logger.warn(
      `[MOCK] Strava deauthorize for "${accessToken}" — no real API call`,
    );
  }

  private buildToken(athleteId: number): StravaTokenResponse {
    const expiresIn = 6 * 60 * 60; // 6 hours, like Strava
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    return {
      token_type: 'Bearer',
      expires_at: expiresAt,
      expires_in: expiresIn,
      refresh_token: `mock_refresh_${athleteId}`,
      access_token: `${this.accessTokenPrefix}${athleteId}`,
      scope: this.defaultScope,
      athlete: { ...generateMockAthlete('mock-code'), id: athleteId },
    };
  }

  private athleteIdFromAccessToken(accessToken: string): number {
    const id = Number(accessToken.replace(this.accessTokenPrefix, ''));
    return Number.isFinite(id) ? id : generateMockAthlete(accessToken).id;
  }
}

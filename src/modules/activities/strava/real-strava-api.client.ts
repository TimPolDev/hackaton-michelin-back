import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  AuthorizationUrlOptions,
  GetActivitiesOptions,
  StravaApiClient,
} from './strava-api.client';
import {
  StravaSummaryActivity,
  StravaTokenResponse,
} from './strava-api.types';

/**
 * Real Strava API client — implements the OAuth flow and resource calls from
 * https://developers.strava.com/docs/authentication/ and the v3 reference.
 *
 * Used when STRAVA_MOCK !== "true".
 *
 * Note the two distinct base URLs: OAuth endpoints live under
 * `https://www.strava.com/oauth`, while resource endpoints live under
 * `https://www.strava.com/api/v3`. The token endpoint is NOT under /api/v3.
 */
@Injectable()
export class RealStravaApiClient implements StravaApiClient {
  private readonly logger = new Logger(RealStravaApiClient.name);
  private readonly apiUrl = 'https://www.strava.com/api/v3';
  private readonly oauthUrl = 'https://www.strava.com/oauth';
  private readonly defaultScope = 'read,activity:read_all';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  getAuthorizationUrl(opts: AuthorizationUrlOptions = {}): string {
    const params = new URLSearchParams({
      client_id: String(this.config.get('STRAVA_CLIENT_ID')),
      redirect_uri: String(this.config.get('STRAVA_REDIRECT_URI')),
      response_type: 'code',
      approval_prompt: 'auto',
      scope: opts.scope ?? this.config.get('STRAVA_SCOPE') ?? this.defaultScope,
    });
    if (opts.state) params.set('state', opts.state);

    return `${this.oauthUrl}/authorize?${params.toString()}`;
  }

  async exchangeToken(code: string): Promise<StravaTokenResponse> {
    const response = await firstValueFrom(
      this.http.post<StravaTokenResponse>(`${this.oauthUrl}/token`, {
        client_id: this.config.get('STRAVA_CLIENT_ID'),
        client_secret: this.config.get('STRAVA_CLIENT_SECRET'),
        code,
        grant_type: 'authorization_code',
      }),
    );

    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<StravaTokenResponse> {
    const response = await firstValueFrom(
      this.http.post<StravaTokenResponse>(`${this.oauthUrl}/token`, {
        client_id: this.config.get('STRAVA_CLIENT_ID'),
        client_secret: this.config.get('STRAVA_CLIENT_SECRET'),
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    );

    return response.data;
  }

  async getActivities(
    accessToken: string,
    opts: GetActivitiesOptions = {},
  ): Promise<StravaSummaryActivity[]> {
    const response = await firstValueFrom(
      this.http.get<StravaSummaryActivity[]>(
        `${this.apiUrl}/athlete/activities`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            per_page: opts.perPage ?? 200,
            after: opts.after,
            page: opts.page,
          },
        },
      ),
    );

    return response.data;
  }

  async deauthorize(accessToken: string): Promise<void> {
    // Legacy endpoint, valid until June 1 2027. The recommended replacement is
    // POST /oauth/revoke (HTTP Basic auth). Revoking invalidates all tokens.
    await firstValueFrom(
      this.http.post(`${this.oauthUrl}/deauthorize`, null, {
        params: { access_token: accessToken },
      }),
    );
  }
}

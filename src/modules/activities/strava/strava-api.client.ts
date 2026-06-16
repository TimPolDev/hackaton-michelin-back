import { StravaSummaryActivity, StravaTokenResponse } from './strava-api.types';

/**
 * Injection token for the Strava API client. The concrete implementation
 * (real HTTP client or MVP mock) is chosen in ActivitiesModule based on the
 * STRAVA_MOCK env flag.
 */
export const STRAVA_API_CLIENT = Symbol('STRAVA_API_CLIENT');

export interface GetActivitiesOptions {
  perPage?: number;
  /** Only return activities started after this epoch-seconds timestamp. */
  after?: number;
  page?: number;
}

export interface AuthorizationUrlOptions {
  /** Opaque value echoed back on the callback (CSRF protection). */
  state?: string;
  /** Comma-delimited scopes. Defaults to "read,activity:read_all". */
  scope?: string;
}

/**
 * Abstraction over the Strava API. StravaService depends only on this
 * interface, so swapping the real API for the mock is a one-line change in
 * the module wiring — no business logic changes.
 *
 * The OAuth surface mirrors https://developers.strava.com/docs/authentication/.
 */
export interface StravaApiClient {
  /**
   * Build the URL the user is redirected to in order to grant access
   * (GET https://www.strava.com/oauth/authorize).
   */
  getAuthorizationUrl(opts?: AuthorizationUrlOptions): string;

  /** Exchange an OAuth authorization code for tokens + athlete summary. */
  exchangeToken(code: string): Promise<StravaTokenResponse>;

  /**
   * Exchange a refresh token for a fresh access token
   * (grant_type=refresh_token). Strava access tokens expire after 6 hours.
   */
  refreshToken(refreshToken: string): Promise<StravaTokenResponse>;

  /** List the authenticated athlete's activities (Strava SummaryActivity). */
  getActivities(
    accessToken: string,
    opts?: GetActivitiesOptions,
  ): Promise<StravaSummaryActivity[]>;

  /** Revoke the app's access for a token (POST /oauth/deauthorize). */
  deauthorize(accessToken: string): Promise<void>;
}

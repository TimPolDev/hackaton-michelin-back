/**
 * Types reflecting the Strava API v3 response shapes.
 * Field names and units match the official reference:
 * https://developers.strava.com/docs/reference/
 *
 * These are shared by both the real and mock Strava API clients so that the
 * rest of the app (StravaService) consumes Strava-shaped data regardless of
 * whether it comes from the real API or the MVP mock.
 */

/** Strava SummaryAthlete (subset used by the app). */
export interface StravaSummaryAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  city?: string;
  country?: string;
  sex?: 'M' | 'F';
  profile?: string; // URL of the athlete's large profile picture
  profile_medium?: string; // URL of the athlete's medium profile picture
}

/** Strava SummaryActivity (subset used by the app). Units are Strava's raw units. */
export interface StravaSummaryActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  type: string; // legacy activity type, e.g. "Ride"
  sport_type: string; // e.g. "Ride", "MountainBikeRide", "GravelRide", "EBikeRide"
  start_date: string; // ISO 8601 UTC
  start_date_local: string; // ISO 8601 local
  average_speed?: number; // meters per second
  max_speed?: number; // meters per second
  map?: {
    id?: string;
    summary_polyline?: string; // Encoded polyline for map display
  };
  start_latlng?: [number, number]; // [latitude, longitude]
}

/**
 * Response of the Strava OAuth token exchange and refresh
 * (POST https://www.strava.com/oauth/token).
 */
export interface StravaTokenResponse {
  token_type: 'Bearer';
  expires_at: number; // epoch seconds when the access token expires
  expires_in: number; // seconds until expiry
  refresh_token: string;
  access_token: string;
  /** Space-delimited granted scopes (present on the initial exchange). */
  scope?: string;
  /** Summary athlete (present on the initial exchange, not on refresh). */
  athlete: StravaSummaryAthlete;
}

import { MockStravaApiClient } from './mock-strava-api.client';

describe('MockStravaApiClient', () => {
  let client: MockStravaApiClient;

  beforeEach(() => {
    client = new MockStravaApiClient();
  });

  describe('getAuthorizationUrl', () => {
    it('points at the configured redirect URI and carries scope + state', () => {
      const client = new MockStravaApiClient('http://localhost:3000/auth/strava/callback');
      const url = client.getAuthorizationUrl({ state: 'abc' });

      expect(url).toContain('http://localhost:3000/auth/strava/callback');
      expect(url).toContain('code=mock-code');
      expect(url).toContain('state=abc');
      expect(url).toMatch(/scope=/);
    });
  });

  describe('refreshToken', () => {
    it('returns a fresh Strava-shaped token for the same athlete', async () => {
      const initial = await client.exchangeToken('mock-code');
      const refreshed = await client.refreshToken(initial.refresh_token);

      expect(refreshed.token_type).toBe('Bearer');
      expect(refreshed.access_token).toMatch(/^mock_access_/);
      expect(refreshed.athlete.id).toBe(initial.athlete.id);
    });
  });

  describe('deauthorize', () => {
    it('resolves without throwing', async () => {
      await expect(client.deauthorize('mock_access_1')).resolves.toBeUndefined();
    });
  });

  describe('exchangeToken', () => {
    it('returns a Strava-shaped token response with an athlete', async () => {
      const token = await client.exchangeToken('mock-code');

      expect(token.token_type).toBe('Bearer');
      expect(token.access_token).toMatch(/^mock_access_/);
      expect(token.refresh_token).toMatch(/^mock_refresh_/);
      expect(token.expires_at).toBeGreaterThan(token.expires_in - 1);
      expect(token.athlete).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          firstname: expect.any(String),
          lastname: expect.any(String),
        }),
      );
    });

    it('is deterministic for a given code', async () => {
      const a = await client.exchangeToken('mock-code');
      const b = await client.exchangeToken('mock-code');
      expect(a.access_token).toBe(b.access_token);
      expect(a.athlete.id).toBe(b.athlete.id);
    });
  });

  describe('getActivities', () => {
    it('returns activities in the Strava SummaryActivity shape (raw units)', async () => {
      const activities = await client.getActivities('mock_access_1');

      expect(activities.length).toBeGreaterThan(0);
      for (const a of activities) {
        expect(a).toEqual(
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            distance: expect.any(Number), // meters
            moving_time: expect.any(Number), // seconds
            total_elevation_gain: expect.any(Number), // meters
            sport_type: expect.any(String),
            start_date: expect.any(String),
          }),
        );
        // Distances are in meters (Strava raw), so a real ride is > 1000.
        expect(a.distance).toBeGreaterThan(1000);
      }
    });

    it('returns most recent first', async () => {
      const activities = await client.getActivities('mock_access_1');
      for (let i = 1; i < activities.length; i++) {
        expect(new Date(activities[i - 1].start_date).getTime()).toBeGreaterThanOrEqual(
          new Date(activities[i].start_date).getTime(),
        );
      }
    });

    it('is deterministic for a given access token', async () => {
      const a = await client.getActivities('mock_access_1');
      const b = await client.getActivities('mock_access_1');
      expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    });

    it('honors the `after` filter (incremental sync)', async () => {
      const all = await client.getActivities('mock_access_1');
      const mid = all[Math.floor(all.length / 2)];
      const afterSeconds = Math.floor(new Date(mid.start_date).getTime() / 1000);

      const filtered = await client.getActivities('mock_access_1', {
        after: afterSeconds,
      });

      expect(filtered.length).toBeLessThan(all.length);
      for (const a of filtered) {
        expect(new Date(a.start_date).getTime()).toBeGreaterThan(afterSeconds * 1000);
      }
    });

    it('honors perPage', async () => {
      const activities = await client.getActivities('mock_access_1', { perPage: 5 });
      expect(activities.length).toBeLessThanOrEqual(5);
    });
  });
});

import { StravaService } from './strava.service';
import { MockStravaApiClient } from './strava/mock-strava-api.client';

/**
 * Minimal in-memory Prisma stub covering the methods StravaService uses.
 */
function createFakePrisma() {
  const activities: any[] = [];
  const cyclists: Record<string, any> = {
    'cyclist-1': { id: 'cyclist-1' },
  };

  return {
    activities,
    cyclists,
    activity: {
      findUnique: async ({ where }: any) =>
        activities.find((a) => a.stravaId === where.stravaId) ?? null,
      findFirst: async ({ where, orderBy }: any) => {
        let rows = activities.filter(
          (a) =>
            a.cyclistId === where.cyclistId &&
            (where.isManual === undefined || a.isManual === where.isManual),
        );
        if (orderBy?.activityDate) {
          rows = [...rows].sort(
            (a, b) =>
              (orderBy.activityDate === 'desc' ? -1 : 1) *
              (a.activityDate.getTime() - b.activityDate.getTime()),
          );
        }
        return rows[0] ?? null;
      },
      create: async ({ data }: any) => {
        activities.push(data);
        return data;
      },
    },
    cyclist: {
      findUnique: async ({ where }: any) => cyclists[where.id] ?? null,
      update: async ({ where, data }: any) => {
        cyclists[where.id] = { ...cyclists[where.id], ...data };
        return cyclists[where.id];
      },
    },
  };
}

describe('StravaService (backed by MockStravaApiClient)', () => {
  let service: StravaService;
  let api: MockStravaApiClient;
  let prisma: ReturnType<typeof createFakePrisma>;

  beforeEach(() => {
    prisma = createFakePrisma();
    api = new MockStravaApiClient('http://localhost:3000/auth/strava/callback');
    service = new StravaService(api, prisma as any);
  });

  it('imports activities and converts units (m -> km, m/s -> km/h)', async () => {
    const imported = await service.importActivities('cyclist-1', 'mock_access_1');

    expect(imported).toBeGreaterThan(0);
    expect(prisma.activities.length).toBe(imported);

    const sample = prisma.activities[0];
    expect(sample.isManual).toBe(false);
    expect(sample.stravaId).toEqual(expect.any(String));
    // A road ride mocked at 25-110 km is stored in km, never raw meters.
    expect(sample.distance).toBeLessThan(200);
    expect(sample.distance).toBeGreaterThan(0);
    if (sample.averageSpeed != null) {
      // km/h, not m/s
      expect(sample.averageSpeed).toBeGreaterThan(10);
    }
  });

  it('deduplicates on a second import', async () => {
    const first = await service.importActivities('cyclist-1', 'mock_access_1');
    const second = await service.importActivities('cyclist-1', 'mock_access_1');

    expect(first).toBeGreaterThan(0);
    expect(second).toBe(0);
    expect(prisma.activities.length).toBe(first);
  });

  it('sync only adds activities newer than the last imported one', async () => {
    await service.importActivities('cyclist-1', 'mock_access_1');
    const added = await service.syncActivities('cyclist-1', 'mock_access_1');
    expect(added).toBe(0);
  });

  it('connect() stores tokens (with expiry) and imports activities', async () => {
    const { athlete, imported } = await service.connect('cyclist-1', 'mock-code');

    expect(imported).toBeGreaterThan(0);
    expect(athlete.id).toEqual(expect.any(Number));
    const cyclist = prisma.cyclists['cyclist-1'];
    expect(cyclist.stravaAccessToken).toMatch(/^mock_access_/);
    expect(cyclist.stravaRefreshToken).toMatch(/^mock_refresh_/);
    expect(cyclist.stravaId).toBe(athlete.id.toString());
    expect(cyclist.stravaConnectedAt).toBeInstanceOf(Date);
    // Token expiry is stored and in the future (~6h).
    expect(cyclist.stravaTokenExpiresAt).toBeInstanceOf(Date);
    expect(cyclist.stravaTokenExpiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('sync() works for a connected cyclist (no new activities right after connect)', async () => {
    await service.connect('cyclist-1', 'mock-code');
    const added = await service.sync('cyclist-1');
    expect(added).toBe(0);
  });

  it('sync() refreshes the access token when it has expired', async () => {
    await service.connect('cyclist-1', 'mock-code');

    // Force the stored token to be expired.
    prisma.cyclists['cyclist-1'].stravaTokenExpiresAt = new Date(
      Date.now() - 60 * 1000,
    );
    const refreshSpy = jest.spyOn(api, 'refreshToken');

    await service.sync('cyclist-1');

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    // A fresh expiry is persisted back.
    expect(prisma.cyclists['cyclist-1'].stravaTokenExpiresAt.getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it('disconnect() revokes on Strava and clears tokens but keeps activities', async () => {
    await service.connect('cyclist-1', 'mock-code');
    const count = prisma.activities.length;
    const deauthSpy = jest.spyOn(api, 'deauthorize');

    await service.disconnect('cyclist-1');

    expect(deauthSpy).toHaveBeenCalledTimes(1);
    const cyclist = prisma.cyclists['cyclist-1'];
    expect(cyclist.stravaAccessToken).toBeNull();
    expect(cyclist.stravaId).toBeNull();
    expect(cyclist.stravaTokenExpiresAt).toBeNull();
    expect(prisma.activities.length).toBe(count);
  });

  it('getAuthorizationUrl() returns a Strava-style URL carrying state', () => {
    const url = service.getAuthorizationUrl({ state: 'xyz' });
    expect(url).toContain('state=xyz');
    expect(url).toContain('scope=');
  });
});

import {
  StravaSummaryActivity,
  StravaSummaryAthlete,
} from './strava-api.types';

/**
 * Deterministic mock data generator for the Strava API.
 *
 * Pure functions (no DI, no I/O) so they can be reused both by the
 * MockStravaApiClient (runtime) and by the Prisma seed script (offline).
 * Determinism (seeded PRNG) means the same access token always yields the
 * same activities — useful for reproducible demos and tests.
 */

/** Small deterministic PRNG (mulberry32). Returns a function in [0, 1). */
function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = Math.trunc(a);
    a = Math.trunc(a + 0x6d2b79f5);
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable hash of a string into a 32-bit unsigned int (for seeding the PRNG). */
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface MockProfile {
  sport_type: string;
  type: string;
  /** [minKm, maxKm] distance range for one ride. */
  distanceKm: [number, number];
  /** [min, max] meters of elevation gain. */
  elevation: [number, number];
  /** [min, max] average speed in km/h. */
  speedKmh: [number, number];
  namePool: string[];
  /** Relative weight in the activity mix. */
  weight: number;
}

const PROFILES: MockProfile[] = [
  {
    sport_type: 'Ride',
    type: 'Ride',
    distanceKm: [25, 110],
    elevation: [150, 1400],
    speedKmh: [26, 34],
    namePool: ['Sortie route matinale', 'Cols du week-end', 'Entraînement seuil', 'Boucle vallonnée'],
    weight: 5,
  },
  {
    sport_type: 'GravelRide',
    type: 'Ride',
    distanceKm: [30, 90],
    elevation: [200, 1100],
    speedKmh: [20, 27],
    namePool: ['Aventure gravel', 'Chemins blancs', 'Exploration off-road', 'Sortie gravel club'],
    weight: 3,
  },
  {
    sport_type: 'MountainBikeRide',
    type: 'Ride',
    distanceKm: [15, 45],
    elevation: [400, 1600],
    speedKmh: [14, 20],
    namePool: ['Sortie VTT forêt', 'Descente technique', 'Enduro du dimanche', 'Single tracks'],
    weight: 2,
  },
];

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min;
}

function pickWeighted(rng: () => number): MockProfile {
  const total = PROFILES.reduce((s, p) => s + p.weight, 0);
  let r = rng() * total;
  for (const p of PROFILES) {
    r -= p.weight;
    if (r <= 0) return p;
  }
  return PROFILES[0];
}

/** Mock athlete derived deterministically from a seed string. */
export function generateMockAthlete(seed: string): StravaSummaryAthlete {
  const id = hashString(`athlete:${seed}`) % 100000000;
  const firstname = 'Jean';
  const lastname = 'Dupont';
  // Real, resolvable placeholder avatars (initials) so the frontend can display
  // them, while keeping the same `profile` / `profile_medium` field shape as
  // the real Strava athlete object.
  const avatar = (size: number) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${firstname} ${lastname}`,
    )}&size=${size}&background=fc4c02&color=fff`;
  return {
    id,
    username: 'demo_rider',
    firstname,
    lastname,
    city: 'Clermont-Ferrand',
    country: 'France',
    sex: 'M',
    profile: avatar(256),
    profile_medium: avatar(64),
  };
}

export interface GenerateActivitiesOptions {
  /** Reference "now" — activities are spread over the months before it. */
  now: Date;
  /** Number of activities to generate. */
  count?: number;
  /** Average days between two activities. */
  avgDaysBetween?: number;
}

/**
 * Generate a deterministic list of Strava-shaped activities, most recent first,
 * spread backwards from `now`. Units match the Strava API (meters, seconds, m/s).
 */
export function generateMockActivities(
  seed: string,
  options: GenerateActivitiesOptions,
): StravaSummaryActivity[] {
  const { now, count = 42, avgDaysBetween = 4 } = options;
  const rng = createRng(hashString(seed));
  const activities: StravaSummaryActivity[] = [];

  let cursor = now.getTime();
  for (let i = 0; i < count; i++) {
    // Step back a randomized number of days so dates feel organic.
    const stepDays = randFloat(rng, avgDaysBetween * 0.4, avgDaysBetween * 1.6);
    cursor -= stepDays * 24 * 60 * 60 * 1000;
    // Anchor to a plausible riding hour (7h-18h).
    const start = new Date(cursor);
    start.setHours(randInt(rng, 7, 18), randInt(rng, 0, 59), 0, 0);

    const profile = pickWeighted(rng);
    const distanceKm = randFloat(rng, profile.distanceKm[0], profile.distanceKm[1]);
    const speedKmh = randFloat(rng, profile.speedKmh[0], profile.speedKmh[1]);
    const distanceM = distanceKm * 1000;
    const avgSpeedMs = speedKmh / 3.6;
    const movingTime = Math.round(distanceM / avgSpeedMs);
    const elapsedTime = movingTime + randInt(rng, 0, Math.round(movingTime * 0.2));
    const id = hashString(`${seed}:activity:${i}:${start.getTime()}`);

    // Generate a simple mock polyline (Paris area for example)
    const baseLat = 48.8566 + randFloat(rng, -0.05, 0.05);
    const baseLng = 2.3522 + randFloat(rng, -0.05, 0.05);
    const mockPolyline = `u{hiH{qM${randInt(rng, 10, 50)}@${randInt(rng, 10, 50)}@${randInt(rng, 10, 50)}@`;

    activities.push({
      id,
      name: profile.namePool[randInt(rng, 0, profile.namePool.length - 1)],
      distance: Math.round(distanceM),
      moving_time: movingTime,
      elapsed_time: elapsedTime,
      total_elevation_gain: randInt(rng, profile.elevation[0], profile.elevation[1]),
      type: profile.type,
      sport_type: profile.sport_type,
      start_date: start.toISOString(),
      start_date_local: start.toISOString(),
      average_speed: Math.round(avgSpeedMs * 100) / 100,
      max_speed: Math.round(avgSpeedMs * randFloat(rng, 1.3, 1.8) * 100) / 100,
      map: {
        summary_polyline: mockPolyline,
      },
      start_latlng: [baseLat, baseLng],
    });
  }

  // Most recent first, like the real Strava endpoint.
  return activities.sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
  );
}

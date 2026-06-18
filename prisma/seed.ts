import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import {
  generateMockActivities,
  generateMockAthlete,
} from '../src/modules/activities/strava/strava-mock.data';

const prisma = new PrismaClient();

interface TireCSVRow {
  // Product-level columns (constant within a Global ID)
  'Global ID': string;
  Brand: string;
  'Product Type': string;
  'Cycle Type': string;
  Segment: string;
  'Range (Internal)': string;
  'Web Range Name': string;
  'CYCLE TYPE WEB': string;
  Use: string;
  'Rubber Technologies': string;
  'Casing Technologies': string;
  'Tread Pattern Technologies': string;
  'Sidewall Type': string;
  Sealing: string;
  'Rim Type': string;
  Fitting: string;
  'E-Bike Technologies': string;
  // Variant-level columns (vary within a Global ID)
  'Designation (Internal)': string;
  'Web Product Designation': string;
  Bead: string;
  'EAN Code': string;
  'Width ETRTO': string;
  'Diameter ETRTO': string;
  'Web Width (mm)': string;
  'Web Diameter (mm)': string;
  'Weight (g)': string;
  'Minimum Pressure (Bar)': string;
  'Maximum Pressure (Bar)': string;
  TPI: string;
  'Terrain Types': string;
  'Reinforcement Technologies': string;
  'Sidewall Color': string;
  'Tread Pattern Color': string;
  'Recommended Inner Tube': string;
  'Discontinued Date': string;
}

async function parseTireCSV(): Promise<TireCSVRow[]> {
  const csvPath = path.join(__dirname, '..', 'Catalogue Produits Vélo 2026.csv');
  const results: TireCSVRow[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv({ separator: ';' })) // CSV uses semicolon separator
      .on('data', (data: TireCSVRow) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

function parseNumber(value: string | undefined | null): number | null {
  if (!value || value === '' || value === 'NOT APPLICABLE' || value === '-') return null;
  const parsed = parseFloat(value.replace(',', '.'));
  return isNaN(parsed) ? null : parsed;
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value || value === '' || value === 'NOT APPLICABLE') return null;

  // Format from CSV appears to be "mmm-yy" like "déc-25"
  // We'll parse this to a proper date
  const months: Record<string, number> = {
    'janv': 0, 'f�vr': 1, 'mars': 2, 'avr': 3, 'mai': 4, 'juin': 5,
    'juil': 6, 'ao�t': 7, 'sept': 8, 'oct': 9, 'nov': 10, 'd�c': 11,
  };

  const parts = value.split('-');
  if (parts.length !== 2) return null;

  const month = months[parts[0].toLowerCase()];
  const year = 2000 + parseInt(parts[1]);

  if (month === undefined || isNaN(year)) return null;

  return new Date(year, month, 1);
}

/** Trim a CSV cell, returning null for empty / placeholder values. */
function parseString(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === 'NOT APPLICABLE' || trimmed === '-') return null;
  return trimmed;
}

/** Round a parsed number to an integer, or null. */
function parseInteger(value: string | undefined | null): number | null {
  const parsed = parseNumber(value);
  return parsed === null ? null : Math.round(parsed);
}

/** Union of comma-separated terrain values across every variant, deduplicated. */
function aggregateTerrains(rows: TireCSVRow[]): string {
  const set = new Set<string>();
  for (const row of rows) {
    for (const part of (row['Terrain Types'] || '').split(',')) {
      const t = part.trim();
      if (t) set.add(t);
    }
  }
  return Array.from(set).join(',');
}

async function seedTires() {
  console.log('📦 Starting tire catalog import...\n');

  // Idempotent re-seed: variants cascade-delete with their parent tires.
  await prisma.tire.deleteMany({});

  const rows = await parseTireCSV();
  console.log(`Found ${rows.length} catalog rows in CSV\n`);

  // Group rows by Global ID — same Global ID = same product, different variants.
  const groups = new Map<string, TireCSVRow[]>();
  for (const row of rows) {
    const globalId = (row['Global ID'] || '').trim();
    if (!globalId) continue;
    const group = groups.get(globalId);
    if (group) group.push(row);
    else groups.set(globalId, [row]);
  }

  let imported = 0;
  let variantCount = 0;
  let skipped = 0;
  const now = new Date();

  for (const [globalId, variants] of groups) {
    try {
      const head = variants[0];
      const cycleTypeWeb = head['CYCLE TYPE WEB'] || head['Cycle Type'] || 'UNKNOWN';
      const isEBikeReady =
        cycleTypeWeb.includes('E-BIKE') ||
        variants.some((v) => parseString(v['E-Bike Technologies']) !== null);

      // Variant-level rows
      const variantData = variants.map((v) => {
        const discontinuedDate = parseDate(v['Discontinued Date']);
        return {
          designation: v['Designation (Internal)'] || '',
          webProductName: v['Web Product Designation'] || '',
          bead: parseString(v.Bead),
          eanCode: parseString(v['EAN Code']),
          widthEtrto: parseString(v['Width ETRTO']),
          diameterEtrto: parseString(v['Diameter ETRTO']),
          widthMm: parseInteger(v['Web Width (mm)']),
          diameterMm: parseInteger(v['Web Diameter (mm)']),
          weight: parseInteger(v['Weight (g)']),
          minPressure: parseNumber(v['Minimum Pressure (Bar)']),
          maxPressure: parseNumber(v['Maximum Pressure (Bar)']),
          tpi: parseString(v.TPI),
          terrainTypes: v['Terrain Types'] || '',
          reinforcementTech: parseString(v['Reinforcement Technologies']),
          sidewallColor: parseString(v['Sidewall Color']),
          treadPatternColor: parseString(v['Tread Pattern Color']),
          recommendedInnerTube: parseString(v['Recommended Inner Tube']),
          discontinuedDate,
          isDiscontinued: discontinuedDate !== null && discontinuedDate < now,
        };
      });

      // Product-level aggregates
      const weights = variantData
        .map((v) => v.weight)
        .filter((w): w is number => w !== null);
      const minWeight = weights.length ? Math.min(...weights) : null;

      await prisma.tire.create({
        data: {
          globalId,
          brand: head.Brand || 'MICHELIN',
          productType: head['Product Type'] || '',
          cycleType: head['Cycle Type'] || '',
          segment: head.Segment || '',
          rangeName: head['Web Range Name'] || head['Range (Internal)'] || '',
          rangeInternal: head['Range (Internal)'] || '',
          compatibleBikeTypes: cycleTypeWeb,
          useCases: head.Use || '',
          rubberTech: parseString(head['Rubber Technologies']),
          casingTech: parseString(head['Casing Technologies']),
          treadPatternTech: parseString(head['Tread Pattern Technologies']),
          sidewallType: parseString(head['Sidewall Type']),
          sealing: parseString(head.Sealing),
          rimType: parseString(head['Rim Type']),
          fitting: parseString(head.Fitting),
          terrainTypes: aggregateTerrains(variants),
          minWeight,
          isEBikeReady,
          isDiscontinued: variantData.every((v) => v.isDiscontinued),
          variants: { create: variantData },
        },
      });

      imported++;
      variantCount += variantData.length;
      if (imported % 25 === 0) {
        console.log(`Processed ${imported} products...`);
      }
    } catch (error) {
      console.error(`Error processing product ${globalId}:`, error);
      skipped++;
    }
  }

  console.log('\n✅ Tire catalog import complete!');
  console.log(`   - Products imported: ${imported}`);
  console.log(`   - Variants imported: ${variantCount}`);
  console.log(`   - Skipped: ${skipped}\n`);
}

/** Map a Strava sport_type/type to the app's BikeType (mirrors StravaService). */
function mapStravaToBikeType(type: string, sportType?: string): string {
  const key = (sportType || type).toLowerCase();
  switch (key) {
    case 'mountainbikeride':
    case 'mtb':
      return 'MTB';
    case 'gravelride':
    case 'gravel':
      return 'GRAVEL';
    case 'ebikeride':
    case 'emountainbikeride':
      return 'E_BIKE';
    default:
      return 'ROAD';
  }
}

/**
 * Pre-connect the demo cyclist to the mocked Strava API and persist their
 * activities. Uses the same deterministic generator as MockStravaApiClient,
 * and the same unit conversions / terrain defaults as StravaService.
 */
async function seedDemoStravaActivities(cyclistId: string) {
  const athlete = generateMockAthlete('mock-code');
  const accessToken = `mock_access_${athlete.id}`;

  const expiresIn = 6 * 60 * 60; // 6h, like Strava
  await prisma.cyclist.update({
    where: { id: cyclistId },
    data: {
      stravaId: athlete.id.toString(),
      stravaAccessToken: accessToken,
      stravaRefreshToken: `mock_refresh_${athlete.id}`,
      stravaTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      stravaConnectedAt: new Date(),
    },
  });

  // Same seed convention as MockStravaApiClient.getActivities so the stravaIds
  // match what a runtime connect would produce (dedup stays consistent).
  const activities = generateMockActivities(`athlete_${athlete.id}`, {
    now: new Date(),
  });
  let imported = 0;

  for (const a of activities) {
    const bikeType = mapStravaToBikeType(a.type, a.sport_type);
    await prisma.activity.upsert({
      where: { stravaId: a.id.toString() },
      update: {},
      create: {
        cyclistId,
        stravaId: a.id.toString(),
        bikeType,
        activityDate: new Date(a.start_date),
        distance: a.distance / 1000, // m -> km
        elevationGain: a.total_elevation_gain,
        movingTime: a.moving_time,
        averageSpeed: a.average_speed ? a.average_speed * 3.6 : null, // m/s -> km/h
        terrainAsphalt: bikeType === 'ROAD' ? 100 : 50,
        terrainOffroad: bikeType === 'MTB' ? 100 : bikeType === 'GRAVEL' ? 50 : 0,
        terrainMixed: bikeType === 'GRAVEL' ? 50 : 0,
        isManual: false,
      },
    });
    imported++;
  }

  console.log(`✅ Imported ${imported} mock Strava activities for demo cyclist\n`);
}

async function seedDemoData() {
  console.log('🌱 Seeding demo data...\n');

  // Create a demo admin user
  const adminUser = await prisma.cyclist.upsert({
    where: { email: 'admin@michelin.com' },
    update: {},
    create: {
      supabaseUserId: 'demo-admin-id', // Will be replaced by real Supabase ID
      email: 'admin@michelin.com',
      fullName: 'Admin Michelin',
      isAdmin: true,
      profile: {
        create: {
          practiceStyle: 'professional',
          primaryBikeType: 'ROAD',
        },
      },
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}\n`);

  // Create a demo cyclist
  const demoCyclist = await prisma.cyclist.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      supabaseUserId: 'demo-cyclist-id',
      email: 'demo@example.com',
      fullName: 'Jean Dupont',
      profile: {
        create: {
          practiceStyle: 'competition',
          primaryBikeType: 'ROAD',
          preferGrip: 7,
          preferEndurance: 8,
          preferLightness: 6,
          preferVersatility: 5,
        },
      },
      bikeTypes: {
        create: [
          { bikeType: 'ROAD', isPrimary: true },
          { bikeType: 'GRAVEL', isPrimary: false },
        ],
      },
    },
  });

  console.log(`✅ Created demo cyclist: ${demoCyclist.email}\n`);

  // Pre-connect the demo cyclist to (mocked) Strava and import activities so
  // the dashboard / recommendations are populated out of the box.
  await seedDemoStravaActivities(demoCyclist.id);

  // Create a demo club
  const demoClub = await prisma.club.create({
    data: {
      name: 'Lyon Gravel Riders',
      description: 'Club de cyclisme gravel dans la région lyonnaise — sorties hebdomadaires et événements tout au long de l\'année.',
      isMultiBikeType: false,
      bikeTypeFilter: 'GRAVEL',
      city: 'Lyon',
      region: 'Auvergne-Rhône-Alpes',
      foundedYear: 2019,
      isPremium: true,
      isMichelinPartner: true,
      creatorId: demoCyclist.id,
      memberships: {
        create: {
          cyclistId: demoCyclist.id,
          isManager: true,
        },
      },
    },
  });

  console.log(`✅ Created demo club: ${demoClub.name}\n`);

  // Create demo club events
  const now = new Date();
  const nextSaturday = new Date(now);
  nextSaturday.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7));
  nextSaturday.setHours(8, 0, 0, 0);

  const nextSunday = new Date(nextSaturday);
  nextSunday.setDate(nextSaturday.getDate() + 1);

  const weekAfter = new Date(nextSaturday);
  weekAfter.setDate(nextSaturday.getDate() + 7);

  await prisma.club_events.createMany({
    data: [
      {
        clubId: demoClub.id,
        title: 'Sortie gravel — Monts du Lyonnais',
        discipline: 'GRAVEL',
        eventDate: nextSaturday,
        departureLabel: 'Parking Parc de Parilly',
        distance: 75.0,
        elevation: 1200.0,
        level: 'Intermédiaire',
        bikeType: 'GRAVEL',
        isOfficial: false,
        requiresLicense: false,
        createdById: demoCyclist.id,
        updatedAt: new Date(),
      },
      {
        clubId: demoClub.id,
        title: 'Brevet officiel 100 km',
        discipline: 'GRAVEL',
        eventDate: nextSunday,
        departureLabel: 'Place Bellecour, Lyon',
        distance: 100.0,
        elevation: 1800.0,
        level: 'Avancé',
        bikeType: 'GRAVEL',
        isOfficial: true,
        requiresLicense: true,
        createdById: demoCyclist.id,
        updatedAt: new Date(),
      },
      {
        clubId: demoClub.id,
        title: 'Découverte Beaujolais',
        discipline: 'GRAVEL',
        eventDate: weekAfter,
        departureLabel: 'Gare de Villefranche-sur-Saône',
        distance: 45.0,
        elevation: 600.0,
        level: 'Découverte',
        bikeType: 'GRAVEL',
        isOfficial: false,
        requiresLicense: false,
        createdById: demoCyclist.id,
        updatedAt: new Date(),
      },
    ],
  });

  console.log(`✅ Created demo club events\n`);

  // Create demo club routes
  await prisma.club_routes.createMany({
    data: [
      {
        clubId: demoClub.id,
        title: 'Circuit des Crêtes — Pilat',
        distanceKm: 82.5,
        elevationGain: 1450,
        discipline: 'GRAVEL',
        level: 'Avancé',
        thumbnailUrl: null,
        completedCount: 14,
        createdById: demoCyclist.id,
      },
      {
        clubId: demoClub.id,
        title: 'Boucle du Beaujolais',
        distanceKm: 55.0,
        elevationGain: 820,
        discipline: 'GRAVEL',
        level: 'Intermédiaire',
        thumbnailUrl: null,
        completedCount: 28,
        createdById: demoCyclist.id,
      },
      {
        clubId: demoClub.id,
        title: 'Initiation Gravel — Plaine de l\'Ain',
        distanceKm: 38.0,
        elevationGain: 310,
        discipline: 'GRAVEL',
        level: 'Découverte',
        thumbnailUrl: null,
        completedCount: 42,
        createdById: demoCyclist.id,
      },
    ],
  });

  console.log(`✅ Created demo club routes\n`);

  // Create a club invitation (upsert to avoid duplicate token errors)
  const invitation = await prisma.clubInvitation.upsert({
    where: { token: 'demo-invitation-token' },
    update: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    create: {
      clubId: demoClub.id,
      creatorId: demoCyclist.id,
      token: 'demo-invitation-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ Created demo invitation: ${invitation.token}\n`);

  console.log('✨ Demo data seeding complete!\n');
}

async function main() {
  try {
    console.log('🚀 Starting database seeding...\n');

    // Import tire catalog
    await seedTires();

    // Create demo data
    await seedDemoData();

    console.log('✅ All seeding complete!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

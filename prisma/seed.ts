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
  'Global ID': string;
  Brand: string;
  'Product Type': string;
  'Cycle Type': string;
  Segment: string;
  'Range (Internal)': string;
  'Web Range Name': string;
  'Web Product Designation': string;
  'Designation (Internal)': string;
  'Web Diameter (mm)': string;
  'Web Width (mm)': string;
  'Weight (g)': string;
  'Minimum Pressure (Bar)': string;
  'Maximum Pressure (Bar)': string;
  'Terrain Types': string;
  Use: string;
  'Rubber Technologies': string;
  'Casing Technologies': string;
  'Reinforcement Technologies': string;
  'E-Bike Technologies': string;
  'CYCLE TYPE WEB': string;
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

async function seedTires() {
  console.log('📦 Starting tire catalog import...\n');

  const rows = await parseTireCSV();
  console.log(`Found ${rows.length} tires in CSV\n`);

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const globalId = row['Global ID'];
      if (!globalId || globalId === '') {
        skipped++;
        continue;
      }

      const cycleTypeWeb = row['CYCLE TYPE WEB'] || row['Cycle Type'] || 'UNKNOWN';
      const isEBikeReady = (row['E-Bike Technologies'] && row['E-Bike Technologies'] !== '') ||
                           cycleTypeWeb.includes('E-BIKE');

      const discontinuedDate = parseDate(row['Discontinued Date']);

      const tireData = {
        globalId,
        brand: row.Brand || 'MICHELIN',
        productType: row['Product Type'] || '',
        rangeName: row['Web Range Name'] || row['Range (Internal)'] || '',
        webProductName: row['Web Product Designation'] || '',
        designation: row['Designation (Internal)'] || '',
        compatibleBikeTypes: cycleTypeWeb,
        useCases: row.Use || '',
        terrainTypes: row['Terrain Types'] || '',
        rubberTech: row['Rubber Technologies'] || null,
        casingTech: row['Casing Technologies'] || null,
        reinforcementTech: row['Reinforcement Technologies'] || null,
        width: parseNumber(row['Web Width (mm)']),
        diameter: parseNumber(row['Web Diameter (mm)']),
        weight: parseNumber(row['Weight (g)']),
        minPressure: parseNumber(row['Minimum Pressure (Bar)']),
        maxPressure: parseNumber(row['Maximum Pressure (Bar)']),
        isEBikeReady,
        isDiscontinued: discontinuedDate !== null && discontinuedDate < new Date(),
        discontinuedDate,
      };

      const existing = await prisma.tire.findUnique({
        where: { globalId },
      });

      if (existing) {
        await prisma.tire.update({
          where: { globalId },
          data: tireData,
        });
        updated++;
      } else {
        await prisma.tire.create({
          data: tireData,
        });
        imported++;
      }

      if ((imported + updated) % 50 === 0) {
        console.log(`Processed ${imported + updated} tires...`);
      }
    } catch (error) {
      console.error(`Error processing tire ${row['Global ID']}:`, error);
      skipped++;
    }
  }

  console.log('\n✅ Tire catalog import complete!');
  console.log(`   - Imported: ${imported}`);
  console.log(`   - Updated: ${updated}`);
  console.log(`   - Skipped: ${skipped}`);
  console.log(`   - Total in database: ${imported + updated}\n`);
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
      name: 'Vélo Club Paris',
      description: 'Club de cyclisme route et gravel dans la région parisienne',
      isMultiBikeType: true,
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

  // Create a club invitation
  const invitation = await prisma.clubInvitation.create({
    data: {
      clubId: demoClub.id,
      creatorId: demoCyclist.id,
      token: 'demo-invitation-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
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

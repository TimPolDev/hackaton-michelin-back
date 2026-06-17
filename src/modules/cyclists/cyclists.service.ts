import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCyclistDto } from './dto/update-cyclist.dto';

@Injectable()
export class CyclistsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cyclist.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        isAmbassador: true,
        createdAt: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });
  }

  async findBySupabaseId(supabaseUserId: string) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId },
      select: {
        id: true,
        email: true,
        fullName: true,
        stravaId: true,
        stravaConnectedAt: true,
        isAdmin: true,
        isAmbassador: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        bikeTypes: true,
        clubMemberships: {
          include: {
            club: true,
          },
        },
      },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    return cyclist;
  }

  async getStats(supabaseUserId: string, bikeType?: string, period: string = 'month') {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'season':
        startDate = new Date(now.getFullYear(), 0, 1); // Start of year
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Build where clause
    const where: any = {
      cyclistId: cyclist.id,
      activityDate: {
        gte: startDate,
      },
    };

    if (bikeType) {
      where.bikeType = bikeType;
    }

    // Aggregate activities
    const activities = await this.prisma.activity.findMany({
      where,
    });

    const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
    const totalElevation = activities.reduce((sum, a) => sum + a.elevationGain, 0);
    const totalMovingTime = activities.reduce((sum, a) => sum + a.movingTime, 0);
    const averageSpeed = totalMovingTime > 0 ? (totalDistance / (totalMovingTime / 3600)) : 0;

    // Calculate terrain distribution
    let totalAsphalt = 0;
    let totalOffroad = 0;
    let totalMixed = 0;

    activities.forEach(a => {
      totalAsphalt += a.terrainAsphalt;
      totalOffroad += a.terrainOffroad;
      totalMixed += a.terrainMixed;
    });

    const totalTerrain = totalAsphalt + totalOffroad + totalMixed;
    const terrainDistribution = totalTerrain > 0 ? {
      asphalt: Math.round((totalAsphalt / totalTerrain) * 100) / 100,
      offroad: Math.round((totalOffroad / totalTerrain) * 100) / 100,
      mixed: Math.round((totalMixed / totalTerrain) * 100) / 100,
    } : { asphalt: 0, offroad: 0, mixed: 0 };

    // Get last activity (most recent)
    const lastActivity = activities.length > 0
      ? activities.reduce((latest, current) =>
          current.activityDate > latest.activityDate ? current : latest
        )
      : null;

    return {
      bikeType,
      period,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalElevation: Math.round(totalElevation),
      activityCount: activities.length,
      averageSpeed: Math.round(averageSpeed * 10) / 10,
      terrainDistribution,
      lastActivity: lastActivity ? {
        activityDate: lastActivity.activityDate,
        distance: lastActivity.distance,
        bikeType: lastActivity.bikeType,
      } : null,
    };
  }

  async update(supabaseUserId: string, dto: UpdateCyclistDto) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    // Update cyclist
    const updated = await this.prisma.cyclist.update({
      where: { id: cyclist.id },
      data: {
        fullName: dto.fullName,
      },
      include: {
        profile: true,
        bikeTypes: true,
      },
    });

    // Update profile if provided
    if (dto.practiceStyle || dto.preferences) {
      await this.prisma.cyclistProfile.update({
        where: { cyclistId: cyclist.id },
        data: {
          practiceStyle: dto.practiceStyle,
          preferGrip: dto.preferences?.grip,
          preferEndurance: dto.preferences?.endurance,
          preferLightness: dto.preferences?.lightness,
          preferVersatility: dto.preferences?.versatility,
        },
      });
    }

    return this.findBySupabaseId(supabaseUserId);
  }
}

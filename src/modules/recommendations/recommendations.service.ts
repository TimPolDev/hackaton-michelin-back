import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(cyclistId: string, bikeType?: string) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { id: cyclistId },
      include: {
        profile: true,
        bikeTypes: true,
        activities: {
          where: bikeType ? { bikeType } : undefined,
          orderBy: { activityDate: 'desc' },
          take: 100,
        },
      },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    const targetBikeType = bikeType || cyclist.profile?.primaryBikeType || 'ROAD';

    // Calculate riding profile
    const activities = cyclist.activities;
    const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
    const avgElevation = activities.length > 0
      ? activities.reduce((sum, a) => sum + a.elevationGain, 0) / activities.length
      : 0;

    // Calculate terrain percentages
    let asphalt = 0, offroad = 0, mixed = 0;
    activities.forEach(a => {
      asphalt += a.terrainAsphalt;
      offroad += a.terrainOffroad;
      mixed += a.terrainMixed;
    });
    const totalTerrain = asphalt + offroad + mixed || 1;

    const terrainProfile = {
      asphalt: asphalt / totalTerrain,
      offroad: offroad / totalTerrain,
      mixed: mixed / totalTerrain,
    };

    // Get compatible tires
    const tires = await this.prisma.tire.findMany({
      where: {
        compatibleBikeTypes: { contains: targetBikeType },
        isDiscontinued: false,
      },
    });

    // Score each tire
    const scoredTires = tires.map(tire => {
      let score = 0;

      // Terrain matching (40% weight)
      if (tire.terrainTypes.includes('ASPHALT') && terrainProfile.asphalt > 0.5) score += 40;
      if (tire.terrainTypes.includes('OFFROAD') && terrainProfile.offroad > 0.5) score += 40;
      if (tire.terrainTypes.includes('MIXED') && terrainProfile.mixed > 0.3) score += 30;

      // Use case matching (30% weight)
      const monthlyDistance = totalDistance / Math.max(1, activities.length / 30);
      if (monthlyDistance > 300 && tire.useCases.includes('RACING')) score += 30;
      if (monthlyDistance > 200 && tire.useCases.includes('ENDURANCE')) score += 25;
      if (monthlyDistance < 200 && tire.useCases.includes('VERSATILE')) score += 20;

      // Elevation profile (20% weight)
      if (avgElevation > 500 && tire.minWeight && tire.minWeight < 300) score += 20;
      if (avgElevation < 200 && tire.useCases.includes('SPEED')) score += 15;

      // User preferences (10% weight)
      if (cyclist.profile) {
        if (cyclist.profile.preferGrip > 7 && tire.rubberTech?.includes('GUM-X')) score += 5;
        if (cyclist.profile.preferEndurance > 7 && tire.useCases.includes('ENDURANCE')) score += 5;
      }

      return { tire, score };
    });

    scoredTires.sort((a, b) => b.score - a.score);

    const topScore = scoredTires[0]?.score || 0;
    const recommendations = scoredTires.filter(t => t.score >= topScore - 5).slice(0, 3);

    const matchedAmbassador = await this.findMatchingAmbassador(recommendations[0]?.tire.id, targetBikeType);

    return {
      bikeType: targetBikeType,
      recommendations: recommendations.map(r => ({
        tire: r.tire,
        score: Math.min(100, Math.round(r.score)),
        explanation: this.generateExplanation(r.tire, cyclist, terrainProfile),
        matchedCriteria: this.getMatchedCriteria(r.tire, terrainProfile),
      })),
      matchedAmbassador,
    };
  }

  private generateExplanation(tire: any, cyclist: any, terrainProfile: any): string {
    const monthlyKm = Math.round(cyclist.activities.length > 0
      ? cyclist.activities.reduce((sum, a) => sum + a.distance, 0) / Math.max(1, cyclist.activities.length / 30)
      : 0);

    let explanation = `Avec ${monthlyKm} km/mois`;

    if (terrainProfile.asphalt > 0.7) explanation += ' sur route';
    else if (terrainProfile.offroad > 0.7) explanation += ' en tout-terrain';
    else explanation += ' sur terrain mixte';

    explanation += `, le ${tire.rangeName} est optimal pour votre profil.`;

    return explanation;
  }

  private getMatchedCriteria(tire: any, terrainProfile: any): string[] {
    const criteria: string[] = [];

    if (terrainProfile.asphalt > 0.5 && tire.terrainTypes.includes('ASPHALT')) {
      criteria.push('terrain_match');
    }

    if (tire.useCases.includes('ENDURANCE')) {
      criteria.push('endurance_profile');
    }

    if (tire.useCases.includes('RACING')) {
      criteria.push('performance_oriented');
    }

    return criteria;
  }

  private async findMatchingAmbassador(tireId: string, bikeType: string) {
    if (!tireId) return null;

    const ambassadorTire = await this.prisma.ambassadorTire.findFirst({
      where: {
        tireId,
        bikeType,
      },
      include: {
        ambassador: {
          include: {
            cyclist: true,
          },
        },
        tire: true,
      },
    });

    if (!ambassadorTire) {
      const fallback = await this.prisma.ambassadorTire.findFirst({
        where: { bikeType },
        include: {
          ambassador: { include: { cyclist: true } },
          tire: true,
        },
      });

      return fallback ? {
        id: fallback.ambassador.id,
        fullName: fallback.ambassador.cyclist.fullName,
        bio: fallback.ambassador.bio,
        tire: fallback.tire.rangeName,
        testimonial: fallback.testimonial,
      } : null;
    }

    return {
      id: ambassadorTire.ambassador.id,
      fullName: ambassadorTire.ambassador.cyclist.fullName,
      bio: ambassadorTire.ambassador.bio,
      tire: ambassadorTire.tire.rangeName,
      testimonial: ambassadorTire.testimonial,
    };
  }
}

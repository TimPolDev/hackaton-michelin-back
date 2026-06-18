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

      // Base compatibility score (10 points for being compatible with bike type)
      score += 10;

      // Terrain matching (40% weight) - Progressive scoring
      const terrainScore = this.calculateTerrainScore(tire.terrainTypes, terrainProfile);
      score += terrainScore * 40;

      // Use case matching (30% weight)
      const monthlyDistance = this.calculateMonthlyDistance(activities, totalDistance);
      const useCaseScore = this.calculateUseCaseScore(tire.useCases, monthlyDistance);
      score += useCaseScore * 30;
      // Elevation profile (20% weight)
      if (avgElevation > 500 && tire.minWeight && tire.minWeight < 300) score += 20;
      if (avgElevation < 200 && tire.useCases.includes('SPEED')) score += 15;
      // Elevation profile (15% weight)
      const elevationScore = this.calculateElevationScore(tire, avgElevation);
      score += elevationScore * 15;

      // User preferences (15% weight)
      const preferenceScore = this.calculatePreferenceScore(tire, cyclist.profile);
      score += preferenceScore * 15;

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

  /**
   * Calculate terrain match score (0-1 scale)
   * Progressive scoring based on actual terrain distribution
   */
  private calculateTerrainScore(tireTerrainTypes: string, terrainProfile: any): number {
    let score = 0;
    let matchCount = 0;

    // Check each terrain type and calculate progressive match
    if (tireTerrainTypes.includes('ASPHALT')) {
      score += terrainProfile.asphalt;
      matchCount++;
    }
    if (tireTerrainTypes.includes('OFFROAD')) {
      score += terrainProfile.offroad;
      matchCount++;
    }
    if (tireTerrainTypes.includes('MIXED')) {
      // Mixed terrain bonus if user has balanced riding
      const isBalanced = Math.min(terrainProfile.asphalt, terrainProfile.offroad) > 0.2;
      score += isBalanced ? 0.8 : terrainProfile.mixed;
      matchCount++;
    }

    // If tire supports multiple terrains and user rides on multiple terrains, bonus
    if (matchCount > 1) {
      const userTerrainVariety = (terrainProfile.asphalt > 0.2 ? 1 : 0) +
                                  (terrainProfile.offroad > 0.2 ? 1 : 0) +
                                  (terrainProfile.mixed > 0.2 ? 1 : 0);
      if (userTerrainVariety > 1) {
        score += 0.2; // Versatility bonus
      }
    }

    return Math.min(1, score / Math.max(1, matchCount));
  }

  /**
   * Calculate monthly distance from activities
   */
  private calculateMonthlyDistance(activities: any[], totalDistance: number): number {
    if (activities.length === 0) return 0;

    // Calculate time span of activities
    const dates = activities.map(a => new Date(a.activityDate).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const daySpan = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    const monthSpan = Math.max(1, daySpan / 30);

    return totalDistance / monthSpan;
  }

  /**
   * Calculate use case match score (0-1 scale)
   */
  private calculateUseCaseScore(useCases: string, monthlyDistance: number): number {
    let score = 0.3; // Base score for any tire

    // Racing: high intensity, high distance
    if (useCases.includes('RACING')) {
      if (monthlyDistance > 400) score = 1.0;
      else if (monthlyDistance > 300) score = 0.9;
      else if (monthlyDistance > 200) score = 0.7;
      else score = 0.5;
    }

    // Endurance: consistent, moderate to high distance
    if (useCases.includes('ENDURANCE')) {
      if (monthlyDistance > 300) score = Math.max(score, 1.0);
      else if (monthlyDistance > 200) score = Math.max(score, 0.95);
      else if (monthlyDistance > 100) score = Math.max(score, 0.8);
      else score = Math.max(score, 0.6);
    }

    // Versatile: good for all distances
    if (useCases.includes('VERSATILE')) {
      score = Math.max(score, 0.85); // Always good score for versatile
    }

    // Training: moderate distances
    if (useCases.includes('TRAINING')) {
      if (monthlyDistance > 150 && monthlyDistance < 350) score = Math.max(score, 0.9);
      else if (monthlyDistance > 100) score = Math.max(score, 0.8);
      else score = Math.max(score, 0.7);
    }

    // Commuting: lower distances, regular use
    if (useCases.includes('COMMUTING')) {
      if (monthlyDistance < 200) score = Math.max(score, 0.85);
      else score = Math.max(score, 0.7);
    }

    return Math.min(1, score);
  }

  /**
   * Calculate elevation profile match score (0-1 scale)
   */
  private calculateElevationScore(tire: any, avgElevation: number): number {
    let score = 0.5; // Neutral base score

    // High elevation (climbing) - prefer lightweight, grippy tires
    if (avgElevation > 500) {
      if (tire.minWeight && tire.minWeight < 250) score = 1.0;
      else if (tire.minWeight && tire.minWeight < 300) score = 0.9;
      else if (tire.useCases.includes('RACING') || tire.rubberTech?.includes('GUM-X')) score = 0.8;
      else score = 0.6;
    }
    // Moderate elevation
    else if (avgElevation > 200) {
      if (tire.useCases.includes('VERSATILE') || tire.useCases.includes('ENDURANCE')) score = 0.9;
      else score = 0.7;
    }
    // Flat terrain - prefer speed, durability
    else {
      if (tire.useCases.includes('SPEED') || tire.useCases.includes('RACING')) score = 1.0;
      else if (tire.useCases.includes('ENDURANCE')) score = 0.9;
      else score = 0.7;
    }

    return score;
  }

  /**
   * Calculate user preference match score (0-1 scale)
   */
  private calculatePreferenceScore(tire: any, profile: any): number {
    if (!profile) return 0.5; // Neutral if no profile

    let score = 0;
    let criteriaCount = 0;

    // Grip preference
    if (profile.preferGrip) {
      criteriaCount++;
      if (profile.preferGrip > 7 && tire.rubberTech?.includes('GUM-X')) {
        score += 1.0;
      } else if (profile.preferGrip > 5 && tire.useCases.includes('GRIP')) {
        score += 0.8;
      } else {
        score += 0.5;
      }
    }

    // Endurance preference
    if (profile.preferEndurance) {
      criteriaCount++;
      if (profile.preferEndurance > 7 && tire.useCases.includes('ENDURANCE')) {
        score += 1.0;
      } else if (profile.preferEndurance > 5 && tire.casingTech) {
        score += 0.7;
      } else {
        score += 0.5;
      }
    }

    // Lightness preference
    if (profile.preferLightness) {
      criteriaCount++;
      if (profile.preferLightness > 7 && tire.minWeight && tire.minWeight < 250) {
        score += 1.0;
      } else if (profile.preferLightness > 5 && tire.minWeight && tire.minWeight < 300) {
        score += 0.8;
      } else {
        score += 0.5;
      }
    }

    // Versatility preference
    if (profile.preferVersatility) {
      criteriaCount++;
      if (profile.preferVersatility > 7 && tire.useCases.includes('VERSATILE')) {
        score += 1.0;
      } else if (profile.preferVersatility > 5) {
        // Check if tire supports multiple terrains
        const terrainCount = (tire.terrainTypes.split(',') || []).length;
        score += terrainCount > 1 ? 0.8 : 0.5;
      } else {
        score += 0.5;
      }
    }

    return criteriaCount > 0 ? score / criteriaCount : 0.5;
  }
}

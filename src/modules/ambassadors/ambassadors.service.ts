import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AmbassadorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { bikeType?: string; featured?: boolean }) {
    const where: any = {};

    if (filters?.featured !== undefined) {
      where.isFeatured = filters.featured;
    }

    const ambassadors = await this.prisma.ambassadorProfile.findMany({
      where,
      include: {
        cyclist: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        tires: {
          where: filters?.bikeType ? { bikeType: filters.bikeType } : undefined,
          include: {
            tire: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { displayOrder: 'asc' },
      ],
    });

    // Calculate stats if showRidingData is true
    return Promise.all(ambassadors.map(async (ambassador) => {
      let stats = null;

      if (ambassador.showRidingData) {
        const activities = await this.prisma.activity.findMany({
          where: {
            cyclistId: ambassador.cyclistId,
          },
          orderBy: {
            activityDate: 'desc',
          },
          take: 100, // Last 100 activities
        });

        if (activities.length > 0) {
          const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
          const totalElevation = activities.reduce((sum, a) => sum + a.elevationGain, 0);
          const monthlyDistance = Math.round(totalDistance / Math.max(1, activities.length / 30));

          stats = {
            monthlyDistance,
            totalElevation: Math.round(totalElevation),
          };
        }
      }

      return {
        id: ambassador.id,
        cyclist: ambassador.cyclist,
        bio: ambassador.bio,
        discipline: ambassador.discipline,
        skillLevel: ambassador.skillLevel,
        showRidingData: ambassador.showRidingData,
        isFeatured: ambassador.isFeatured,
        stats,
        tires: ambassador.tires.map(t => ({
          bikeType: t.bikeType,
          tire: t.tire,
          testimonial: t.testimonial,
        })),
      };
    }));
  }

  async findOne(id: string) {
    const ambassador = await this.prisma.ambassadorProfile.findUnique({
      where: { id },
      include: {
        cyclist: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        tires: {
          include: {
            tire: true,
          },
        },
      },
    });

    if (!ambassador) {
      return null;
    }

    let stats = null;
    if (ambassador.showRidingData) {
      const activities = await this.prisma.activity.findMany({
        where: {
          cyclistId: ambassador.cyclistId,
        },
        orderBy: {
          activityDate: 'desc',
        },
        take: 100,
      });

      if (activities.length > 0) {
        const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
        const totalElevation = activities.reduce((sum, a) => sum + a.elevationGain, 0);
        const monthlyDistance = Math.round(totalDistance / Math.max(1, activities.length / 30));

        stats = {
          monthlyDistance,
          totalElevation: Math.round(totalElevation),
        };
      }
    }

    return {
      id: ambassador.id,
      cyclist: ambassador.cyclist,
      bio: ambassador.bio,
      discipline: ambassador.discipline,
      skillLevel: ambassador.skillLevel,
      showRidingData: ambassador.showRidingData,
      featuredSegments: ambassador.featuredSegments,
      isFeatured: ambassador.isFeatured,
      stats,
      tires: ambassador.tires.map(t => ({
        bikeType: t.bikeType,
        tire: t.tire,
        testimonial: t.testimonial,
      })),
    };
  }
}

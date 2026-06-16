import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAmbassadorDto } from './dto/create-ambassador.dto';
import { UpdateAmbassadorDto } from './dto/update-ambassador.dto';

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
      let stats: { monthlyDistance: number; totalElevation: number } | null = null;

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

    let stats: { monthlyDistance: number; totalElevation: number } | null = null;
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

  async create(createAmbassadorDto: CreateAmbassadorDto) {
    // Check if cyclist exists
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { id: createAmbassadorDto.cyclistId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    // Check if ambassador profile already exists for this cyclist
    const existingAmbassador = await this.prisma.ambassadorProfile.findUnique({
      where: { cyclistId: createAmbassadorDto.cyclistId },
    });

    if (existingAmbassador) {
      throw new ConflictException('Ambassador profile already exists for this cyclist');
    }

    // Create ambassador profile
    const ambassador = await this.prisma.ambassadorProfile.create({
      data: {
        cyclistId: createAmbassadorDto.cyclistId,
        bio: createAmbassadorDto.bio,
        discipline: createAmbassadorDto.discipline,
        skillLevel: createAmbassadorDto.skillLevel,
        showRidingData: createAmbassadorDto.showRidingData ?? false,
        featuredSegments: createAmbassadorDto.featuredSegments,
        isFeatured: createAmbassadorDto.isFeatured ?? false,
        displayOrder: createAmbassadorDto.displayOrder ?? 0,
      },
      include: {
        cyclist: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Update cyclist isAmbassador flag
    await this.prisma.cyclist.update({
      where: { id: createAmbassadorDto.cyclistId },
      data: { isAmbassador: true },
    });

    return ambassador;
  }

  async update(id: string, updateAmbassadorDto: UpdateAmbassadorDto) {
    // Check if ambassador exists
    const existingAmbassador = await this.prisma.ambassadorProfile.findUnique({
      where: { id },
    });

    if (!existingAmbassador) {
      throw new NotFoundException('Ambassador not found');
    }

    // Update ambassador profile
    const ambassador = await this.prisma.ambassadorProfile.update({
      where: { id },
      data: {
        bio: updateAmbassadorDto.bio,
        discipline: updateAmbassadorDto.discipline,
        skillLevel: updateAmbassadorDto.skillLevel,
        showRidingData: updateAmbassadorDto.showRidingData,
        featuredSegments: updateAmbassadorDto.featuredSegments,
        isFeatured: updateAmbassadorDto.isFeatured,
        displayOrder: updateAmbassadorDto.displayOrder,
      },
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

    return ambassador;
  }

  async delete(id: string) {
    // Check if ambassador exists
    const ambassador = await this.prisma.ambassadorProfile.findUnique({
      where: { id },
      select: { cyclistId: true },
    });

    if (!ambassador) {
      throw new NotFoundException('Ambassador not found');
    }

    // Delete ambassador profile (cascade will delete related tires)
    await this.prisma.ambassadorProfile.delete({
      where: { id },
    });

    // Update cyclist isAmbassador flag
    await this.prisma.cyclist.update({
      where: { id: ambassador.cyclistId },
      data: { isAmbassador: false },
    });

    return { message: 'Ambassador deleted successfully' };
  }
}

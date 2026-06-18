import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TiresService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    bikeType?: string;
    segment?: string;
    terrainType?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {
      isDiscontinued: false,
    };

    if (filters?.bikeType) {
      where.compatibleBikeTypes = { contains: filters.bikeType };
    }

    if (filters?.segment) {
      where.segment = filters.segment;
    }

    // Terrain buckets over the comma-separated terrainTypes field:
    //  - ASPHALT  → tagged asphalt
    //  - OFFROAD  → any off-road surface; tokens come both with the OFFROAD
    //               prefix (OFFROAD MIXED/HARD PACKED/SOFT/MUD) and bare
    //               (MIXED, SOFT, MUD, HARD PACKED, HARD/DRY)
    //  - MIXED    → polyvalent: tagged BOTH asphalt and an off-road surface
    const offroadMatch = {
      OR: ['OFFROAD', 'MIXED', 'SOFT', 'MUD', 'HARD PACKED', 'HARD/DRY'].map(
        (token) => ({ terrainTypes: { contains: token } }),
      ),
    };
    if (filters?.terrainType === 'ASPHALT') {
      where.terrainTypes = { contains: 'ASPHALT' };
    } else if (filters?.terrainType === 'OFFROAD') {
      where.AND = [offroadMatch];
    } else if (filters?.terrainType === 'MIXED') {
      where.AND = [{ terrainTypes: { contains: 'ASPHALT' } }, offroadMatch];
    }

    if (filters?.search) {
      where.OR = [
        { rangeName: { contains: filters.search, mode: 'insensitive' } },
        {
          variants: {
            some: {
              webProductName: { contains: filters.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    // Pagination: clamp limit to a sane range; skip negative offsets.
    const take =
      filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : undefined;
    const skip = filters?.offset && filters.offset > 0 ? filters.offset : undefined;

    const [tires, total] = await Promise.all([
      this.prisma.tire.findMany({
        where,
        include: { variants: true },
        orderBy: { rangeName: 'asc' },
        take,
        skip,
      }),
      this.prisma.tire.count({ where }),
    ]);

    return { tires, total };
  }

  async findOne(id: string) {
    const tire = await this.prisma.tire.findUnique({
      where: { id },
      include: {
        variants: true,
        ambassadorTires: {
          include: {
            ambassador: {
              include: {
                cyclist: {
                  select: { id: true, fullName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!tire) {
      return null;
    }

    // Aplatissement de la relation : on expose un tableau `ambassadors` prêt à
    // l'emploi (témoignage rattaché à ce pneu + infos publiques de l'ambassadeur).
    const { ambassadorTires, ...rest } = tire;
    return {
      ...rest,
      ambassadors: ambassadorTires.map((at) => ({
        bikeType: at.bikeType,
        testimonial: at.testimonial,
        ambassador: {
          id: at.ambassador.id,
          cyclist: at.ambassador.cyclist,
          discipline: at.ambassador.discipline,
          skillLevel: at.ambassador.skillLevel,
          photoUrl: at.ambassador.photoUrl,
        },
      })),
    };
  }
}

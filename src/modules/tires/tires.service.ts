import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TiresService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    bikeType?: string;
    useCase?: string;
    terrainType?: string;
    search?: string;
  }) {
    const where: any = {
      isDiscontinued: false,
    };

    if (filters?.bikeType) {
      where.compatibleBikeTypes = { contains: filters.bikeType };
    }

    if (filters?.useCase) {
      where.useCases = { contains: filters.useCase };
    }

    if (filters?.terrainType) {
      where.terrainTypes = { contains: filters.terrainType };
    }

    if (filters?.search) {
      where.OR = [
        { rangeName: { contains: filters.search, mode: 'insensitive' } },
        { webProductName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [tires, total] = await Promise.all([
      this.prisma.tire.findMany({ where }),
      this.prisma.tire.count({ where }),
    ]);

    return { tires, total };
  }

  async findOne(id: string) {
    return this.prisma.tire.findUnique({ where: { id } });
  }
}

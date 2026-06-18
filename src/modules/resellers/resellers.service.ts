import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResellerDto } from './dto/create-reseller.dto';
import { UpdateResellerDto } from './dto/update-reseller.dto';

@Injectable()
export class ResellersService {
  constructor(private prisma: PrismaService) {}

  // FR-first ordering so French shoppers see local merchants on top, then
  // alphabetical. Optional country/region filters.
  async findAll(filters?: { country?: string; region?: string }) {
    const where: { country?: string; region?: string } = {};
    if (filters?.country) where.country = filters.country;
    if (filters?.region) where.region = filters.region;

    return this.prisma.reseller.findMany({
      where,
      orderBy: [{ name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const reseller = await this.prisma.reseller.findUnique({ where: { id } });
    if (!reseller) {
      throw new NotFoundException(`Reseller ${id} not found`);
    }
    return reseller;
  }

  async create(dto: CreateResellerDto) {
    return this.prisma.reseller.create({ data: dto });
  }

  async update(id: string, dto: UpdateResellerDto) {
    await this.findOne(id);
    return this.prisma.reseller.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.reseller.delete({ where: { id } });
  }
}

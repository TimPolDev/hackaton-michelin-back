import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(cyclistId: string, bikeType?: string, limit = 50, offset = 0) {
    const where: any = { cyclistId };
    if (bikeType) where.bikeType = bikeType;

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { activityDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { activities, total, limit, offset };
  }

  async updateBikeType(activityId: string, cyclistId: string, bikeType: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, cyclistId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return this.prisma.activity.update({
      where: { id: activityId },
      data: { bikeType },
    });
  }
}

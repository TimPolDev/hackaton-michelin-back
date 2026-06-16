import { Controller, Get, Patch, Param, Body, Query, Post } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { StravaService } from './strava.service';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly stravaService: StravaService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getActivities(
    @CurrentUser() user: CurrentUserData,
    @Query('bikeType') bikeType?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    return this.activitiesService.findAll(cyclist.id, bikeType, limit, offset);
  }

  @Patch(':id')
  async updateActivity(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body('bikeType') bikeType: string,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    return this.activitiesService.updateBikeType(id, cyclist.id, bikeType);
  }

  @Post('sync-strava')
  async syncStrava(@CurrentUser() user: CurrentUserData) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist.stravaAccessToken) {
      throw new Error('Strava not connected');
    }

    const count = await this.stravaService.syncActivities(cyclist.id, cyclist.stravaAccessToken);

    return {
      newActivitiesImported: count,
      lastSyncDate: new Date(),
    };
  }
}

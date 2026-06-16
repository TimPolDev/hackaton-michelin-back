import { Controller, Get, Patch, Param, Body, Query, Post, Delete, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ActivitiesService } from './activities.service';
import { StravaService } from './strava.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
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

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

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

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    return this.activitiesService.updateBikeType(id, cyclist.id, bikeType);
  }

  @Get('strava/authorize-url')
  async stravaAuthorizeUrl() {
    // `state` is returned so the frontend can store it and validate the value
    // echoed back on the OAuth callback (CSRF protection).
    const state = randomUUID();
    const url = this.stravaService.getAuthorizationUrl({ state });
    return { url, state };
  }

  @Post('connect-strava')
  async connectStrava(
    @CurrentUser() user: CurrentUserData,
    @Body('code') code?: string,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    const { athlete, imported } = await this.stravaService.connect(
      cyclist.id,
      code ?? 'mock-code',
    );

    return { connected: true, athlete, imported };
  }

  @Delete('disconnect-strava')
  async disconnectStrava(@CurrentUser() user: CurrentUserData) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    await this.stravaService.disconnect(cyclist.id);

    return { connected: false };
  }

  @Post('sync-strava')
  async syncStrava(@CurrentUser() user: CurrentUserData) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    // sync() refreshes the access token first if it has expired (6h lifetime).
    const count = await this.stravaService.sync(cyclist.id);

    return {
      newActivitiesImported: count,
      lastSyncDate: new Date(),
    };
  }
}

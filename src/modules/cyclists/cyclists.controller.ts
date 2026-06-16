import { Controller, Get, Patch, Body, Query } from '@nestjs/common';
import { CyclistsService } from './cyclists.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { UpdateCyclistDto } from './dto/update-cyclist.dto';

@Controller('cyclists')
export class CyclistsController {
  constructor(private readonly cyclistsService: CyclistsService) {}

  @Get('me')
  async getCurrentCyclist(@CurrentUser() user: CurrentUserData) {
    return this.cyclistsService.findBySupabaseId(user.supabaseUserId);
  }

  @Get('me/stats')
  async getStats(
    @CurrentUser() user: CurrentUserData,
    @Query('bikeType') bikeType?: string,
    @Query('period') period?: string,
  ) {
    return this.cyclistsService.getStats(user.supabaseUserId, bikeType, period);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateCyclistDto,
  ) {
    return this.cyclistsService.update(user.supabaseUserId, dto);
  }
}

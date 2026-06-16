import { Controller, Get, Query } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getRecommendations(
    @CurrentUser() user: CurrentUserData,
    @Query('bikeType') bikeType?: string,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    return this.recommendationsService.getRecommendations(cyclist.id, bikeType);
  }
}

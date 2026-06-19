import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RecommendationsResponseDto } from './dto/responses.dto';

@ApiTags('Recommendations')
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({ description: 'Token manquant ou invalide' })
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Recommandations de pneus',
    description:
      'Retourne des recommandations de pneus personnalisées pour le cycliste authentifié, ' +
      'en fonction de ses préférences et de son activité.',
  })
  @ApiQuery({ name: 'bikeType', required: false, description: 'Filtrer par type de vélo (ex. ROAD)' })
  @ApiOkResponse({ description: 'Liste de pneus recommandés', type: RecommendationsResponseDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
  async getRecommendations(
    @CurrentUser() user: CurrentUserData,
    @Query('bikeType') bikeType?: string,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    return this.recommendationsService.getRecommendations(cyclist.id, bikeType);
  }
}

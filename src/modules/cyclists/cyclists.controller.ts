import { Controller, Get, Patch, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { CyclistsService } from './cyclists.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RequireAdmin } from '../../common/decorators/require-admin.decorator';
import { UpdateCyclistDto } from './dto/update-cyclist.dto';
import {
  CyclistListItemDto,
  CyclistDetailDto,
  LeaderboardDto,
  CyclistStatsDto,
} from './dto/responses.dto';

@ApiTags('Cyclists')
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({ description: 'Token manquant ou invalide' })
@Controller('cyclists')
export class CyclistsController {
  constructor(private readonly cyclistsService: CyclistsService) {}

  // Admin-only endpoint to list all cyclists
  @RequireAdmin()
  @Get()
  @ApiOperation({
    summary: '[Admin] Lister tous les cyclistes',
    description: 'Réservé aux administrateurs. Retourne l’ensemble des cyclistes.',
  })
  @ApiForbiddenResponse({ description: 'Privilèges administrateur requis' })
  @ApiOkResponse({ description: 'Liste des cyclistes', type: [CyclistListItemDto] })
  async getAllCyclists() {
    return this.cyclistsService.findAll();
  }

  // Global leaderboard across all cyclists
  @Get('leaderboard')
  @ApiOperation({
    summary: 'Classement global',
    description: 'Classement des cyclistes, filtrable par période et type de vélo.',
  })
  @ApiQuery({ name: 'period', required: false, description: 'Période (ex. week, month, year, all)' })
  @ApiQuery({ name: 'bikeType', required: false, description: 'Filtrer par type de vélo' })
  @ApiOkResponse({ description: 'Classement', type: LeaderboardDto })
  async getLeaderboard(
    @Query('period') period?: string,
    @Query('bikeType') bikeType?: string,
  ) {
    return this.cyclistsService.getLeaderboard(period, bikeType);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Mon profil cycliste',
    description: 'Retourne le profil complet du cycliste authentifié.',
  })
  @ApiOkResponse({ description: 'Profil cycliste', type: CyclistDetailDto })
  async getCurrentCyclist(@CurrentUser() user: CurrentUserData) {
    return this.cyclistsService.findBySupabaseId(user.supabaseUserId);
  }

  @Get('me/stats')
  @ApiOperation({
    summary: 'Mes statistiques',
    description: 'Statistiques de roulage du cycliste authentifié, filtrables.',
  })
  @ApiQuery({ name: 'bikeType', required: false, description: 'Filtrer par type de vélo' })
  @ApiQuery({ name: 'period', required: false, description: 'Période (ex. week, month, year, all)' })
  @ApiOkResponse({ description: 'Statistiques agrégées', type: CyclistStatsDto })
  async getStats(
    @CurrentUser() user: CurrentUserData,
    @Query('bikeType') bikeType?: string,
    @Query('period') period?: string,
  ) {
    return this.cyclistsService.getStats(user.supabaseUserId, bikeType, period);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Mettre à jour mon profil',
    description: 'Met à jour le nom, le style de pratique et les préférences du cycliste.',
  })
  @ApiOkResponse({ description: 'Profil mis à jour', type: CyclistDetailDto })
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateCyclistDto,
  ) {
    return this.cyclistsService.update(user.supabaseUserId, dto);
  }
}

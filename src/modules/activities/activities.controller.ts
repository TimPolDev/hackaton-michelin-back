import { Controller, Get, Patch, Param, Body, Query, Post, Delete, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { ActivitiesService } from './activities.service';
import { StravaService } from './strava.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityDto } from '../../common/dto/entities.dto';
import {
  ActivityListDto,
  StravaAuthUrlDto,
  StravaConnectResultDto,
  StravaDisconnectResultDto,
  StravaSyncResultDto,
  ResetActivitiesResultDto,
} from './dto/responses.dto';

@ApiTags('Activities')
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({ description: 'Token manquant ou invalide' })
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly stravaService: StravaService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lister mes activités',
    description: 'Retourne les activités du cycliste authentifié, filtrables et paginées.',
  })
  @ApiQuery({ name: 'bikeType', required: false, description: 'Filtrer par type de vélo' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre max de résultats' })
  @ApiQuery({ name: 'offset', required: false, description: 'Décalage de pagination' })
  @ApiOkResponse({ description: 'Liste d’activités', type: ActivityListDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
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
  @ApiOperation({
    summary: 'Modifier le type de vélo d’une activité',
    description: 'Met à jour le type de vélo associé à une activité du cycliste authentifié.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de l’activité' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { bikeType: { type: 'string', example: 'ROAD' } },
      required: ['bikeType'],
    },
  })
  @ApiOkResponse({ description: 'Activité mise à jour', type: ActivityDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
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
  @ApiOperation({
    summary: 'URL d’autorisation Strava',
    description:
      'Génère l’URL d’autorisation OAuth Strava et un `state` (protection CSRF) à stocker côté frontend.',
  })
  @ApiOkResponse({ description: 'URL et state', type: StravaAuthUrlDto })
  async stravaAuthorizeUrl() {
    // `state` is returned so the frontend can store it and validate the value
    // echoed back on the OAuth callback (CSRF protection).
    const state = randomUUID();
    const url = this.stravaService.getAuthorizationUrl({ state });
    return { url, state };
  }

  @Post('connect-strava')
  @ApiOperation({
    summary: 'Connecter Strava',
    description:
      'Échange le code OAuth Strava contre des tokens, lie le compte et importe les activités.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { code: { type: 'string', description: 'Code OAuth renvoyé par Strava' } },
    },
  })
  @ApiCreatedResponse({ description: 'Strava connecté', type: StravaConnectResultDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
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
  @ApiOperation({
    summary: 'Déconnecter Strava',
    description: 'Délie le compte Strava du cycliste authentifié.',
  })
  @ApiOkResponse({ description: 'Strava déconnecté', type: StravaDisconnectResultDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
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
  @ApiOperation({
    summary: 'Synchroniser Strava',
    description:
      'Importe les nouvelles activités Strava. Le token d’accès est rafraîchi si expiré (durée de vie 6h).',
  })
  @ApiOkResponse({ description: 'Synchronisation effectuée', type: StravaSyncResultDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
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

  @Delete('reset-activities')
  @ApiOperation({
    summary: 'Réinitialiser les activités',
    description:
      'Supprime toutes les activités du cycliste. Si Strava est connecté, ré-importe toutes les activités.',
  })
  @ApiOkResponse({ description: 'Activités réinitialisées', type: ResetActivitiesResultDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
  async resetActivities(@CurrentUser() user: CurrentUserData) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    // Delete all activities for this cyclist
    await this.prisma.activity.deleteMany({
      where: { cyclistId: cyclist.id },
    });

    // If connected to Strava, reimport all activities
    if (cyclist.stravaId) {
      const count = await this.stravaService.sync(cyclist.id);
      return {
        deleted: true,
        reimported: count,
      };
    }

    return {
      deleted: true,
      reimported: 0,
    };
  }
}

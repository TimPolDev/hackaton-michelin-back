import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AmbassadorsService } from './ambassadors.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequireAdmin } from '../../common/decorators/require-admin.decorator';
import { CreateAmbassadorDto } from './dto/create-ambassador.dto';
import { UpdateAmbassadorDto } from './dto/update-ambassador.dto';
import { CreateAmbassadorTireDto } from './dto/create-ambassador-tire.dto';
import { ActivityDto, MessageResponseDto } from '../../common/dto/entities.dto';
import {
  AmbassadorDto,
  AmbassadorMutationResponseDto,
  AmbassadorTireWithTireDto,
  AmbassadorActivitiesDto,
  SearchRoutesDto,
} from './dto/responses.dto';

@ApiTags('Ambassadors')
@Controller('ambassadors')
export class AmbassadorsController {
  constructor(private readonly ambassadorsService: AmbassadorsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: '[Public] Lister les ambassadeurs',
    description: 'Liste des ambassadeurs, filtrable par type de vélo et mise en avant.',
  })
  @ApiQuery({ name: 'bikeType', required: false, description: 'Filtrer par type de vélo' })
  @ApiQuery({ name: 'featured', required: false, description: 'true pour ne garder que les mis en avant' })
  @ApiOkResponse({ description: 'Liste des ambassadeurs', type: [AmbassadorDto] })
  async getAmbassadors(
    @Query('bikeType') bikeType?: string,
    @Query('featured') featured?: string,
  ) {
    return this.ambassadorsService.findAll({
      bikeType,
      featured: featured !== undefined ? featured === 'true' : undefined,
    });
  }

  @Public()
  @Get('routes/search')
  @ApiOperation({
    summary: '[Public] Rechercher des parcours d’ambassadeurs',
    description: 'Recherche de parcours par type de vélo, distance et dénivelé.',
  })
  @ApiQuery({ name: 'bikeType', required: false, description: 'Filtrer par type de vélo' })
  @ApiQuery({ name: 'minDistance', required: false, description: 'Distance minimale (km)' })
  @ApiQuery({ name: 'maxDistance', required: false, description: 'Distance maximale (km)' })
  @ApiQuery({ name: 'minElevation', required: false, description: 'Dénivelé minimal (m)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre max de résultats' })
  @ApiOkResponse({ description: 'Liste de parcours', type: SearchRoutesDto })
  async searchRoutes(
    @Query('bikeType') bikeType?: string,
    @Query('minDistance') minDistance?: number,
    @Query('maxDistance') maxDistance?: number,
    @Query('minElevation') minElevation?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ambassadorsService.searchRoutes({
      bikeType,
      minDistance: minDistance ? Number(minDistance) : undefined,
      maxDistance: maxDistance ? Number(maxDistance) : undefined,
      minElevation: minElevation ? Number(minElevation) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: '[Public] Détail d’un ambassadeur',
    description: 'Accessible sans authentification.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de l’ambassadeur' })
  @ApiOkResponse({ description: 'Détail de l’ambassadeur', type: AmbassadorDto })
  @ApiNotFoundResponse({ description: 'Ambassadeur introuvable' })
  async getAmbassador(@Param('id') id: string) {
    return this.ambassadorsService.findOne(id);
  }

  @Public()
  @Get(':id/activities')
  @ApiOperation({
    summary: '[Public] Activités publiques d’un ambassadeur',
    description: 'Retourne les activités publiques (mises en avant) d’un ambassadeur.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de l’ambassadeur' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre max de résultats' })
  @ApiOkResponse({ description: 'Liste d’activités', type: AmbassadorActivitiesDto })
  async getAmbassadorActivities(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.ambassadorsService.getActivities(id, limit);
  }

  @RequireAdmin()
  @ApiBearerAuth('supabase-jwt')
  @Get(':id/activities/all')
  @ApiOperation({
    summary: '[Admin] Toutes les activités d’un ambassadeur',
    description: 'Réservé aux administrateurs. Retourne l’ensemble des activités.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de l’ambassadeur' })
  @ApiForbiddenResponse({ description: 'Privilèges administrateur requis' })
  @ApiOkResponse({ description: 'Liste complète d’activités', type: AmbassadorActivitiesDto })
  async getAllAmbassadorActivities(
    @Param('id') id: string,
  ) {
    return this.ambassadorsService.getAllActivities(id);
  }

  @RequireAdmin()
  @ApiBearerAuth('supabase-jwt')
  @Post()
  @ApiOperation({
    summary: '[Admin] Créer un ambassadeur',
    description: 'Réservé aux administrateurs. Promeut un cycliste au rang d’ambassadeur.',
  })
  @ApiCreatedResponse({ description: 'Ambassadeur créé', type: AmbassadorMutationResponseDto })
  @ApiForbiddenResponse({ description: 'Privilèges administrateur requis' })
  async createAmbassador(@Body() createAmbassadorDto: CreateAmbassadorDto) {
    return this.ambassadorsService.create(createAmbassadorDto);
  }

  @RequireAdmin()
  @ApiBearerAuth('supabase-jwt')
  @Put(':id')
  @ApiOperation({
    summary: '[Admin] Mettre à jour un ambassadeur',
    description: 'Réservé aux administrateurs.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de l’ambassadeur' })
  @ApiOkResponse({ description: 'Ambassadeur mis à jour', type: AmbassadorMutationResponseDto })
  @ApiForbiddenResponse({ description: 'Privilèges administrateur requis' })
  @ApiNotFoundResponse({ description: 'Ambassadeur introuvable' })
  async updateAmbassador(
    @Param('id') id: string,
    @Body() updateAmbassadorDto: UpdateAmbassadorDto,
  ) {
    return this.ambassadorsService.update(id, updateAmbassadorDto);
  }

  @RequireAdmin()
  @ApiBearerAuth('supabase-jwt')
  @Delete(':id')
  @ApiOperation({
    summary: '[Admin] Supprimer un ambassadeur',
    description: 'Réservé aux administrateurs.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de l’ambassadeur' })
  @ApiOkResponse({ description: 'Ambassadeur supprimé', type: MessageResponseDto })
  @ApiForbiddenResponse({ description: 'Privilèges administrateur requis' })
  @ApiNotFoundResponse({ description: 'Ambassadeur introuvable' })
  async deleteAmbassador(@Param('id') id: string) {
    return this.ambassadorsService.delete(id);
  }

  // Tire assignment endpoints
  @RequireAdmin()
  @ApiBearerAuth('supabase-jwt')
  @Post(':id/tires')
  @ApiOperation({
    summary: '[Admin] Associer un pneu à un ambassadeur',
    description: 'Réservé aux administrateurs. Ajoute un pneu testé avec témoignage.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de l’ambassadeur' })
  @ApiCreatedResponse({ description: 'Pneu associé', type: AmbassadorTireWithTireDto })
  @ApiForbiddenResponse({ description: 'Privilèges administrateur requis' })
  async addTire(
    @Param('id') id: string,
    @Body() createTireDto: CreateAmbassadorTireDto,
  ) {
    return this.ambassadorsService.addTire(id, createTireDto);
  }

  @RequireAdmin()
  @ApiBearerAuth('supabase-jwt')
  @Delete(':id/tires/:tireId')
  @ApiOperation({
    summary: '[Admin] Dissocier un pneu d’un ambassadeur',
    description: 'Réservé aux administrateurs.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de l’ambassadeur' })
  @ApiParam({ name: 'tireId', description: 'Identifiant du pneu à retirer' })
  @ApiOkResponse({ description: 'Pneu dissocié', type: MessageResponseDto })
  @ApiForbiddenResponse({ description: 'Privilèges administrateur requis' })
  async removeTire(
    @Param('id') ambassadorId: string,
    @Param('tireId') tireId: string,
  ) {
    return this.ambassadorsService.removeTire(ambassadorId, tireId);
  }

  // Activity featured status endpoints
  @RequireAdmin()
  @ApiBearerAuth('supabase-jwt')
  @Put(':id/activities/:activityId/featured')
  @ApiOperation({
    summary: '[Admin] Mettre en avant une activité',
    description: 'Réservé aux administrateurs. Active/désactive la mise en avant d’une activité.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de l’ambassadeur' })
  @ApiParam({ name: 'activityId', description: 'Identifiant de l’activité' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { isFeatured: { type: 'boolean', example: true } },
      required: ['isFeatured'],
    },
  })
  @ApiOkResponse({ description: 'Statut de mise en avant mis à jour', type: ActivityDto })
  @ApiForbiddenResponse({ description: 'Privilèges administrateur requis' })
  async toggleActivityFeatured(
    @Param('id') ambassadorId: string,
    @Param('activityId') activityId: string,
    @Body() body: { isFeatured: boolean },
  ) {
    return this.ambassadorsService.toggleActivityFeatured(ambassadorId, activityId, body.isFeatured);
  }
}

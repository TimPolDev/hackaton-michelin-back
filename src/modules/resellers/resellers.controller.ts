import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
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
} from '@nestjs/swagger';
import { ResellersService } from './resellers.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequireAdmin } from '../../common/decorators/require-admin.decorator';
import { CreateResellerDto } from './dto/create-reseller.dto';
import { UpdateResellerDto } from './dto/update-reseller.dto';
import { ResellerDto } from '../../common/dto/entities.dto';

@ApiTags('Resellers')
@Controller('resellers')
export class ResellersController {
  constructor(private readonly resellersService: ResellersService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: '[Public] Lister les revendeurs',
    description: 'Liste des revendeurs, filtrable par pays et région. Accessible sans authentification.',
  })
  @ApiQuery({ name: 'country', required: false, description: 'Filtrer par pays' })
  @ApiQuery({ name: 'region', required: false, description: 'Filtrer par région' })
  @ApiOkResponse({ description: 'Liste des revendeurs', type: [ResellerDto] })
  async getResellers(
    @Query('country') country?: string,
    @Query('region') region?: string,
  ) {
    return this.resellersService.findAll({ country, region });
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: '[Public] Détail d’un revendeur',
    description: 'Accessible sans authentification.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du revendeur' })
  @ApiOkResponse({ description: 'Détail du revendeur', type: ResellerDto })
  @ApiNotFoundResponse({ description: 'Revendeur introuvable' })
  async getReseller(@Param('id') id: string) {
    return this.resellersService.findOne(id);
  }

  @RequireAdmin()
  @ApiBearerAuth('supabase-jwt')
  @Post()
  @ApiOperation({
    summary: '[Admin] Créer un revendeur',
    description: 'Réservé aux administrateurs.',
  })
  @ApiCreatedResponse({ description: 'Revendeur créé', type: ResellerDto })
  @ApiForbiddenResponse({ description: 'Privilèges administrateur requis' })
  async createReseller(@Body() createResellerDto: CreateResellerDto) {
    return this.resellersService.create(createResellerDto);
  }

  @RequireAdmin()
  @ApiBearerAuth('supabase-jwt')
  @Put(':id')
  @ApiOperation({
    summary: '[Admin] Mettre à jour un revendeur',
    description: 'Réservé aux administrateurs.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du revendeur' })
  @ApiOkResponse({ description: 'Revendeur mis à jour', type: ResellerDto })
  @ApiForbiddenResponse({ description: 'Privilèges administrateur requis' })
  @ApiNotFoundResponse({ description: 'Revendeur introuvable' })
  async updateReseller(
    @Param('id') id: string,
    @Body() updateResellerDto: UpdateResellerDto,
  ) {
    return this.resellersService.update(id, updateResellerDto);
  }

  @RequireAdmin()
  @ApiBearerAuth('supabase-jwt')
  @Delete(':id')
  @ApiOperation({
    summary: '[Admin] Supprimer un revendeur',
    description: 'Réservé aux administrateurs.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du revendeur' })
  @ApiOkResponse({ description: 'Revendeur supprimé (entité supprimée renvoyée)', type: ResellerDto })
  @ApiForbiddenResponse({ description: 'Privilèges administrateur requis' })
  @ApiNotFoundResponse({ description: 'Revendeur introuvable' })
  async deleteReseller(@Param('id') id: string) {
    return this.resellersService.delete(id);
  }
}

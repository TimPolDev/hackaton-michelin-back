import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TiresService } from './tires.service';
import { Public } from '../../common/decorators/public.decorator';
import { TireListDto, TireDetailDto } from './dto/responses.dto';

@ApiTags('Tires')
@Controller('tires')
export class TiresController {
  constructor(private readonly tiresService: TiresService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: '[Public] Lister les pneus',
    description: 'Catalogue des pneus, filtrable et paginé. Accessible sans authentification.',
  })
  @ApiQuery({ name: 'bikeType', required: false, description: 'Filtrer par type de vélo (ex. ROAD)' })
  @ApiQuery({ name: 'segment', required: false, description: 'Filtrer par segment commercial' })
  @ApiQuery({ name: 'terrainType', required: false, description: 'Filtrer par type de terrain' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche texte (nom du pneu)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre max de résultats', example: 20 })
  @ApiQuery({ name: 'offset', required: false, description: 'Décalage de pagination', example: 0 })
  @ApiOkResponse({ description: 'Liste de pneus', type: TireListDto })
  async getTires(
    @Query('bikeType') bikeType?: string,
    @Query('segment') segment?: string,
    @Query('terrainType') terrainType?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.tiresService.findAll({
      bikeType,
      segment,
      terrainType,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: '[Public] Détail d’un pneu',
    description: 'Retourne un pneu et ses variantes. Accessible sans authentification.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du pneu' })
  @ApiOkResponse({ description: 'Détail du pneu', type: TireDetailDto })
  @ApiNotFoundResponse({ description: 'Pneu introuvable' })
  async getTire(@Param('id') id: string) {
    return this.tiresService.findOne(id);
  }
}

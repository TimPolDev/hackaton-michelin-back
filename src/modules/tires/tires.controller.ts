import { Controller, Get, Param, Query } from '@nestjs/common';
import { TiresService } from './tires.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('tires')
export class TiresController {
  constructor(private readonly tiresService: TiresService) {}

  @Public()
  @Get()
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
  async getTire(@Param('id') id: string) {
    return this.tiresService.findOne(id);
  }
}

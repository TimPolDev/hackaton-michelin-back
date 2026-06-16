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
    @Query('useCase') useCase?: string,
    @Query('terrainType') terrainType?: string,
    @Query('search') search?: string,
  ) {
    return this.tiresService.findAll({ bikeType, useCase, terrainType, search });
  }

  @Public()
  @Get(':id')
  async getTire(@Param('id') id: string) {
    return this.tiresService.findOne(id);
  }
}

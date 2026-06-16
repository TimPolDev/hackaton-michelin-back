import { Controller, Get, Param, Query } from '@nestjs/common';
import { AmbassadorsService } from './ambassadors.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('ambassadors')
export class AmbassadorsController {
  constructor(private readonly ambassadorsService: AmbassadorsService) {}

  @Public()
  @Get()
  async getAmbassadors(
    @Query('bikeType') bikeType?: string,
    @Query('featured') featured?: string,
  ) {
    return this.ambassadorsService.findAll({
      bikeType,
      featured: featured === 'true',
    });
  }

  @Public()
  @Get(':id')
  async getAmbassador(@Param('id') id: string) {
    return this.ambassadorsService.findOne(id);
  }
}

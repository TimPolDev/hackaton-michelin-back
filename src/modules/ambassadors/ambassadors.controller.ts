import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { AmbassadorsService } from './ambassadors.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequireAdmin } from '../../common/decorators/require-admin.decorator';
import { CreateAmbassadorDto } from './dto/create-ambassador.dto';
import { UpdateAmbassadorDto } from './dto/update-ambassador.dto';
import { CreateAmbassadorTireDto } from './dto/create-ambassador-tire.dto';

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
      featured: featured !== undefined ? featured === 'true' : undefined,
    });
  }

  @Public()
  @Get('routes/search')
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
  async getAmbassador(@Param('id') id: string) {
    return this.ambassadorsService.findOne(id);
  }

  @Public()
  @Get(':id/activities')
  async getAmbassadorActivities(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.ambassadorsService.getActivities(id, limit);
  }

  @RequireAdmin()
  @Post()
  async createAmbassador(@Body() createAmbassadorDto: CreateAmbassadorDto) {
    return this.ambassadorsService.create(createAmbassadorDto);
  }

  @RequireAdmin()
  @Put(':id')
  async updateAmbassador(
    @Param('id') id: string,
    @Body() updateAmbassadorDto: UpdateAmbassadorDto,
  ) {
    return this.ambassadorsService.update(id, updateAmbassadorDto);
  }

  @RequireAdmin()
  @Delete(':id')
  async deleteAmbassador(@Param('id') id: string) {
    return this.ambassadorsService.delete(id);
  }

  // Tire assignment endpoints
  @RequireAdmin()
  @Post(':id/tires')
  async addTire(
    @Param('id') id: string,
    @Body() createTireDto: CreateAmbassadorTireDto,
  ) {
    return this.ambassadorsService.addTire(id, createTireDto);
  }

  @RequireAdmin()
  @Delete(':id/tires/:tireId')
  async removeTire(
    @Param('id') ambassadorId: string,
    @Param('tireId') tireId: string,
  ) {
    return this.ambassadorsService.removeTire(ambassadorId, tireId);
  }
}

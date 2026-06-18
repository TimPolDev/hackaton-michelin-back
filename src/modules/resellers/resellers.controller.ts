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
import { ResellersService } from './resellers.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequireAdmin } from '../../common/decorators/require-admin.decorator';
import { CreateResellerDto } from './dto/create-reseller.dto';
import { UpdateResellerDto } from './dto/update-reseller.dto';

@Controller('resellers')
export class ResellersController {
  constructor(private readonly resellersService: ResellersService) {}

  @Public()
  @Get()
  async getResellers(
    @Query('country') country?: string,
    @Query('region') region?: string,
  ) {
    return this.resellersService.findAll({ country, region });
  }

  @Public()
  @Get(':id')
  async getReseller(@Param('id') id: string) {
    return this.resellersService.findOne(id);
  }

  @RequireAdmin()
  @Post()
  async createReseller(@Body() createResellerDto: CreateResellerDto) {
    return this.resellersService.create(createResellerDto);
  }

  @RequireAdmin()
  @Put(':id')
  async updateReseller(
    @Param('id') id: string,
    @Body() updateResellerDto: UpdateResellerDto,
  ) {
    return this.resellersService.update(id, updateResellerDto);
  }

  @RequireAdmin()
  @Delete(':id')
  async deleteReseller(@Param('id') id: string) {
    return this.resellersService.delete(id);
  }
}

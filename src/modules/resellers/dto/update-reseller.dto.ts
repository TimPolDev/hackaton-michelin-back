import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateResellerDto {
  @ApiPropertyOptional({ description: 'Nom du revendeur', example: 'Cycles Martin' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Région', example: 'Auvergne-Rhône-Alpes' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ description: 'Pays', example: 'France' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Site web', example: 'https://cycles-martin.fr' })
  @IsUrl()
  @IsOptional()
  website?: string;
}

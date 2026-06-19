import { IsString, IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClubDto {
  @ApiProperty({ description: 'Nom du club', example: 'Vélo Club de Lyon' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description du club' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Le club accepte-t-il plusieurs types de vélo', example: true })
  @IsBoolean()
  isMultiBikeType: boolean;

  @ApiPropertyOptional({ description: 'Type de vélo imposé si club mono-discipline', example: 'ROAD' })
  @IsOptional()
  @IsString()
  bikeTypeFilter?: string;

  @ApiPropertyOptional({ description: 'Ville', example: 'Lyon' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Région', example: 'Auvergne-Rhône-Alpes' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Année de création', minimum: 1900, maximum: 2100, example: 1998 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  foundedYear?: number;
}

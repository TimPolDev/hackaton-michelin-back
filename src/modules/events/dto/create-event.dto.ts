import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ description: 'Titre de l’événement', example: 'Sortie dominicale' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Date/heure de départ (ISO 8601)', example: '2026-07-01T08:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional({ description: 'Description de l’événement' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Lieu de départ', example: 'Place Bellecour, Lyon' })
  @IsOptional()
  @IsString()
  departureLabel?: string;

  @ApiPropertyOptional({ description: 'Distance en km', example: 80 })
  @IsOptional()
  @IsNumber()
  distance?: number;

  @ApiPropertyOptional({ description: 'Dénivelé en m', example: 1200 })
  @IsOptional()
  @IsNumber()
  elevation?: number;

  @ApiPropertyOptional({ description: 'Niveau requis', example: 'Intermédiaire' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ description: 'Type de vélo', example: 'ROAD' })
  @IsOptional()
  @IsString()
  bikeType?: string;

  @ApiPropertyOptional({ description: 'Événement officiel', default: false })
  @IsOptional()
  @IsBoolean()
  isOfficial?: boolean;

  @ApiPropertyOptional({ description: 'Licence requise', default: false })
  @IsOptional()
  @IsBoolean()
  requiresLicense?: boolean;
}

import { IsString, IsArray, IsOptional, IsObject, IsInt, Min, Max, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PreferencesDto {
  @ApiPropertyOptional({ description: 'Importance du grip (adhérence)', minimum: 1, maximum: 10, example: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  grip?: number;

  @ApiPropertyOptional({ description: 'Importance de l’endurance / durabilité', minimum: 1, maximum: 10, example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  endurance?: number;

  @ApiPropertyOptional({ description: 'Importance de la légèreté', minimum: 1, maximum: 10, example: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  lightness?: number;

  @ApiPropertyOptional({ description: 'Importance de la polyvalence', minimum: 1, maximum: 10, example: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  versatility?: number;
}

export class CompleteProfileDto {
  @ApiProperty({ description: 'Nom complet du cycliste', example: 'Jean Dupont' })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Types de vélos pratiqués',
    type: [String],
    example: ['ROAD', 'GRAVEL'],
  })
  @IsArray()
  @IsString({ each: true })
  bikeTypes: string[];

  @ApiProperty({
    description: 'Type de vélo principal',
    enum: ['ROAD', 'MTB', 'GRAVEL', 'E_BIKE', 'COMMUTING'],
    example: 'ROAD',
  })
  @IsString()
  @IsIn(['ROAD', 'MTB', 'GRAVEL', 'E_BIKE', 'COMMUTING'])
  primaryBikeType: string;

  @ApiPropertyOptional({ description: 'Style de pratique', example: 'Sportif / compétition' })
  @IsOptional()
  @IsString()
  practiceStyle?: string;

  @ApiPropertyOptional({ description: 'Préférences de pneu (1-10 par critère)', type: PreferencesDto })
  @IsOptional()
  @IsObject()
  preferences?: PreferencesDto;
}

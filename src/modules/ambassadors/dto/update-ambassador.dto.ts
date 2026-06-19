import { IsString, IsBoolean, IsInt, IsOptional, MinLength, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAmbassadorDto {
  @ApiPropertyOptional({ description: 'Biographie (min. 10 caractères)', minLength: 10 })
  @IsString()
  @IsOptional()
  @MinLength(10)
  bio?: string;

  @ApiPropertyOptional({ description: 'Discipline pratiquée', example: 'Route' })
  @IsString()
  @IsOptional()
  discipline?: string;

  @ApiPropertyOptional({ description: 'Niveau de pratique', example: 'Expert' })
  @IsString()
  @IsOptional()
  skillLevel?: string;

  @ApiPropertyOptional({ description: 'URL de la photo principale' })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Galerie de photos', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @ApiPropertyOptional({ description: 'Contenu de l’article / portrait' })
  @IsString()
  @IsOptional()
  articleContent?: string;

  @ApiPropertyOptional({ description: 'Afficher les données de roulage publiques' })
  @IsBoolean()
  @IsOptional()
  showRidingData?: boolean;

  @ApiPropertyOptional({ description: 'Segments mis en avant' })
  @IsString()
  @IsOptional()
  featuredSegments?: string;

  @ApiPropertyOptional({ description: 'Mettre en avant l’ambassadeur' })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Ordre d’affichage', example: 1 })
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}

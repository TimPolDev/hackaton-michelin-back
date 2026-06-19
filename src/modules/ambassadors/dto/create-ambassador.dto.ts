import { IsString, IsBoolean, IsInt, IsOptional, IsNotEmpty, MinLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAmbassadorDto {
  @ApiProperty({ description: 'Identifiant du cycliste à promouvoir ambassadeur', example: 'uuid-cyclist' })
  @IsString()
  @IsNotEmpty()
  cyclistId: string;

  @ApiProperty({ description: 'Biographie de l’ambassadeur (min. 10 caractères)', minLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  bio: string;

  @ApiProperty({ description: 'Discipline pratiquée', example: 'Route' })
  @IsString()
  @IsNotEmpty()
  discipline: string;

  @ApiProperty({ description: 'Niveau de pratique', example: 'Expert' })
  @IsString()
  @IsNotEmpty()
  skillLevel: string;

  @ApiPropertyOptional({ description: 'URL de la photo principale' })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Galerie de photos', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @ApiPropertyOptional({ description: 'Contenu de l’article / portrait (HTML ou markdown)' })
  @IsString()
  @IsOptional()
  articleContent?: string;

  @ApiPropertyOptional({ description: 'Afficher les données de roulage publiques', default: false })
  @IsBoolean()
  @IsOptional()
  showRidingData?: boolean;

  @ApiPropertyOptional({ description: 'Segments mis en avant' })
  @IsString()
  @IsOptional()
  featuredSegments?: string;

  @ApiPropertyOptional({ description: 'Mettre en avant l’ambassadeur', default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Ordre d’affichage', example: 1 })
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}

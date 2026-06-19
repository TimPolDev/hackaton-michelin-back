import { ApiProperty } from '@nestjs/swagger';

export class RecommendedTireDto {
  @ApiProperty() id: string;
  @ApiProperty() rangeName: string;
  @ApiProperty() segment: string;
  @ApiProperty() terrainTypes: string;
  @ApiProperty() compatibleBikeTypes: string;
  @ApiProperty() isDiscontinued: boolean;
  @ApiProperty() useCases: string;
  @ApiProperty({ nullable: true, type: String }) rubberTech: string | null;
  @ApiProperty({ nullable: true, type: String }) casingTech: string | null;
  @ApiProperty({ nullable: true, type: Number }) minWeight: number | null;
}

export class RecommendationItemDto {
  @ApiProperty({ type: RecommendedTireDto }) tire: RecommendedTireDto;
  @ApiProperty({ minimum: 0, maximum: 100, description: 'Score de correspondance' }) score: number;
  @ApiProperty({ description: 'Explication du score' }) explanation: string;
  @ApiProperty({ type: [String], description: 'Critères satisfaits' }) matchedCriteria: string[];
}

export class MatchedAmbassadorDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true, type: String }) fullName: string | null;
  @ApiProperty() bio: string;
  @ApiProperty({ description: 'Nom du pneu de l’ambassadeur' }) tire: string;
  @ApiProperty() testimonial: string;
}

export class RecommendationsResponseDto {
  @ApiProperty({ example: 'ROAD' }) bikeType: string;
  @ApiProperty({ type: [RecommendationItemDto] }) recommendations: RecommendationItemDto[];
  @ApiProperty({ type: MatchedAmbassadorDto, nullable: true }) matchedAmbassador: MatchedAmbassadorDto | null;
}

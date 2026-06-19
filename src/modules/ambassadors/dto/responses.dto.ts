import { ApiProperty } from '@nestjs/swagger';
import { ActivityDto, TireDto, CyclistRefDto } from '../../../common/dto/entities.dto';

export class AmbassadorRidingStatsDto {
  @ApiProperty() monthlyDistance: number;
  @ApiProperty() totalElevation: number;
}

export class AmbassadorTireRefDto {
  @ApiProperty({ example: 'ROAD' }) bikeType: string;
  @ApiProperty({ type: TireDto }) tire: TireDto;
  @ApiProperty({ nullable: true, type: String }) testimonial: string | null;
}

export class AmbassadorDto {
  @ApiProperty() id: string;
  @ApiProperty({ type: CyclistRefDto }) cyclist: CyclistRefDto;
  @ApiProperty({ nullable: true, type: String }) bio: string | null;
  @ApiProperty({ nullable: true, type: String }) discipline: string | null;
  @ApiProperty({ nullable: true, type: String }) skillLevel: string | null;
  @ApiProperty({ nullable: true, type: String }) photoUrl: string | null;
  @ApiProperty({ type: [String] }) photos: string[];
  @ApiProperty({ nullable: true, type: String }) articleContent: string | null;
  @ApiProperty() showRidingData: boolean;
  @ApiProperty({ nullable: true, type: String }) featuredSegments: string | null;
  @ApiProperty() isFeatured: boolean;
  @ApiProperty({ type: AmbassadorRidingStatsDto, nullable: true }) stats: AmbassadorRidingStatsDto | null;
  @ApiProperty({ type: [AmbassadorTireRefDto] }) tires: AmbassadorTireRefDto[];
}

export class AmbassadorMutationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() cyclistId: string;
  @ApiProperty({ nullable: true, type: String }) bio: string | null;
  @ApiProperty({ nullable: true, type: String }) discipline: string | null;
  @ApiProperty({ nullable: true, type: String }) skillLevel: string | null;
  @ApiProperty({ nullable: true, type: String }) photoUrl: string | null;
  @ApiProperty({ type: [String] }) photos: string[];
  @ApiProperty({ nullable: true, type: String }) articleContent: string | null;
  @ApiProperty() showRidingData: boolean;
  @ApiProperty({ nullable: true, type: String }) featuredSegments: string | null;
  @ApiProperty() isFeatured: boolean;
  @ApiProperty() displayOrder: number;
  @ApiProperty({ type: CyclistRefDto }) cyclist: CyclistRefDto;
}

export class AmbassadorTireWithTireDto {
  @ApiProperty() id: string;
  @ApiProperty() ambassadorId: string;
  @ApiProperty() tireId: string;
  @ApiProperty({ example: 'ROAD' }) bikeType: string;
  @ApiProperty({ nullable: true, type: String }) testimonial: string | null;
  @ApiProperty({ type: TireDto }) tire: TireDto;
}

export class AmbassadorActivitiesDto {
  @ApiProperty({ type: [ActivityDto] }) activities: ActivityDto[];
  @ApiProperty() total: number;
  @ApiProperty() hasStrava: boolean;
  @ApiProperty({ required: false, description: 'Présent uniquement si hasStrava=true' }) ambassadorName?: string;
}

export class RouteAmbassadorDto {
  @ApiProperty({ nullable: true, type: String }) id: string | null;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true, type: String }) photoUrl: string | null;
  @ApiProperty({ nullable: true, type: String }) discipline: string | null;
}

export class RouteWithAmbassadorDto extends ActivityDto {
  @ApiProperty({ type: RouteAmbassadorDto }) ambassador: RouteAmbassadorDto;
}

export class SearchRoutesDto {
  @ApiProperty({ type: [RouteWithAmbassadorDto] }) routes: RouteWithAmbassadorDto[];
  @ApiProperty() total: number;
}

import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTOs mirroring the main Prisma entities. They exist purely to give
 * Swagger accurate output schemas — the runtime still returns Prisma objects.
 */

export class ActivityDto {
  @ApiProperty() id: string;
  @ApiProperty() cyclistId: string;
  @ApiProperty({ nullable: true, type: String }) stravaId: string | null;
  @ApiProperty({ example: 'ROAD' }) bikeType: string;
  @ApiProperty({ type: String, format: 'date-time' }) activityDate: Date;
  @ApiProperty({ description: 'Distance en mètres', example: 42000 }) distance: number;
  @ApiProperty({ description: 'Dénivelé positif en mètres', example: 650 }) elevationGain: number;
  @ApiProperty({ description: 'Temps de déplacement en secondes', example: 5400 }) movingTime: number;
  @ApiProperty({ nullable: true, type: Number }) averageSpeed: number | null;
  @ApiProperty({ nullable: true, type: String, description: 'Polyline encodée (Strava)' }) polyline: string | null;
  @ApiProperty({ nullable: true, type: Number }) startLatitude: number | null;
  @ApiProperty({ nullable: true, type: Number }) startLongitude: number | null;
  @ApiProperty({ description: 'Part de terrain asphalte (0-1)' }) terrainAsphalt: number;
  @ApiProperty({ description: 'Part de terrain off-road (0-1)' }) terrainOffroad: number;
  @ApiProperty({ description: 'Part de terrain mixte (0-1)' }) terrainMixed: number;
  @ApiProperty({ nullable: true, type: String }) weatherCondition: string | null;
  @ApiProperty() isManual: boolean;
  @ApiProperty() isFeatured: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
}

export class CyclistProfileDto {
  @ApiProperty() id: string;
  @ApiProperty() cyclistId: string;
  @ApiProperty({ nullable: true, type: String }) practiceStyle: string | null;
  @ApiProperty({ minimum: 1, maximum: 10 }) preferGrip: number;
  @ApiProperty({ minimum: 1, maximum: 10 }) preferEndurance: number;
  @ApiProperty({ minimum: 1, maximum: 10 }) preferLightness: number;
  @ApiProperty({ minimum: 1, maximum: 10 }) preferVersatility: number;
  @ApiProperty({ nullable: true, type: String }) primaryBikeType: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
}

export class CyclistBikeTypeDto {
  @ApiProperty() id: string;
  @ApiProperty() cyclistId: string;
  @ApiProperty({ example: 'ROAD' }) bikeType: string;
  @ApiProperty() isPrimary: boolean;
  @ApiProperty({ nullable: true, type: Number }) manualMonthlyDistance: number | null;
  @ApiProperty({ nullable: true, type: Number }) manualElevationGain: number | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
}

export class ClubDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true, type: String }) description: string | null;
  @ApiProperty() isMultiBikeType: boolean;
  @ApiProperty({ nullable: true, type: String }) bikeTypeFilter: string | null;
  @ApiProperty() creatorId: string;
  @ApiProperty({ description: 'Code d’invitation interne' }) inviteCode: string;
  @ApiProperty() isMichelinPartner: boolean;
  @ApiProperty() isPremium: boolean;
  @ApiProperty({ nullable: true, type: String }) location: string | null;
  @ApiProperty({ nullable: true, type: String }) city: string | null;
  @ApiProperty({ nullable: true, type: String }) region: string | null;
  @ApiProperty({ nullable: true, type: Number }) foundedYear: number | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
}

export class TireVariantDto {
  @ApiProperty() id: string;
  @ApiProperty() tireId: string;
  @ApiProperty() designation: string;
  @ApiProperty() webProductName: string;
  @ApiProperty({ nullable: true, type: String }) bead: string | null;
  @ApiProperty({ nullable: true, type: String }) eanCode: string | null;
  @ApiProperty({ nullable: true, type: String }) widthEtrto: string | null;
  @ApiProperty({ nullable: true, type: String }) diameterEtrto: string | null;
  @ApiProperty({ nullable: true, type: Number }) widthMm: number | null;
  @ApiProperty({ nullable: true, type: Number }) diameterMm: number | null;
  @ApiProperty({ nullable: true, type: Number }) weight: number | null;
  @ApiProperty({ nullable: true, type: Number }) minPressure: number | null;
  @ApiProperty({ nullable: true, type: Number }) maxPressure: number | null;
  @ApiProperty({ nullable: true, type: String }) tpi: string | null;
  @ApiProperty() terrainTypes: string;
  @ApiProperty({ nullable: true, type: String }) reinforcementTech: string | null;
  @ApiProperty({ nullable: true, type: String }) sidewallColor: string | null;
  @ApiProperty({ nullable: true, type: String }) treadPatternColor: string | null;
  @ApiProperty({ nullable: true, type: String }) recommendedInnerTube: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) discontinuedDate: Date | null;
  @ApiProperty() isDiscontinued: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
}

export class TireDto {
  @ApiProperty() id: string;
  @ApiProperty() globalId: string;
  @ApiProperty() brand: string;
  @ApiProperty({ description: 'TYRE | TUBE | TUBULAR' }) productType: string;
  @ApiProperty({ description: 'MTB | ROAD | CITY' }) cycleType: string;
  @ApiProperty() segment: string;
  @ApiProperty() rangeName: string;
  @ApiProperty() rangeInternal: string;
  @ApiProperty() compatibleBikeTypes: string;
  @ApiProperty() useCases: string;
  @ApiProperty({ nullable: true, type: String }) rubberTech: string | null;
  @ApiProperty({ nullable: true, type: String }) casingTech: string | null;
  @ApiProperty({ nullable: true, type: String }) treadPatternTech: string | null;
  @ApiProperty({ nullable: true, type: String }) sidewallType: string | null;
  @ApiProperty({ nullable: true, type: String }) sealing: string | null;
  @ApiProperty({ nullable: true, type: String }) rimType: string | null;
  @ApiProperty({ nullable: true, type: String }) fitting: string | null;
  @ApiProperty({ type: [String] }) images: string[];
  @ApiProperty() terrainTypes: string;
  @ApiProperty({ nullable: true, type: Number }) minWeight: number | null;
  @ApiProperty() isEBikeReady: boolean;
  @ApiProperty() isDiscontinued: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
  @ApiProperty({ type: [TireVariantDto], required: false }) variants?: TireVariantDto[];
}

export class ResellerDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'Alltricks' }) name: string;
  @ApiProperty({ description: 'EUN | EUS | ECA' }) region: string;
  @ApiProperty({ description: 'Code pays (FR, DE, UK…)' }) country: string;
  @ApiProperty() website: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
}

export class AmbassadorTireDto {
  @ApiProperty() id: string;
  @ApiProperty() ambassadorId: string;
  @ApiProperty() tireId: string;
  @ApiProperty({ example: 'ROAD' }) bikeType: string;
  @ApiProperty() testimonial: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
}

/** Generic `{ message }` acknowledgement returned by some mutations. */
export class MessageResponseDto {
  @ApiProperty({ example: 'Deleted successfully' }) message: string;
}

/** Minimal cyclist reference embedded in many responses. */
export class CyclistRefDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true, type: String }) fullName: string | null;
  @ApiProperty({ required: false }) email?: string;
}

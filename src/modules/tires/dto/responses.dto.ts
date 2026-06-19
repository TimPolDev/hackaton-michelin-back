import { ApiProperty } from '@nestjs/swagger';
import { TireVariantDto, CyclistRefDto } from '../../../common/dto/entities.dto';

/** Reduced tire shape returned by the catalogue list/detail endpoints. */
export class TireListItemDto {
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
  @ApiProperty({ type: [TireVariantDto] }) variants: TireVariantDto[];
}

export class TireListDto {
  @ApiProperty({ type: [TireListItemDto] }) tires: TireListItemDto[];
  @ApiProperty() total: number;
}

export class TireAmbassadorDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true, type: String }) discipline: string | null;
  @ApiProperty({ nullable: true, type: String }) skillLevel: string | null;
  @ApiProperty({ nullable: true, type: String }) photoUrl: string | null;
  @ApiProperty({ type: CyclistRefDto }) cyclist: CyclistRefDto;
}

export class TireAmbassadorRefDto {
  @ApiProperty({ example: 'ROAD' }) bikeType: string;
  @ApiProperty() testimonial: string;
  @ApiProperty({ type: TireAmbassadorDto }) ambassador: TireAmbassadorDto;
}

export class TireDetailDto extends TireListItemDto {
  @ApiProperty({ type: [TireAmbassadorRefDto] }) ambassadors: TireAmbassadorRefDto[];
}

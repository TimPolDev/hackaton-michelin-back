import { ApiProperty } from '@nestjs/swagger';
import { CyclistProfileDto, CyclistBikeTypeDto } from '../../../common/dto/entities.dto';

export class ProfileStatusResponseDto {
  @ApiProperty() isComplete: boolean;
  @ApiProperty() supabaseUserId: string;
  @ApiProperty() email: string;
}

export class CurrentUserResponseDto {
  @ApiProperty() supabaseUserId: string;
  @ApiProperty() email: string;
  @ApiProperty() isAdmin: boolean;
}

export class CompleteProfileResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() supabaseUserId: string;
  @ApiProperty() email: string;
  @ApiProperty({ nullable: true, type: String }) fullName: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: CyclistProfileDto, nullable: true }) profile: CyclistProfileDto | null;
  @ApiProperty({ type: [CyclistBikeTypeDto] }) bikeTypes: CyclistBikeTypeDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import {
  ClubDto,
  CyclistProfileDto,
  CyclistBikeTypeDto,
} from '../../../common/dto/entities.dto';

export class CyclistListItemDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty({ nullable: true, type: String }) fullName: string | null;
  @ApiProperty() isAmbassador: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
}

export class ClubMembershipWithClubDto {
  @ApiProperty() id: string;
  @ApiProperty() clubId: string;
  @ApiProperty() cyclistId: string;
  @ApiProperty() isManager: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) joinedAt: Date;
  @ApiProperty({ type: ClubDto }) club: ClubDto;
}

export class CyclistDetailDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty({ nullable: true, type: String }) fullName: string | null;
  @ApiProperty({ nullable: true, type: String }) stravaId: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) stravaConnectedAt: Date | null;
  @ApiProperty() isAdmin: boolean;
  @ApiProperty() isAmbassador: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
  @ApiProperty({ type: CyclistProfileDto, nullable: true }) profile: CyclistProfileDto | null;
  @ApiProperty({ type: [CyclistBikeTypeDto] }) bikeTypes: CyclistBikeTypeDto[];
  @ApiProperty({ type: [ClubMembershipWithClubDto] }) clubMemberships: ClubMembershipWithClubDto[];
}

export class LeaderboardEntryDto {
  @ApiProperty() cyclistId: string;
  @ApiProperty() cyclistName: string;
  @ApiProperty() isAmbassador: boolean;
  @ApiProperty() distance: number;
  @ApiProperty() elevation: number;
  @ApiProperty() activityCount: number;
  @ApiProperty() rank: number;
}

export class LeaderboardDto {
  @ApiProperty() period: string;
  @ApiProperty({ nullable: true, type: String }) bikeType: string | null;
  @ApiProperty() totalRiders: number;
  @ApiProperty() totalDistance: number;
  @ApiProperty() totalElevation: number;
  @ApiProperty({ type: [LeaderboardEntryDto] }) leaderboard: LeaderboardEntryDto[];
}

export class TerrainDistributionDto {
  @ApiProperty() asphalt: number;
  @ApiProperty() offroad: number;
  @ApiProperty() mixed: number;
}

export class LastActivityDto {
  @ApiProperty({ type: String, format: 'date-time' }) activityDate: Date;
  @ApiProperty() distance: number;
  @ApiProperty() bikeType: string;
}

export class CyclistStatsDto {
  @ApiProperty({ required: false, nullable: true, type: String }) bikeType?: string;
  @ApiProperty() period: string;
  @ApiProperty() totalDistance: number;
  @ApiProperty() totalElevation: number;
  @ApiProperty() activityCount: number;
  @ApiProperty() averageSpeed: number;
  @ApiProperty({ type: TerrainDistributionDto }) terrainDistribution: TerrainDistributionDto;
  @ApiProperty({ type: LastActivityDto, nullable: true }) lastActivity: LastActivityDto | null;
}

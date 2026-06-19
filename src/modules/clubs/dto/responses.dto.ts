import { ApiProperty } from '@nestjs/swagger';
import { ClubDto } from '../../../common/dto/entities.dto';

export class CreateClubResponseDto extends ClubDto {
  @ApiProperty({ description: 'Lien d’invitation prêt à partager' }) invitationLink: string;
}

export class InvitationPreviewDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true, type: String }) description: string | null;
  @ApiProperty({ nullable: true, type: String }) bikeTypeFilter: string | null;
  @ApiProperty() isMultiBikeType: boolean;
  @ApiProperty({ nullable: true, type: String }) city: string | null;
  @ApiProperty({ nullable: true, type: String }) region: string | null;
  @ApiProperty() memberCount: number;
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt: Date;
}

export class ClubLeaderboardCyclistDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true, type: String }) fullName: string | null;
}

export class ClubLeaderboardEntryDto {
  @ApiProperty({ type: ClubLeaderboardCyclistDto }) cyclist: ClubLeaderboardCyclistDto;
  @ApiProperty() distance: number;
  @ApiProperty() rank: number;
}

export class ClubStatsDeltasDto {
  @ApiProperty({ nullable: true, type: Number }) distancePct: number | null;
  @ApiProperty() activeMembersDelta: number;
  @ApiProperty() activityDelta: number;
  @ApiProperty({ nullable: true, type: Number }) elevationPct: number | null;
}

export class ClubStatsDto {
  @ApiProperty() totalDistance: number;
  @ApiProperty() period: string;
  @ApiProperty({
    type: Object,
    additionalProperties: { type: 'number' },
    example: { asphalt: 0.6, offroad: 0.2, mixed: 0.2 },
  })
  terrainDistribution: Record<string, number>;
  @ApiProperty({ type: [ClubLeaderboardEntryDto] }) leaderboard: ClubLeaderboardEntryDto[];
  @ApiProperty() activeMemberCount: number;
  @ApiProperty() activityCount: number;
  @ApiProperty() upcomingEventCount: number;
  @ApiProperty({ nullable: true, type: String }) nextEventLabel: string | null;
  @ApiProperty() avgElevationPerActivity: number;
  @ApiProperty({ type: ClubStatsDeltasDto }) deltas: ClubStatsDeltasDto;
}

export class ClubDetailDto extends ClubDto {
  @ApiProperty() memberCount: number;
  @ApiProperty({ type: ClubStatsDto }) stats: ClubStatsDto;
}

export class ClubMemberCyclistDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true, type: String }) fullName: string | null;
  @ApiProperty() email: string;
}

export class ClubMemberDto {
  @ApiProperty({ type: ClubMemberCyclistDto }) cyclist: ClubMemberCyclistDto;
  @ApiProperty() isManager: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) joinedAt: Date;
}

export class LeaveClubResultDto {
  @ApiProperty({ example: true }) left: boolean;
  @ApiProperty() clubId: string;
}

/** Feed items form a union (RIDE | ROUTE_SHARED | EVENT_JOINED); this is a permissive superset. */
export class FeedItemDto {
  @ApiProperty({ enum: ['RIDE', 'ROUTE_SHARED', 'EVENT_JOINED'] }) type: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: ClubLeaderboardCyclistDto }) cyclist: ClubLeaderboardCyclistDto;
  @ApiProperty() title: string;
  @ApiProperty({ required: false }) bikeType?: string;
  @ApiProperty({ required: false }) distance?: number;
  @ApiProperty({ required: false }) elevation?: number;
  @ApiProperty({ required: false, description: 'RIDE: durée en secondes' }) duration?: number;
  @ApiProperty({ required: false, description: 'RIDE: vitesse moyenne' }) avgSpeed?: number;
  @ApiProperty({ required: false, description: 'ROUTE_SHARED: id du parcours' }) routeId?: string;
  @ApiProperty({ required: false, nullable: true, description: 'ROUTE_SHARED: niveau' }) level?: string | null;
  @ApiProperty({ required: false, description: 'EVENT_JOINED: id de l’événement' }) eventId?: string;
  @ApiProperty({ required: false, type: String, format: 'date-time' }) eventDate?: Date;
  @ApiProperty({ required: false, description: 'EVENT_JOINED: nombre de participants' }) participantCount?: number;
}

export class ClubRouteItemDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() bikeType: string;
  @ApiProperty() distance: number;
  @ApiProperty() elevation: number;
  @ApiProperty() timesRidden: number;
  @ApiProperty({ nullable: true, type: String }) thumbnailUrl: string | null;
  @ApiProperty({ nullable: true, type: String }) level: string | null;
}

export class TireRenewalMemberDto {
  @ApiProperty() cyclistId: string;
  @ApiProperty({ nullable: true, type: String }) fullName: string | null;
  @ApiProperty() currentKm: number;
  @ApiProperty() thresholdKm: number;
}

export class TireRenewalsDto {
  @ApiProperty() threshold: number;
  @ApiProperty({ type: [TireRenewalMemberDto] }) members: TireRenewalMemberDto[];
}

export class ClubInvitationDto {
  @ApiProperty() id: string;
  @ApiProperty() clubId: string;
  @ApiProperty() creatorId: string;
  @ApiProperty() token: string;
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt: Date;
  @ApiProperty() isRevoked: boolean;
  @ApiProperty() usageCount: number;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
}

export class CreateInvitationResponseDto extends ClubInvitationDto {
  @ApiProperty({ description: 'URL d’invitation complète' }) invitationUrl: string;
}

export class InvitationCreatorDto {
  @ApiProperty({ nullable: true, type: String }) fullName: string | null;
}

export class ClubInvitationWithCreatorDto extends ClubInvitationDto {
  @ApiProperty({ type: InvitationCreatorDto }) creator: InvitationCreatorDto;
}

export class JoinClubResultDto {
  @ApiProperty() alreadyMember: boolean;
  @ApiProperty({ type: ClubDto }) club: ClubDto;
  @ApiProperty({
    required: false,
    description: 'Présent uniquement si le cycliste vient de rejoindre le club',
    type: Object,
    additionalProperties: true,
  })
  membership?: Record<string, unknown>;
}

export class DeleteClubResultDto {
  @ApiProperty({ example: true }) deleted: boolean;
}

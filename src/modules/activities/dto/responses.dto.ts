import { ApiProperty } from '@nestjs/swagger';
import { ActivityDto } from '../../../common/dto/entities.dto';

export class ActivityListDto {
  @ApiProperty({ type: [ActivityDto] }) activities: ActivityDto[];
  @ApiProperty() total: number;
  @ApiProperty() limit: number;
  @ApiProperty() offset: number;
}

export class StravaAuthUrlDto {
  @ApiProperty({ example: 'https://www.strava.com/oauth/authorize?...' }) url: string;
  @ApiProperty({ description: 'État CSRF à conserver côté client' }) state: string;
}

export class StravaAthleteDto {
  @ApiProperty() id: number;
  @ApiProperty() username: string;
  @ApiProperty() firstname: string;
  @ApiProperty() lastname: string;
  @ApiProperty({ required: false }) city?: string;
  @ApiProperty({ required: false }) country?: string;
  @ApiProperty({ required: false, enum: ['M', 'F'] }) sex?: 'M' | 'F';
  @ApiProperty({ required: false }) profile?: string;
  @ApiProperty({ required: false }) profile_medium?: string;
}

export class StravaConnectResultDto {
  @ApiProperty({ example: true }) connected: boolean;
  @ApiProperty({ type: StravaAthleteDto }) athlete: StravaAthleteDto;
  @ApiProperty({ description: 'Nombre d’activités importées' }) imported: number;
}

export class StravaDisconnectResultDto {
  @ApiProperty({ example: false }) connected: boolean;
}

export class StravaSyncResultDto {
  @ApiProperty({ description: 'Nombre de nouvelles activités importées' }) newActivitiesImported: number;
  @ApiProperty({ type: String, format: 'date-time' }) lastSyncDate: Date;
}

export class ResetActivitiesResultDto {
  @ApiProperty({ example: true }) deleted: boolean;
  @ApiProperty({ description: 'Nombre d’activités réimportées depuis Strava' }) reimported: number;
}

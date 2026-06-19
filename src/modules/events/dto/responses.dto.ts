import { ApiProperty } from '@nestjs/swagger';

export class EventDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty({ type: String, format: 'date-time' }) startsAt: Date;
  @ApiProperty({ nullable: true, type: String }) departureLabel: string | null;
  @ApiProperty({ nullable: true, type: Number }) distance: number | null;
  @ApiProperty({ nullable: true, type: Number }) elevation: number | null;
  @ApiProperty({ nullable: true, type: String }) level: string | null;
  @ApiProperty({ nullable: true, type: String }) bikeType: string | null;
  @ApiProperty() isOfficial: boolean;
  @ApiProperty() requiresLicense: boolean;
  @ApiProperty({ required: false, nullable: true, type: String }) description?: string | null;
  @ApiProperty({ required: false, nullable: true, type: String }) location?: string | null;
  @ApiProperty() participantCount: number;
}

export class JoinEventResultDto {
  @ApiProperty({ example: true }) joined: boolean;
  @ApiProperty() eventId: string;
  @ApiProperty() participantCount: number;
}

export class LeaveEventResultDto {
  @ApiProperty({ example: true }) left: boolean;
  @ApiProperty() eventId: string;
  @ApiProperty() participantCount: number;
}

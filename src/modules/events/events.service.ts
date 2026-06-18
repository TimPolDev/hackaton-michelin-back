import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async getClubEvents(clubId: string, upcoming = true, limit = 3) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club not found');

    const now = new Date();

    const events = await this.prisma.club_events.findMany({
      where: {
        clubId,
        ...(upcoming ? { eventDate: { gte: now } } : {}),
      },
      include: {
        club_event_participants: {
          select: { cyclistId: true, confirmed: true },
        },
      },
      orderBy: { eventDate: 'asc' },
      take: limit,
    });

    return events.map(e => ({
      id: e.id,
      title: e.title,
      startsAt: e.eventDate,
      departureLabel: e.departureLabel,
      distance: e.distance,
      elevation: e.elevation,
      level: e.level,
      bikeType: e.bikeType,
      isOfficial: e.isOfficial,
      requiresLicense: e.requiresLicense,
      description: e.description,
      location: e.location,
      participantCount: e.club_event_participants.filter(p => p.confirmed).length,
    }));
  }

  async createEvent(clubId: string, cyclistId: string, dto: CreateEventDto) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club not found');

    // Only managers can create events
    const membership = await this.prisma.clubMembership.findUnique({
      where: { clubId_cyclistId: { clubId, cyclistId } },
    });
    if (!membership || !membership.isManager) {
      throw new ForbiddenException('Only managers can create events');
    }

    const event = await this.prisma.club_events.create({
      data: {
        clubId,
        title: dto.title,
        eventDate: new Date(dto.startsAt),
        description: dto.description,
        departureLabel: dto.departureLabel,
        distance: dto.distance,
        elevation: dto.elevation,
        level: dto.level,
        bikeType: dto.bikeType,
        isOfficial: dto.isOfficial ?? false,
        requiresLicense: dto.requiresLicense ?? false,
        discipline: dto.bikeType ?? 'ROAD',
        createdById: cyclistId,
      },
    });

    return {
      id: event.id,
      title: event.title,
      startsAt: event.eventDate,
      departureLabel: event.departureLabel,
      distance: event.distance,
      elevation: event.elevation,
      level: event.level,
      bikeType: event.bikeType,
      isOfficial: event.isOfficial,
      requiresLicense: event.requiresLicense,
      participantCount: 0,
    };
  }

  async joinEvent(eventId: string, cyclistId: string) {
    const event = await this.prisma.club_events.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Verify cyclist is a club member
    const membership = await this.prisma.clubMembership.findUnique({
      where: { clubId_cyclistId: { clubId: event.clubId, cyclistId } },
    });
    if (!membership) {
      throw new ForbiddenException('You must be a club member to join this event');
    }

    const existing = await this.prisma.club_event_participants.findUnique({
      where: { eventId_cyclistId: { eventId, cyclistId } },
    });

    if (existing) {
      throw new ConflictException('You have already joined this event');
    }

    const participation = await this.prisma.club_event_participants.create({
      data: {
        eventId,
        cyclistId,
        confirmed: true,
      },
    });

    const participantCount = await this.prisma.club_event_participants.count({
      where: { eventId, confirmed: true },
    });

    return {
      joined: true,
      eventId,
      participantCount,
    };
  }

  async leaveEvent(eventId: string, cyclistId: string) {
    const event = await this.prisma.club_events.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    const existing = await this.prisma.club_event_participants.findUnique({
      where: { eventId_cyclistId: { eventId, cyclistId } },
    });

    if (!existing) {
      throw new NotFoundException('You have not joined this event');
    }

    await this.prisma.club_event_participants.delete({
      where: { eventId_cyclistId: { eventId, cyclistId } },
    });

    const participantCount = await this.prisma.club_event_participants.count({
      where: { eventId, confirmed: true },
    });

    return {
      left: true,
      eventId,
      participantCount,
    };
  }
}

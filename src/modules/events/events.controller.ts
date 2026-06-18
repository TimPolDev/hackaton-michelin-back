import { Controller, Get, Post, Delete, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Controller()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly prisma: PrismaService,
  ) {}

  // GET /clubs/:id/events?upcoming=true&limit=3
  @Get('clubs/:id/events')
  async getClubEvents(
    @Param('id') clubId: string,
    @Query('upcoming') upcoming?: string,
    @Query('limit') limit?: string,
  ) {
    const isUpcoming = upcoming !== 'false';
    const parsedLimit = limit ? parseInt(limit, 10) : 3;
    return this.eventsService.getClubEvents(clubId, isUpcoming, parsedLimit);
  }

  // POST /clubs/:id/events
  @Post('clubs/:id/events')
  async createEvent(
    @CurrentUser() user: CurrentUserData,
    @Param('id') clubId: string,
    @Body() dto: CreateEventDto,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    return this.eventsService.createEvent(clubId, cyclist.id, dto);
  }

  // POST /events/:id/join
  @Post('events/:id/join')
  async joinEvent(
    @CurrentUser() user: CurrentUserData,
    @Param('id') eventId: string,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    return this.eventsService.joinEvent(eventId, cyclist.id);
  }

  // DELETE /events/:id/join
  @Delete('events/:id/join')
  async leaveEvent(
    @CurrentUser() user: CurrentUserData,
    @Param('id') eventId: string,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    return this.eventsService.leaveEvent(eventId, cyclist.id);
  }
}

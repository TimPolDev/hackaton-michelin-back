import { Controller, Get, Post, Delete, Param, Body, Query, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { EventDto, JoinEventResultDto, LeaveEventResultDto } from './dto/responses.dto';

@ApiTags('Events')
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({ description: 'Token manquant ou invalide' })
@Controller()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly prisma: PrismaService,
  ) {}

  // GET /clubs/:id/events?upcoming=true&limit=3
  @Get('clubs/:id/events')
  @ApiOperation({
    summary: 'Lister les événements d’un club',
    description: 'Retourne les événements d’un club (à venir par défaut).',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du club' })
  @ApiQuery({ name: 'upcoming', required: false, description: '`false` pour inclure les événements passés' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre max de résultats (défaut 3)' })
  @ApiOkResponse({ description: 'Liste d’événements', type: [EventDto] })
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
  @ApiOperation({
    summary: 'Créer un événement de club',
    description: 'Crée un événement dans un club au nom du cycliste authentifié.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du club' })
  @ApiCreatedResponse({ description: 'Événement créé', type: EventDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
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
  @ApiOperation({
    summary: 'Participer à un événement',
    description: 'Inscrit le cycliste authentifié à un événement.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de l’événement' })
  @ApiCreatedResponse({ description: 'Inscription enregistrée', type: JoinEventResultDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
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
  @ApiOperation({
    summary: 'Se désinscrire d’un événement',
    description: 'Retire le cycliste authentifié de la liste des participants.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de l’événement' })
  @ApiOkResponse({ description: 'Désinscription enregistrée', type: LeaveEventResultDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
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

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
  ApiBody,
} from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import { Public } from '../../common/decorators/public.decorator';
import {
  CreateClubResponseDto,
  InvitationPreviewDto,
  ClubDetailDto,
  ClubMemberDto,
  LeaveClubResultDto,
  FeedItemDto,
  ClubRouteItemDto,
  TireRenewalsDto,
  JoinClubResultDto,
  CreateInvitationResponseDto,
  ClubInvitationWithCreatorDto,
  ClubInvitationDto,
  DeleteClubResultDto,
} from './dto/responses.dto';

@ApiTags('Clubs')
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({ description: 'Token manquant ou invalide' })
@Controller('clubs')
export class ClubsController {
  constructor(
    private readonly clubsService: ClubsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un club',
    description: 'Crée un club dont le cycliste authentifié devient le créateur/administrateur.',
  })
  @ApiCreatedResponse({ description: 'Club créé', type: CreateClubResponseDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
  async createClub(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateClubDto,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    return this.clubsService.create(cyclist.id, dto);
  }

  @Public()
  @Get('by-invite/:token')
  @ApiOperation({
    summary: '[Public] Aperçu d’un club via lien d’invitation',
    description: 'Retourne un aperçu du club correspondant à un token d’invitation. Sans authentification.',
  })
  @ApiParam({ name: 'token', description: 'Token d’invitation' })
  @ApiOkResponse({ description: 'Aperçu du club', type: InvitationPreviewDto })
  @ApiNotFoundResponse({ description: 'Invitation invalide ou expirée' })
  async getClubByInvite(@Param('token') token: string) {
    return this.clubsService.getInvitationPreview(token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un club' })
  @ApiParam({ name: 'id', description: 'Identifiant du club' })
  @ApiOkResponse({ description: 'Détail du club', type: ClubDetailDto })
  @ApiNotFoundResponse({ description: 'Club introuvable' })
  async getClub(@Param('id') id: string) {
    return this.clubsService.findOne(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Membres d’un club' })
  @ApiParam({ name: 'id', description: 'Identifiant du club' })
  @ApiOkResponse({ description: 'Liste des membres', type: [ClubMemberDto] })
  async getMembers(@Param('id') id: string) {
    return this.clubsService.getMembers(id);
  }

  @Delete(':id/leave')
  @ApiOperation({
    summary: 'Quitter un club',
    description: 'Retire le cycliste authentifié du club.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du club' })
  @ApiOkResponse({ description: 'Club quitté', type: LeaveClubResultDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
  async leaveClub(
    @CurrentUser() user: CurrentUserData,
    @Param('id') clubId: string,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    return this.clubsService.leaveClub(clubId, cyclist.id);
  }

  @Get(':id/feed')
  @ApiOperation({
    summary: 'Fil d’actualité d’un club',
    description: 'Retourne les dernières activités/publications du club.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du club' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre max d’éléments (défaut 20)' })
  @ApiOkResponse({ description: 'Fil d’actualité', type: [FeedItemDto] })
  async getFeed(
    @Param('id') clubId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.clubsService.getFeed(clubId, parsedLimit);
  }

  @Get(':id/routes')
  @ApiOperation({
    summary: 'Parcours populaires d’un club',
    description: 'Retourne les parcours les plus parcourus par les membres.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du club' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre max de parcours (défaut 3)' })
  @ApiOkResponse({ description: 'Liste de parcours', type: [ClubRouteItemDto] })
  async getRoutes(
    @Param('id') clubId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 3;
    return this.clubsService.getRoutes(clubId, parsedLimit);
  }

  @Get(':id/tire-renewals')
  @ApiOperation({
    summary: 'Renouvellements de pneus du club',
    description: 'Retourne les membres dont les pneus arrivent en fin de vie (indicateur d’usure).',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du club' })
  @ApiOkResponse({ description: 'Liste des renouvellements suggérés', type: TireRenewalsDto })
  async getTireRenewals(@Param('id') clubId: string) {
    return this.clubsService.getTireRenewals(clubId);
  }

  @Post(':id/join')
  @ApiOperation({
    summary: 'Rejoindre un club',
    description: 'Rejoint un club via un token d’invitation valide.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du club' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { invitationToken: { type: 'string', description: 'Token d’invitation' } },
      required: ['invitationToken'],
    },
  })
  @ApiCreatedResponse({ description: 'Club rejoint', type: JoinClubResultDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
  async joinClub(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body('invitationToken') invitationToken: string,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    return this.clubsService.joinClub(cyclist.id, invitationToken);
  }

  @Post(':id/invitations')
  @ApiOperation({
    summary: 'Créer une invitation',
    description: 'Génère un lien d’invitation pour le club. Optionnellement avec une durée de validité.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du club' })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        expiresInDays: { type: 'number', description: 'Durée de validité en jours', example: 7 },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Invitation créée', type: CreateInvitationResponseDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
  async createInvitation(
    @CurrentUser() user: CurrentUserData,
    @Param('id') clubId: string,
    @Body('expiresInDays') expiresInDays?: number,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    const invitation = await this.clubsService.createInvitation(clubId, cyclist.id, expiresInDays);

    return {
      ...invitation,
      invitationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/clubs/join/${invitation.token}`,
    };
  }

  @Get(':id/invitations')
  @ApiOperation({
    summary: 'Lister les invitations d’un club',
    description: 'Retourne les invitations du club (réservé aux membres autorisés).',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du club' })
  @ApiOkResponse({ description: 'Liste des invitations', type: [ClubInvitationWithCreatorDto] })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
  async getInvitations(
    @CurrentUser() user: CurrentUserData,
    @Param('id') clubId: string,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    return this.clubsService.getInvitations(clubId, cyclist.id);
  }

  @Delete(':id/invitations/:invitationId')
  @ApiOperation({
    summary: 'Révoquer une invitation',
    description: 'Révoque une invitation existante du club.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du club' })
  @ApiParam({ name: 'invitationId', description: 'Identifiant de l’invitation' })
  @ApiOkResponse({ description: 'Invitation révoquée', type: ClubInvitationDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
  async revokeInvitation(
    @CurrentUser() user: CurrentUserData,
    @Param('invitationId') invitationId: string,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    return this.clubsService.revokeInvitation(invitationId, cyclist.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un club',
    description: 'Supprime un club. Réservé au créateur du club ou à un administrateur.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du club' })
  @ApiOkResponse({ description: 'Club supprimé', type: DeleteClubResultDto })
  @ApiNotFoundResponse({ description: 'Cycliste introuvable' })
  async deleteClub(
    @CurrentUser() user: CurrentUserData,
    @Param('id') clubId: string,
  ) {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId: user.supabaseUserId },
    });

    if (!cyclist) {
      throw new NotFoundException('Cyclist not found');
    }

    return this.clubsService.deleteClub(clubId, cyclist.id, user.isAdmin);
  }
}

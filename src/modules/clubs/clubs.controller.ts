import { Controller, Get, Post, Delete, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('clubs')
export class ClubsController {
  constructor(
    private readonly clubsService: ClubsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
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
  async getClubByInvite(@Param('token') token: string) {
    return this.clubsService.getInvitationPreview(token);
  }

  @Get(':id')
  async getClub(@Param('id') id: string) {
    return this.clubsService.findOne(id);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    return this.clubsService.getMembers(id);
  }

  @Delete(':id/leave')
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
  async getFeed(
    @Param('id') clubId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.clubsService.getFeed(clubId, parsedLimit);
  }

  @Get(':id/routes')
  async getRoutes(
    @Param('id') clubId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 3;
    return this.clubsService.getRoutes(clubId, parsedLimit);
  }

  @Get(':id/tire-renewals')
  async getTireRenewals(@Param('id') clubId: string) {
    return this.clubsService.getTireRenewals(clubId);
  }

  @Post(':id/join')
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

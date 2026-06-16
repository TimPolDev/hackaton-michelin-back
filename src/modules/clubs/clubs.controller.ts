import { Controller, Get, Post, Delete, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';

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

  @Get(':id')
  async getClub(@Param('id') id: string) {
    return this.clubsService.findOne(id);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    return this.clubsService.getMembers(id);
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

    const invitation = await this.clubsService.createInvitation(cyclist.id, clubId, expiresInDays);

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

    return this.clubsService.deleteClub(clubId, cyclist.id);
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ClubsService {
  constructor(private prisma: PrismaService) {}

  async create(cyclistId: string, dto: CreateClubDto) {
    const club = await this.prisma.club.create({
      data: {
        name: dto.name,
        description: dto.description,
        isMultiBikeType: dto.isMultiBikeType,
        bikeTypeFilter: dto.bikeTypeFilter,
        creatorId: cyclistId,
        memberships: {
          create: {
            cyclistId,
            isManager: true,
          },
        },
      },
      include: {
        memberships: true,
      },
    });

    // Generate initial invitation
    const invitation = await this.createInvitation(club.id, cyclistId, 30);

    return {
      ...club,
      invitationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/clubs/join/${invitation.token}`,
    };
  }

  async findOne(clubId: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      include: {
        memberships: {
          include: {
            cyclist: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Calculate stats
    const stats = await this.getClubStats(clubId);

    return {
      ...club,
      memberCount: club.memberships.length,
      stats,
    };
  }

  async getClubStats(clubId: string, period = 'month') {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      include: {
        memberships: {
          include: {
            cyclist: {
              include: {
                activities: true,
              },
            },
          },
        },
      },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'season':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Aggregate activities from all members
    let totalDistance = 0;
    const bikeTypeDistribution: Record<string, number> = {};
    const memberActivities: Array<{cyclist: any, distance: number}> = [];

    club.memberships.forEach(membership => {
      const cyclist = membership.cyclist;
      let cyclistDistance = 0;

      cyclist.activities.forEach(activity => {
        if (activity.activityDate >= startDate) {
          // Filter by club bike type if needed
          if (!club.isMultiBikeType && activity.bikeType !== club.bikeTypeFilter) {
            return;
          }

          totalDistance += activity.distance;
          cyclistDistance += activity.distance;

          // Track bike type distribution
          if (!bikeTypeDistribution[activity.bikeType]) {
            bikeTypeDistribution[activity.bikeType] = 0;
          }
          bikeTypeDistribution[activity.bikeType] += activity.distance;
        }
      });

      memberActivities.push({
        cyclist: {
          id: cyclist.id,
          fullName: cyclist.fullName,
        },
        distance: Math.round(cyclistDistance * 10) / 10,
      });
    });

    // Sort leaderboard
    memberActivities.sort((a, b) => b.distance - a.distance);
    const leaderboard = memberActivities.slice(0, 10).map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    // Calculate terrain distribution percentage
    const totalBikeTypeDistance = Object.values(bikeTypeDistribution).reduce((sum, d) => sum + d, 0);
    const terrainDistribution: Record<string, number> = {};

    Object.entries(bikeTypeDistribution).forEach(([bikeType, distance]) => {
      terrainDistribution[bikeType] = totalBikeTypeDistance > 0
        ? Math.round((distance / totalBikeTypeDistance) * 100)
        : 0;
    });

    return {
      totalDistance: Math.round(totalDistance * 10) / 10,
      period,
      terrainDistribution,
      leaderboard,
    };
  }

  async getMembers(clubId: string) {
    const memberships = await this.prisma.clubMembership.findMany({
      where: { clubId },
      include: {
        cyclist: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return memberships.map(m => ({
      cyclist: m.cyclist,
      isManager: m.isManager,
      joinedAt: m.joinedAt,
    }));
  }

  async joinClub(cyclistId: string, invitationToken: string) {
    // Validate invitation
    const invitation = await this.prisma.clubInvitation.findUnique({
      where: { token: invitationToken },
      include: { club: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation');
    }

    if (invitation.isRevoked) {
      throw new ForbiddenException('Invitation has been revoked');
    }

    if (invitation.expiresAt < new Date()) {
      throw new ForbiddenException('Invitation has expired');
    }

    // Check if already member
    const existing = await this.prisma.clubMembership.findUnique({
      where: {
        clubId_cyclistId: {
          clubId: invitation.clubId,
          cyclistId,
        },
      },
    });

    if (existing) {
      return {
        alreadyMember: true,
        club: invitation.club,
      };
    }

    // Create membership
    const membership = await this.prisma.clubMembership.create({
      data: {
        clubId: invitation.clubId,
        cyclistId,
        isManager: false,
      },
    });

    // Update invitation usage count
    await this.prisma.clubInvitation.update({
      where: { id: invitation.id },
      data: {
        usageCount: { increment: 1 },
      },
    });

    return {
      alreadyMember: false,
      membership,
      club: invitation.club,
    };
  }

  async createInvitation(clubId: string, cyclistId: string, expiresInDays = 30) {
    // Verify cyclist is manager
    const membership = await this.prisma.clubMembership.findUnique({
      where: {
        clubId_cyclistId: {
          clubId,
          cyclistId,
        },
      },
    });

    if (!membership || !membership.isManager) {
      throw new ForbiddenException('Only managers can create invitations');
    }

    const token = randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return this.prisma.clubInvitation.create({
      data: {
        clubId,
        creatorId: cyclistId,
        token,
        expiresAt,
      },
    });
  }

  async getInvitations(clubId: string, cyclistId: string) {
    // Verify cyclist is manager
    const membership = await this.prisma.clubMembership.findUnique({
      where: {
        clubId_cyclistId: {
          clubId,
          cyclistId,
        },
      },
    });

    if (!membership || !membership.isManager) {
      throw new ForbiddenException('Only managers can view invitations');
    }

    return this.prisma.clubInvitation.findMany({
      where: { clubId },
      include: {
        creator: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async revokeInvitation(invitationId: string, cyclistId: string) {
    const invitation = await this.prisma.clubInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Verify cyclist is manager
    const membership = await this.prisma.clubMembership.findUnique({
      where: {
        clubId_cyclistId: {
          clubId: invitation.clubId,
          cyclistId,
        },
      },
    });

    if (!membership || !membership.isManager) {
      throw new ForbiddenException('Only managers can revoke invitations');
    }

    return this.prisma.clubInvitation.update({
      where: { id: invitationId },
      data: { isRevoked: true },
    });
  }

  async deleteClub(clubId: string, cyclistId: string, isAdmin: boolean = false) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Creator or Michelin admin can delete
    if (club.creatorId !== cyclistId && !isAdmin) {
      throw new ForbiddenException('Only club creator or Michelin admin can delete the club');
    }

    await this.prisma.club.delete({
      where: { id: clubId },
    });

    return { deleted: true };
  }
}

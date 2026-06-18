import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import { randomBytes } from 'crypto';

const TIRE_RENEWAL_THRESHOLD_KM = 3000;

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
        city: dto.city,
        region: dto.region,
        foundedYear: dto.foundedYear,
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

    // Calculate date range for current period
    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        prevEndDate = new Date(startDate);
        prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'season':
        startDate = new Date(now.getFullYear(), 0, 1);
        prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
        prevEndDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Aggregate activities for current and previous period
    let totalDistance = 0;
    let prevTotalDistance = 0;
    let totalElevation = 0;
    let prevTotalElevation = 0;
    let activityCount = 0;
    let prevActivityCount = 0;
    const activeMemberIds = new Set<string>();
    const prevActiveMemberIds = new Set<string>();
    const bikeTypeDistribution: Record<string, number> = {};
    const memberActivities: Array<{ cyclist: any; distance: number }> = [];

    club.memberships.forEach(membership => {
      const cyclist = membership.cyclist;
      let cyclistDistance = 0;

      cyclist.activities.forEach(activity => {
        const isCurrentPeriod = activity.activityDate >= startDate && activity.activityDate <= now;
        const isPrevPeriod = activity.activityDate >= prevStartDate && activity.activityDate < prevEndDate;

        const matchesBikeType = club.isMultiBikeType || activity.bikeType === club.bikeTypeFilter;
        if (!matchesBikeType) return;

        if (isCurrentPeriod) {
          totalDistance += activity.distance;
          totalElevation += activity.elevationGain;
          cyclistDistance += activity.distance;
          activityCount++;
          activeMemberIds.add(cyclist.id);

          if (!bikeTypeDistribution[activity.bikeType]) {
            bikeTypeDistribution[activity.bikeType] = 0;
          }
          bikeTypeDistribution[activity.bikeType] += activity.distance;
        }

        if (isPrevPeriod) {
          prevTotalDistance += activity.distance;
          prevTotalElevation += activity.elevationGain;
          prevActivityCount++;
          prevActiveMemberIds.add(cyclist.id);
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

    // Compute deltas vs previous period
    const distancePct = prevTotalDistance > 0
      ? Math.round(((totalDistance - prevTotalDistance) / prevTotalDistance) * 100)
      : null;
    const activeMembersDelta = activeMemberIds.size - prevActiveMemberIds.size;
    const activityDelta = activityCount - prevActivityCount;
    const elevationPct = prevTotalElevation > 0
      ? Math.round(((totalElevation - prevTotalElevation) / prevTotalElevation) * 100)
      : null;

    const avgElevationPerActivity = activityCount > 0
      ? Math.round(totalElevation / activityCount)
      : 0;

    // Upcoming events
    const upcomingEvents = await this.prisma.club_events.findMany({
      where: {
        clubId,
        eventDate: { gte: now },
      },
      orderBy: { eventDate: 'asc' },
      take: 3,
    });

    const upcomingEventCount = upcomingEvents.length;
    const nextEventLabel = upcomingEvents[0]
      ? new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(upcomingEvents[0].eventDate))
      : null;

    return {
      totalDistance: Math.round(totalDistance * 10) / 10,
      period,
      terrainDistribution,
      leaderboard,
      activeMemberCount: activeMemberIds.size,
      activityCount,
      upcomingEventCount,
      nextEventLabel,
      avgElevationPerActivity,
      deltas: {
        distancePct,
        activeMembersDelta,
        activityDelta,
        elevationPct,
      },
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

  async leaveClub(clubId: string, cyclistId: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    const membership = await this.prisma.clubMembership.findUnique({
      where: { clubId_cyclistId: { clubId, cyclistId } },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this club');
    }

    // Prevent last manager from leaving
    if (membership.isManager) {
      const managerCount = await this.prisma.clubMembership.count({
        where: { clubId, isManager: true },
      });
      if (managerCount <= 1) {
        throw new ForbiddenException(
          'You are the last manager. Transfer management before leaving.',
        );
      }
    }

    await this.prisma.clubMembership.delete({
      where: { clubId_cyclistId: { clubId, cyclistId } },
    });

    return { left: true, clubId };
  }

  async getFeed(clubId: string, limit = 20) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      include: {
        memberships: { select: { cyclistId: true } },
      },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    const memberIds = club.memberships.map(m => m.cyclistId);

    // Fetch recent activities from club members
    const activities = await this.prisma.activity.findMany({
      where: { cyclistId: { in: memberIds } },
      include: {
        cyclist: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 2,
    });

    // Fetch recent routes shared in the club
    const routes = await this.prisma.club_routes.findMany({
      where: { clubId },
      include: {
        cyclists: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Fetch recent event participations for this club
    const eventParticipations = await this.prisma.club_event_participants.findMany({
      where: {
        club_events: { clubId },
      },
      include: {
        cyclists: { select: { id: true, fullName: true } },
        club_events: { select: { id: true, title: true, eventDate: true } },
      },
      orderBy: { joinedAt: 'desc' },
      take: limit,
    });

    // Build unified feed items
    const feedItems: any[] = [];

    for (const a of activities) {
      feedItems.push({
        type: 'RIDE',
        createdAt: a.createdAt,
        cyclist: { id: a.cyclist.id, fullName: a.cyclist.fullName },
        bikeType: a.bikeType,
        title: `Sortie ${a.bikeType}`,
        startedFrom: null,
        distance: Math.round(a.distance * 10) / 10,
        elevation: a.elevationGain,
        duration: a.movingTime,
        avgSpeed: a.averageSpeed,
      });
    }

    for (const r of routes) {
      feedItems.push({
        type: 'ROUTE_SHARED',
        createdAt: r.createdAt,
        cyclist: { id: r.cyclists.id, fullName: r.cyclists.fullName },
        bikeType: r.discipline,
        routeId: r.id,
        title: r.title,
        distance: r.distanceKm,
        elevation: r.elevationGain,
        terrainMix: null,
        level: r.level,
      });
    }

    for (const ep of eventParticipations) {
      feedItems.push({
        type: 'EVENT_JOINED',
        createdAt: ep.joinedAt,
        cyclist: { id: ep.cyclists.id, fullName: ep.cyclists.fullName },
        eventId: ep.club_events.id,
        title: ep.club_events.title,
        eventDate: ep.club_events.eventDate,
        participantCount: 0, // will be enriched if needed
      });
    }

    // Sort by createdAt desc and take limit
    feedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return feedItems.slice(0, limit);
  }

  async getRoutes(clubId: string, limit = 3) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club not found');

    const routes = await this.prisma.club_routes.findMany({
      where: { clubId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return routes.map(r => ({
      id: r.id,
      title: r.title,
      bikeType: r.discipline,
      distance: r.distanceKm,
      elevation: r.elevationGain,
      timesRidden: r.completedCount,
      thumbnailUrl: r.thumbnailUrl ?? null,
      level: r.level ?? null,
    }));
  }

  async getTireRenewals(clubId: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      include: {
        memberships: {
          include: {
            cyclist: {
              include: {
                activities: {
                  orderBy: { activityDate: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!club) throw new NotFoundException('Club not found');

    const threshold = TIRE_RENEWAL_THRESHOLD_KM;

    const members = club.memberships
      .map(m => {
        const cyclist = m.cyclist;
        // Sum last 12 months of distance as proxy for km since install
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

        const recentKm = cyclist.activities
          .filter(a => a.activityDate >= twelveMonthsAgo)
          .reduce((sum, a) => sum + a.distance, 0);

        return {
          cyclistId: cyclist.id,
          fullName: cyclist.fullName ?? 'Unknown',
          currentKm: Math.round(recentKm),
          thresholdKm: threshold,
        };
      })
      .filter(m => m.currentKm > threshold)
      .sort((a, b) => b.currentKm - a.currentKm);

    return {
      threshold,
      members,
    };
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

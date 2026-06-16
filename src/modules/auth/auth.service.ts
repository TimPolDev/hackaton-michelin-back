import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Complete cyclist profile after Supabase authentication
   */
  async completeProfile(supabaseUserId: string, email: string, dto: CompleteProfileDto) {
    // Check if cyclist already exists
    const existing = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId },
    });

    if (existing) {
      throw new BadRequestException('Profile already completed');
    }

    // Create cyclist with profile and bike types
    const cyclist = await this.prisma.cyclist.create({
      data: {
        supabaseUserId,
        email,
        fullName: dto.fullName,
        profile: {
          create: {
            practiceStyle: dto.practiceStyle,
            primaryBikeType: dto.primaryBikeType,
            preferGrip: dto.preferences?.grip || 5,
            preferEndurance: dto.preferences?.endurance || 5,
            preferLightness: dto.preferences?.lightness || 5,
            preferVersatility: dto.preferences?.versatility || 5,
          },
        },
        bikeTypes: {
          create: dto.bikeTypes.map((bikeType) => ({
            bikeType,
            isPrimary: bikeType === dto.primaryBikeType,
          })),
        },
      },
      include: {
        profile: true,
        bikeTypes: true,
      },
    });

    return cyclist;
  }

  /**
   * Get or create cyclist from Supabase user
   */
  async getOrCreateCyclist(supabaseUserId: string, email: string) {
    let cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId },
      include: {
        profile: true,
        bikeTypes: true,
      },
    });

    if (!cyclist) {
      // Create minimal cyclist record (profile will be completed later)
      cyclist = await this.prisma.cyclist.create({
        data: {
          supabaseUserId,
          email,
        },
        include: {
          profile: true,
          bikeTypes: true,
        },
      });
    }

    return cyclist;
  }

  /**
   * Check if cyclist has completed their profile
   */
  async isProfileComplete(supabaseUserId: string): Promise<boolean> {
    const cyclist = await this.prisma.cyclist.findUnique({
      where: { supabaseUserId },
      include: {
        profile: true,
        bikeTypes: true,
      },
    });

    if (!cyclist) return false;

    return !!(
      cyclist.profile &&
      cyclist.bikeTypes.length > 0
    );
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Complete (or update) the cyclist profile after Supabase authentication.
   * The auth guard may have already created a minimal cyclist row, so we
   * upsert instead of failing when the cyclist already exists.
   */
  async completeProfile(supabaseUserId: string, email: string, dto: CompleteProfileDto) {
    // Ensure the cyclist exists (the auth guard usually creates it on the
    // first authenticated request) and keep the full name up to date.
    const cyclist = await this.prisma.cyclist.upsert({
      where: { supabaseUserId },
      update: { fullName: dto.fullName },
      create: {
        supabaseUserId,
        email,
        fullName: dto.fullName,
      },
    });

    const profileData = {
      practiceStyle: dto.practiceStyle,
      primaryBikeType: dto.primaryBikeType,
      preferGrip: dto.preferences?.grip ?? 5,
      preferEndurance: dto.preferences?.endurance ?? 5,
      preferLightness: dto.preferences?.lightness ?? 5,
      preferVersatility: dto.preferences?.versatility ?? 5,
    };

    await this.prisma.$transaction([
      // Upsert the 1:1 profile.
      this.prisma.cyclistProfile.upsert({
        where: { cyclistId: cyclist.id },
        update: profileData,
        create: { cyclistId: cyclist.id, ...profileData },
      }),
      // Replace the bike types with the new selection.
      this.prisma.cyclistBikeType.deleteMany({
        where: { cyclistId: cyclist.id },
      }),
      this.prisma.cyclistBikeType.createMany({
        data: dto.bikeTypes.map((bikeType) => ({
          cyclistId: cyclist.id,
          bikeType,
          isPrimary: bikeType === dto.primaryBikeType,
        })),
      }),
    ]);

    return this.prisma.cyclist.findUnique({
      where: { id: cyclist.id },
      include: {
        profile: true,
        bikeTypes: true,
      },
    });
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

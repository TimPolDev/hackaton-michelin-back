import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { CompleteProfileDto } from './dto/complete-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('complete-profile')
  async completeProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.authService.completeProfile(
      user.supabaseUserId,
      user.email,
      dto,
    );
  }

  @Get('profile-status')
  async checkProfileStatus(@CurrentUser() user: CurrentUserData) {
    const isComplete = await this.authService.isProfileComplete(user.supabaseUserId);
    return {
      isComplete,
      supabaseUserId: user.supabaseUserId,
      email: user.email,
    };
  }

  @Get('me')
  async getCurrentUser(@CurrentUser() user: CurrentUserData) {
    return {
      supabaseUserId: user.supabaseUserId,
      email: user.email,
      isAdmin: user.isAdmin,
    };
  }
}

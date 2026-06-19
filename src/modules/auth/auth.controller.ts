import { Controller, Post, Body, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import {
  ProfileStatusResponseDto,
  CurrentUserResponseDto,
  CompleteProfileResponseDto,
} from './dto/responses.dto';

@ApiTags('Auth')
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({ description: 'Token manquant ou invalide' })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('complete-profile')
  @ApiOperation({
    summary: 'Compléter le profil',
    description:
      'Crée ou met à jour le profil du cycliste authentifié (nom, types de vélo, préférences).',
  })
  @ApiOkResponse({ description: 'Profil créé/mis à jour', type: CompleteProfileResponseDto })
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
  @ApiOperation({
    summary: 'Statut de complétion du profil',
    description: 'Indique si le profil de l’utilisateur authentifié est complet.',
  })
  @ApiOkResponse({ description: 'Statut du profil', type: ProfileStatusResponseDto })
  async checkProfileStatus(@CurrentUser() user: CurrentUserData) {
    const isComplete = await this.authService.isProfileComplete(user.supabaseUserId);
    return {
      isComplete,
      supabaseUserId: user.supabaseUserId,
      email: user.email,
    };
  }

  @Get('me')
  @ApiOperation({
    summary: 'Utilisateur courant',
    description: 'Retourne les informations d’identité de l’utilisateur authentifié.',
  })
  @ApiOkResponse({ description: 'Identité de l’utilisateur', type: CurrentUserResponseDto })
  async getCurrentUser(@CurrentUser() user: CurrentUserData) {
    return {
      supabaseUserId: user.supabaseUserId,
      email: user.email,
      isAdmin: user.isAdmin,
    };
  }
}

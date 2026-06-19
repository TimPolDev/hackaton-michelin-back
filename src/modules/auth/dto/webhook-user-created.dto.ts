import { IsString, IsEmail, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookUserCreatedDto {
  @ApiProperty({ description: 'Identifiant Supabase de l’utilisateur', example: 'a1b2c3d4-...' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Email de l’utilisateur', example: 'jean.dupont@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Métadonnées brutes fournies par Supabase',
    example: { full_name: 'Jean Dupont', avatar_url: 'https://...' },
  })
  @IsObject()
  @IsOptional()
  raw_user_meta_data?: {
    full_name?: string;
    avatar_url?: string;
  };
}

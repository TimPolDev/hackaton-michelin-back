import { IsString, IsEmail, IsObject, IsOptional } from 'class-validator';

export class WebhookUserCreatedDto {
  @IsString()
  id: string;

  @IsEmail()
  email: string;

  @IsObject()
  @IsOptional()
  raw_user_meta_data?: {
    full_name?: string;
    avatar_url?: string;
  };
}

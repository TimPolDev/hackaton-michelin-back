import { IsString, IsOptional, IsObject } from 'class-validator';
import { PreferencesDto } from '../../auth/dto/complete-profile.dto';

export class UpdateCyclistDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  practiceStyle?: string;

  @IsOptional()
  @IsObject()
  preferences?: PreferencesDto;
}

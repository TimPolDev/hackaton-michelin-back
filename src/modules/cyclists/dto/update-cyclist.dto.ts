import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PreferencesDto } from '../../auth/dto/complete-profile.dto';

export class UpdateCyclistDto {
  @ApiPropertyOptional({ description: 'Nom complet', example: 'Jean Dupont' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Style de pratique', example: 'Loisir' })
  @IsOptional()
  @IsString()
  practiceStyle?: string;

  @ApiPropertyOptional({ description: 'Préférences de pneu (1-10 par critère)', type: PreferencesDto })
  @IsOptional()
  @IsObject()
  preferences?: PreferencesDto;
}

import { IsString, IsArray, IsOptional, IsObject, IsInt, Min, Max, IsIn } from 'class-validator';

export class PreferencesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  grip?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  endurance?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  lightness?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  versatility?: number;
}

export class CompleteProfileDto {
  @IsString()
  fullName: string;

  @IsArray()
  @IsString({ each: true })
  bikeTypes: string[];

  @IsString()
  @IsIn(['ROAD', 'MTB', 'GRAVEL', 'E_BIKE', 'COMMUTING'])
  primaryBikeType: string;

  @IsOptional()
  @IsString()
  practiceStyle?: string;

  @IsOptional()
  @IsObject()
  preferences?: PreferencesDto;
}

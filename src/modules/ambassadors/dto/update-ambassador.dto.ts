import { IsString, IsBoolean, IsInt, IsOptional, MinLength } from 'class-validator';

export class UpdateAmbassadorDto {
  @IsString()
  @IsOptional()
  @MinLength(10)
  bio?: string;

  @IsString()
  @IsOptional()
  discipline?: string;

  @IsString()
  @IsOptional()
  skillLevel?: string;

  @IsBoolean()
  @IsOptional()
  showRidingData?: boolean;

  @IsString()
  @IsOptional()
  featuredSegments?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}

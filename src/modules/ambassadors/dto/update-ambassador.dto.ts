import { IsString, IsBoolean, IsInt, IsOptional, MinLength, IsArray } from 'class-validator';

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

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @IsString()
  @IsOptional()
  articleContent?: string;

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

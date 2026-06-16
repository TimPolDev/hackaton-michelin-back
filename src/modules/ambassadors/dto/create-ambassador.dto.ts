import { IsString, IsBoolean, IsInt, IsOptional, IsNotEmpty, MinLength, IsArray, IsUrl } from 'class-validator';

export class CreateAmbassadorDto {
  @IsString()
  @IsNotEmpty()
  cyclistId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  bio: string;

  @IsString()
  @IsNotEmpty()
  discipline: string;

  @IsString()
  @IsNotEmpty()
  skillLevel: string;

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

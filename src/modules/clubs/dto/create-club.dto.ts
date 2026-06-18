import { IsString, IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateClubDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  isMultiBikeType: boolean;

  @IsOptional()
  @IsString()
  bikeTypeFilter?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  foundedYear?: number;
}

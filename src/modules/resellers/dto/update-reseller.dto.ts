import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateResellerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsUrl()
  @IsOptional()
  website?: string;
}

import { IsString, IsBoolean, IsOptional } from 'class-validator';

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
}

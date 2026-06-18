import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateResellerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsUrl()
  website: string;
}

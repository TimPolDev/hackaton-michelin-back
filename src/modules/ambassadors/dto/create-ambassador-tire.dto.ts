import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateAmbassadorTireDto {
  @IsString()
  @IsNotEmpty()
  tireId: string;

  @IsString()
  @IsNotEmpty()
  bikeType: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  testimonial: string;
}

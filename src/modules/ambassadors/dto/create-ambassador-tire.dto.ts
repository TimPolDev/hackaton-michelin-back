import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAmbassadorTireDto {
  @ApiProperty({ description: 'Identifiant du pneu', example: 'uuid-tire' })
  @IsString()
  @IsNotEmpty()
  tireId: string;

  @ApiProperty({ description: 'Type de vélo associé', example: 'ROAD' })
  @IsString()
  @IsNotEmpty()
  bikeType: string;

  @ApiProperty({ description: 'Témoignage de l’ambassadeur (min. 20 caractères)', minLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  testimonial: string;
}

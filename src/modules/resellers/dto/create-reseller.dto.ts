import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateResellerDto {
  @ApiProperty({ description: 'Nom du revendeur', example: 'Cycles Martin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Région', example: 'Auvergne-Rhône-Alpes' })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty({ description: 'Pays', example: 'France' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ description: 'Site web', example: 'https://cycles-martin.fr' })
  @IsUrl()
  website: string;
}

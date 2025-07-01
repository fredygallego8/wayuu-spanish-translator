import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadAudioDto {
  @ApiProperty({
    description: 'Título descriptivo del audio',
    example: 'Presentación personal en wayuunaiki - María',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Descripción adicional del contenido',
    example: 'Audio grabado en La Guajira, hablante nativo',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Fuente o origen del audio',
    example: 'Grabación directa',
  })
  @IsString()
  @IsOptional()
  source?: string;
} 
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TranslationDirection {
  WAYUU_TO_SPANISH = 'wayuu-to-spanish',
  SPANISH_TO_WAYUU = 'spanish-to-wayuu',
}

export class TranslateDto {
  @ApiProperty({
    description: 'Text to translate',
    example: 'Tü süchukua wayuu',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Translation direction',
    enum: TranslationDirection,
    example: TranslationDirection.WAYUU_TO_SPANISH,
  })
  @IsEnum(TranslationDirection)
  direction: TranslationDirection;

  @ApiProperty({
    description: 'Source dataset to prioritize for translation',
    example: 'orkidea/wayuu_CO_test',
    required: false,
  })
  @IsOptional()
  @IsString()
  preferredDataset?: string;
}

export class TranslationResponseDto {
  @ApiProperty({
    description: 'Original text',
    example: 'Tü süchukua wayuu',
  })
  originalText: string;

  @ApiProperty({
    description: 'Translated text',
    example: 'Tú eres una persona wayuu',
  })
  translatedText: string;

  @ApiProperty({
    description: 'Translation direction used',
    enum: TranslationDirection,
  })
  direction: TranslationDirection;

  @ApiProperty({
    description: 'Confidence score of the translation (0-1)',
    example: 0.85,
  })
  confidence: number;

  @ApiProperty({
    description: 'Dataset used for translation',
    example: 'orkidea/wayuu_CO_test',
  })
  sourceDataset: string;

  @ApiProperty({
    description: 'Alternative translations if available',
    type: [String],
    required: false,
  })
  alternatives?: string[];

  @ApiProperty({
    description: 'Cultural or linguistic context information',
    required: false,
  })
  contextInfo?: string;
}
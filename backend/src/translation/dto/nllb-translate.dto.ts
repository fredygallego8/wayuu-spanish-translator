import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SupportedLanguage {
  WAYUU = 'wayuu',
  SPANISH = 'spanish'
}

export class DirectTranslateDto {
  @ApiProperty({
    description: 'Text to translate',
    example: 'Kasa püshukua wayuu'
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Source language',
    enum: SupportedLanguage,
    example: SupportedLanguage.WAYUU
  })
  @IsEnum(SupportedLanguage)
  sourceLang: SupportedLanguage;

  @ApiProperty({
    description: 'Target language',
    enum: SupportedLanguage,
    example: SupportedLanguage.SPANISH
  })
  @IsEnum(SupportedLanguage)
  targetLang: SupportedLanguage;
}

export class BackTranslateDto {
  @ApiProperty({
    description: 'Wayuu text for back-translation quality validation',
    example: 'Anaa wayuu eekai süchon wane'
  })
  @IsString()
  @IsNotEmpty()
  wayuuText: string;
}

export class BatchTranslateDto {
  @ApiProperty({
    description: 'Array of texts to translate',
    example: ['Kasa püshukua wayuu', 'Anaa wayuu eekai süchon wane'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  texts: string[];

  @ApiProperty({
    description: 'Source language',
    enum: SupportedLanguage,
    example: SupportedLanguage.WAYUU
  })
  @IsEnum(SupportedLanguage)
  sourceLang: SupportedLanguage;

  @ApiProperty({
    description: 'Target language',
    enum: SupportedLanguage,
    example: SupportedLanguage.SPANISH
  })
  @IsEnum(SupportedLanguage)
  targetLang: SupportedLanguage;

  @ApiProperty({
    description: 'Batch size for processing (optional)',
    example: 5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  batchSize?: number;
}

export class DetectLanguageDto {
  @ApiProperty({
    description: 'Text for language detection',
    example: 'Kasa püshukua wayuu eekai süchon wane'
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}

// Response DTOs
export class DirectTranslationResponseDto {
  @ApiProperty({ description: 'Translated text' })
  translatedText: string;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'Source language' })
  sourceLanguage: string;

  @ApiProperty({ description: 'Target language' })
  targetLanguage: string;

  @ApiProperty({ description: 'Model used' })
  model: string;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  processingTime: number;
}

export class BackTranslationResponseDto {
  @ApiProperty({ description: 'Original wayuu text' })
  original: string;

  @ApiProperty({ description: 'Spanish translation' })
  spanish: string;

  @ApiProperty({ description: 'Back-translated wayuu text' })
  backToWayuu: string;

  @ApiProperty({ description: 'Quality score (0-1)' })
  qualityScore: number;

  @ApiProperty({ description: 'Overall confidence' })
  confidence: number;
}

export class LanguageDetectionResponseDto {
  @ApiProperty({ 
    description: 'Detected language',
    enum: ['wayuu', 'spanish', 'mixed', 'unknown']
  })
  language: 'wayuu' | 'spanish' | 'mixed' | 'unknown';

  @ApiProperty({ description: 'Input text' })
  text: string;
}

export class BatchTranslationResponseDto {
  @ApiProperty({ 
    description: 'Array of translation results',
    type: [DirectTranslationResponseDto]
  })
  results: DirectTranslationResponseDto[];

  @ApiProperty({ description: 'Total processed texts' })
  totalProcessed: number;

  @ApiProperty({ description: 'Successful translations' })
  successCount: number;

  @ApiProperty({ description: 'Failed translations' })
  errorCount: number;

  @ApiProperty({ description: 'Overall processing time in milliseconds' })
  totalProcessingTime: number;
}
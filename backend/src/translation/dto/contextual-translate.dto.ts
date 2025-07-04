import { IsString, IsEnum, IsOptional, IsBoolean, ValidateNested, IsObject, IsArray, IsNumber, Min, Max, IsNotEmpty, Length } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TranslationDomain {
  CULTURAL = 'cultural',
  FAMILY = 'family',
  CEREMONIAL = 'ceremonial',
  DAILY = 'daily',
  EDUCATIONAL = 'educational',
  TECHNICAL = 'technical'
}

export enum FormalityLevel {
  FORMAL = 'formal',
  INFORMAL = 'informal',
  CEREMONIAL = 'ceremonial'
}

export enum SourceLanguage {
  WAYUU = 'wayuu',
  SPANISH = 'spanish'
}

export enum TargetLanguage {
  WAYUU = 'wayuu',
  SPANISH = 'spanish'
}

export class TranslationMemoryDto {
  @ApiProperty({ description: 'Source text of the translation memory entry' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  sourceText: string;

  @ApiProperty({ description: 'Target text of the translation memory entry' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  targetText: string;

  @ApiProperty({ description: 'Context of the translation memory entry' })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiProperty({ description: 'Timestamp of the translation memory entry' })
  @IsOptional()
  timestamp?: Date;

  @ApiProperty({ description: 'Quality score of the translation (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  quality: number;

  @ApiProperty({ description: 'Domain of the translation memory entry', enum: TranslationDomain })
  @IsEnum(TranslationDomain)
  domain: TranslationDomain;
}

export class TranslationContextDto {
  @ApiProperty({ 
    description: 'Domain of the translation', 
    enum: TranslationDomain,
    example: TranslationDomain.CULTURAL
  })
  @IsEnum(TranslationDomain)
  domain: TranslationDomain;

  @ApiProperty({ 
    description: 'Cultural markers detected or provided',
    example: ['greeting', 'respect', 'family'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  culturalMarkers?: string[];

  @ApiProperty({ 
    description: 'Previous translations for context',
    type: [TranslationMemoryDto],
    required: false
  })
  @ValidateNested({ each: true })
  @Type(() => TranslationMemoryDto)
  @IsArray()
  @IsOptional()
  previousTranslations?: TranslationMemoryDto[];

  @ApiPropertyOptional({ 
    description: 'Custom glossary for terminology consistency',
    example: { 'taya': 'yo', 'wayuu': 'wayuu', 'anasü': 'hermano' }
  })
  @IsObject()
  @IsOptional()
  glossary?: Record<string, string>;

  @ApiProperty({ 
    description: 'Formality level of the translation',
    enum: FormalityLevel,
    example: FormalityLevel.INFORMAL
  })
  @IsEnum(FormalityLevel)
  formality: FormalityLevel;
}

export class ContextualTranslateDto {
  @ApiProperty({ 
    description: 'Text to translate',
    example: 'taya wayuu anasü',
    minLength: 1,
    maxLength: 5000
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 5000)
  @Transform(({ value }) => value?.trim())
  text: string;

  @ApiProperty({ 
    description: 'Source language',
    enum: SourceLanguage,
    example: SourceLanguage.WAYUU
  })
  @IsEnum(SourceLanguage)
  sourceLang: SourceLanguage;

  @ApiProperty({ 
    description: 'Target language',
    enum: TargetLanguage,
    example: TargetLanguage.SPANISH
  })
  @IsEnum(TargetLanguage)
  targetLang: TargetLanguage;

  @ApiProperty({ 
    description: 'Translation context for cultural and domain awareness',
    type: TranslationContextDto
  })
  @ValidateNested()
  @Type(() => TranslationContextDto)
  context: TranslationContextDto;

  @ApiPropertyOptional({ 
    description: 'Whether to preserve terminology consistency',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  preserveTerminology?: boolean;

  @ApiPropertyOptional({ 
    description: 'Whether to use translation memory',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  useMemory?: boolean;

  @ApiPropertyOptional({ 
    description: 'Custom timeout in milliseconds',
    minimum: 1000,
    maximum: 60000,
    default: 30000
  })
  @IsNumber()
  @Min(1000)
  @Max(60000)
  @IsOptional()
  timeout?: number;

  @ApiPropertyOptional({ 
    description: 'Additional metadata for analytics',
    example: { userId: 'user123', sessionId: 'sess456' }
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class QualityMetricsDto {
  @ApiPropertyOptional({ description: 'BLEU score (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  bleuScore?: number;

  @ApiProperty({ description: 'Length ratio between source and target' })
  @IsNumber()
  @Min(0)
  lengthRatio: number;

  @ApiProperty({ description: 'Context relevance score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  contextRelevance: number;

  @ApiProperty({ description: 'Terminology consistency score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  terminologyConsistency: number;

  @ApiProperty({ description: 'Cultural adaptation score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  culturalAdaptation: number;

  @ApiProperty({ description: 'Overall quality score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore: number;
}

export class ContextualTranslationResponseDto {
  @ApiProperty({ description: 'Translated text', example: 'yo soy wayuu hermano' })
  @IsString()
  translatedText: string;

  @ApiProperty({ description: 'Confidence score (0-1)', example: 0.95 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({ 
    description: 'Contextual adjustments applied',
    example: ['Adaptación ceremonial aplicada', 'Registro formal aplicado'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  contextualAdjustments: string[];

  @ApiProperty({ 
    description: 'Translation memory matches found',
    type: [TranslationMemoryDto]
  })
  @ValidateNested({ each: true })
  @Type(() => TranslationMemoryDto)
  @IsArray()
  memoryMatches: TranslationMemoryDto[];

  @ApiProperty({ 
    description: 'Terminology applied during translation',
    example: { 'taya': 'yo', 'wayuu': 'wayuu' }
  })
  @IsObject()
  terminologyApplied: Record<string, string>;

  @ApiPropertyOptional({ 
    description: 'Cultural notes about the translation',
    example: ['Los saludos wayuu varían según la hora del día'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  culturalNotes?: string[];

  @ApiProperty({ description: 'Quality score (0-100)', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  qualityScore: number;

  @ApiProperty({ description: 'Processing time in milliseconds', example: 1250 })
  @IsNumber()
  @Min(0)
  processingTime: number;

  @ApiProperty({ description: 'Model used for translation', example: 'nllb-context-aware-v2.0' })
  @IsString()
  model: string;

  @ApiPropertyOptional({ 
    description: 'Detailed quality metrics',
    type: QualityMetricsDto
  })
  @ValidateNested()
  @Type(() => QualityMetricsDto)
  @IsOptional()
  qualityMetrics?: QualityMetricsDto;

  @ApiPropertyOptional({ 
    description: 'Cache information',
    example: { hit: false, key: 'wayuu-spanish|taya wayuu anasü' }
  })
  @IsObject()
  @IsOptional()
  cacheInfo?: {
    hit: boolean;
    key: string;
    ttl?: number;
  };

  @ApiPropertyOptional({ 
    description: 'Translation alternatives',
    example: [
      { text: 'yo soy wayuu hermano', confidence: 0.95 },
      { text: 'soy un wayuu hermano', confidence: 0.87 }
    ]
  })
  @IsArray()
  @IsOptional()
  alternatives?: Array<{
    text: string;
    confidence: number;
    model?: string;
  }>;
}

export class BatchContextualTranslateDto {
  @ApiProperty({ 
    description: 'Array of texts to translate',
    example: ['taya wayuu', 'kaaꞌula anasü', 'kassain'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Length(1, 1000, { each: true })
  texts: string[];

  @ApiProperty({ 
    description: 'Source language',
    enum: SourceLanguage,
    example: SourceLanguage.WAYUU
  })
  @IsEnum(SourceLanguage)
  sourceLang: SourceLanguage;

  @ApiProperty({ 
    description: 'Target language',
    enum: TargetLanguage,
    example: TargetLanguage.SPANISH
  })
  @IsEnum(TargetLanguage)
  targetLang: TargetLanguage;

  @ApiProperty({ 
    description: 'Common translation context',
    type: TranslationContextDto
  })
  @ValidateNested()
  @Type(() => TranslationContextDto)
  context: TranslationContextDto;

  @ApiPropertyOptional({ 
    description: 'Whether to preserve terminology consistency',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  preserveTerminology?: boolean;

  @ApiPropertyOptional({ 
    description: 'Whether to use translation memory',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  useMemory?: boolean;

  @ApiPropertyOptional({ 
    description: 'Maximum number of texts to process in parallel',
    minimum: 1,
    maximum: 10,
    default: 5
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxParallel?: number;
}

export class BatchContextualTranslationResponseDto {
  @ApiProperty({ 
    description: 'Array of translation results',
    type: [ContextualTranslationResponseDto]
  })
  @ValidateNested({ each: true })
  @Type(() => ContextualTranslationResponseDto)
  @IsArray()
  translations: ContextualTranslationResponseDto[];

  @ApiProperty({ description: 'Total processing time in milliseconds' })
  @IsNumber()
  @Min(0)
  totalProcessingTime: number;

  @ApiProperty({ description: 'Number of successful translations' })
  @IsNumber()
  @Min(0)
  successCount: number;

  @ApiProperty({ description: 'Number of failed translations' })
  @IsNumber()
  @Min(0)
  errorCount: number;

  @ApiPropertyOptional({ 
    description: 'Errors that occurred during batch processing',
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  errors?: string[];

  @ApiProperty({ description: 'Overall quality score for the batch' })
  @IsNumber()
  @Min(0)
  @Max(100)
  batchQualityScore: number;
} 
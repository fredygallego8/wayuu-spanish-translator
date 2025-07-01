import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TranslationDirection {
  WAYUU_TO_SPANISH = 'wayuu-to-spanish',
  SPANISH_TO_WAYUU = 'spanish-to-wayuu',
}

export class TranslateDto {
  @ApiProperty({
    description: 'Text to translate',
    example: 'wayuu',
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
    description: 'Preferred dataset to use for translation',
    required: false,
    example: 'main',
  })
  @IsOptional()
  @IsString()
  preferredDataset?: string;

  @IsOptional()
  @IsBoolean()
  includePhoneticAnalysis?: boolean;

  @IsOptional()
  @IsBoolean()
  includeLearningHints?: boolean;
}

export class TranslationResponseDto {
  @ApiProperty({
    description: 'Original text provided for translation',
    example: 'wayuu',
  })
  originalText: string;

  @ApiProperty({
    description: 'Translated text',
    example: 'persona',
  })
  translatedText: string;

  @ApiProperty({
    description: 'Translation direction used',
    enum: TranslationDirection,
  })
  direction: TranslationDirection;

  @ApiProperty({
    description: 'Confidence score of the translation (0-1)',
    example: 0.95,
  })
  confidence: number;

  @ApiProperty({
    description: 'Source dataset used for translation',
    example: 'main',
  })
  sourceDataset: string;

  @ApiProperty({
    description: 'Alternative translations',
    type: [String],
    required: false,
  })
  alternatives?: string[];

  @ApiProperty({
    description: 'Additional context information',
    required: false,
  })
  contextInfo?: string;

  @ApiProperty({
    description: 'Phonetic analysis of the translation',
    required: false,
  })
  phoneticAnalysis?: PhoneticAnalysisResult;

  @ApiProperty({
    description: 'Learning hints for the translation',
    type: [String],
    required: false,
  })
  learningHints?: string[];
}

export class PhoneticAnalysisDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsBoolean()
  includeStressPatterns?: boolean;

  @IsOptional()
  @IsBoolean()
  includeSyllableBreakdown?: boolean;

  @IsOptional()
  @IsBoolean()
  includePhonemeMapping?: boolean;
}

export class LearningExerciseDto {
  @IsString()
  exerciseType: 'pronunciation' | 'listening' | 'pattern-recognition' | 'vocabulary' | 
               'vocabulary-massive' | 'translation-challenge' | 'phonetic-pattern-advanced' | 
               'cultural-context' | 'adaptive-learning' | 'audio-integrated';

  @IsOptional()
  @IsString()
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @IsOptional()
  @IsNumber()
  count?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusWords?: string[];
}

export interface PhoneticAnalysisResult {
  text: string;
  syllables: string[];
  stressPattern: number[];
  phonemes: string[];
  phonemeMapping: Array<{
    wayuu: string;
    ipa: string;
    description: string;
  }>;
  difficulty: 'easy' | 'medium' | 'hard';
  similarSounds: string[];
  practiceRecommendations: string[];
}

export interface LearningExercise {
  id: string;
  type: string;
  difficulty: string;
  title: string;
  description: string;
  content: any;
  expectedAnswer?: any;
  hints?: string[];
  audioId?: string;
  metadata?: {
    datasetSize?: number;
    wordFrequency?: number;
    sourceDataset?: string;
    phoneticComplexity?: string;
    adaptiveLevel?: string;
    multiModal?: boolean;
    sourceTypes?: string[];
    culturalRelevance?: string;
    integrationLevel?: string;
  };
}
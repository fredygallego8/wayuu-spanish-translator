import { IsOptional, IsNumber, IsString, IsBoolean, IsEnum, Min, Max, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DictionaryDomain {
  GENERAL = 'general',
  CULTURAL = 'cultural',
  TERRITORIAL = 'territorial',
  FAMILIAR = 'familiar',
  CEREMONIAL = 'ceremonial',
  NATURAL = 'natural',
  SOCIAL = 'social'
}

export class ExpandDictionaryDto {
  @ApiProperty({
    description: 'Number of entries to generate',
    default: 100,
    minimum: 1,
    maximum: 1000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  targetCount?: number = 100;

  @ApiProperty({
    description: 'Specific domain for vocabulary generation',
    enum: DictionaryDomain,
    default: DictionaryDomain.GENERAL,
    required: false
  })
  @IsOptional()
  @IsEnum(DictionaryDomain)
  domain?: DictionaryDomain = DictionaryDomain.GENERAL;

  @ApiProperty({
    description: 'Use existing dictionary as context for generation',
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  useExistingContext?: boolean = true;

  @ApiProperty({
    description: 'Preview results without integrating to main dictionary',
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;

  @ApiProperty({
    description: 'Batch size for generation',
    default: 25,
    minimum: 1,
    maximum: 100,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  batchSize?: number = 25;

  @ApiProperty({
    description: 'Minimum confidence score for auto-approval',
    default: 0.8,
    minimum: 0.1,
    maximum: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1)
  minConfidence?: number = 0.8;
}

export class ReviewEntryDto {
  @ApiProperty({
    description: 'Unique identifier of the entry to review',
    example: 'gem-001'
  })
  @IsString()
  entryId: string;

  @ApiProperty({
    description: 'Whether the entry is approved for integration',
    example: true
  })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({
    description: 'Reason for rejection (if approved=false)',
    required: false,
    example: 'Translation culturally inappropriate'
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiProperty({
    description: 'Modified translation (if corrections needed)',
    required: false,
    example: 'corrected translation'
  })
  @IsOptional()
  @IsString()
  modifiedTranslation?: string;

  @ApiProperty({
    description: 'Optional review notes',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BatchApproveDto {
  @ApiProperty({
    description: 'Array of entry IDs to approve',
    example: ['gem-001', 'gem-002', 'gem-003'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  entryIds: string[];

  @ApiProperty({
    description: 'Minimum confidence threshold for batch approval',
    default: 0.8,
    minimum: 0.1,
    maximum: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1)
  minConfidence?: number = 0.8;
}

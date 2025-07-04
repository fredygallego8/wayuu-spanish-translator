import { IsString, IsEnum, IsOptional, IsArray, IsNumber, Min, Max, IsNotEmpty, IsDateString, ValidateNested, IsObject, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AnalyticsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  ALL = 'all'
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv'
}

export enum QualityCategory {
  EXCELLENT = 'Excellent (90-100)',
  GOOD = 'Good (80-89)',
  AVERAGE = 'Average (70-79)',
  BELOW_AVERAGE = 'Below Average (60-69)',
  POOR = 'Poor (0-59)'
}

export class RecordTranslationEventDto {
  @ApiProperty({ description: 'Source text of the translation' })
  @IsString()
  @IsNotEmpty()
  sourceText: string;

  @ApiProperty({ description: 'Translated text result' })
  @IsString()
  @IsNotEmpty()
  translatedText: string;

  @ApiProperty({ description: 'Source language' })
  @IsString()
  @IsNotEmpty()
  sourceLang: string;

  @ApiProperty({ description: 'Target language' })
  @IsString()
  @IsNotEmpty()
  targetLang: string;

  @ApiProperty({ description: 'Model used for translation' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  @IsNumber()
  @Min(0)
  processingTime: number;

  @ApiPropertyOptional({ description: 'Translation context' })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiPropertyOptional({ description: 'Translation domain' })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiProperty({ description: 'Whether the translation was served from cache' })
  @IsBoolean()
  cacheHit: boolean;

  @ApiPropertyOptional({ description: 'User agent string' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'IP address of the request' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ 
    description: 'Quality metrics for the translation',
    type: 'object'
  })
  @IsObject()
  @IsOptional()
  quality?: {
    bleuScore?: number;
    lengthRatio: number;
    contextRelevance: number;
    terminologyConsistency: number;
    culturalAdaptation: number;
    overallScore: number;
  };
}

export class RecordErrorDto {
  @ApiProperty({ description: 'Error message or description' })
  @IsString()
  @IsNotEmpty()
  error: string;

  @ApiPropertyOptional({ description: 'Additional context about the error' })
  @IsString()
  @IsOptional()
  context?: string;
}

export class GetUsageStatsDto {
  @ApiPropertyOptional({ 
    description: 'Time period for statistics',
    enum: AnalyticsPeriod,
    default: AnalyticsPeriod.ALL
  })
  @IsEnum(AnalyticsPeriod)
  @IsOptional()
  period?: AnalyticsPeriod = AnalyticsPeriod.ALL;
}

export class GetQualityReportDto {
  @ApiPropertyOptional({ 
    description: 'Time period for quality report',
    enum: AnalyticsPeriod,
    default: AnalyticsPeriod.ALL
  })
  @IsEnum(AnalyticsPeriod)
  @IsOptional()
  period?: AnalyticsPeriod = AnalyticsPeriod.ALL;

  @ApiPropertyOptional({ 
    description: 'Minimum quality threshold',
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  minQuality?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by specific domain'
  })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by specific model'
  })
  @IsString()
  @IsOptional()
  model?: string;
}

export class GetPerformanceReportDto {
  @ApiPropertyOptional({ 
    description: 'Time period for performance report',
    enum: AnalyticsPeriod,
    default: AnalyticsPeriod.ALL
  })
  @IsEnum(AnalyticsPeriod)
  @IsOptional()
  period?: AnalyticsPeriod = AnalyticsPeriod.ALL;

  @ApiPropertyOptional({ 
    description: 'Maximum processing time threshold in milliseconds'
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxProcessingTime?: number;
}

export class GetTopTranslationsDto {
  @ApiPropertyOptional({ 
    description: 'Number of top translations to return',
    minimum: 1,
    maximum: 100,
    default: 10
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Filter by source language'
  })
  @IsString()
  @IsOptional()
  sourceLang?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by target language'
  })
  @IsString()
  @IsOptional()
  targetLang?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by domain'
  })
  @IsString()
  @IsOptional()
  domain?: string;
}

export class ExportAnalyticsDto {
  @ApiPropertyOptional({ 
    description: 'Export format',
    enum: ExportFormat,
    default: ExportFormat.JSON
  })
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat = ExportFormat.JSON;

  @ApiPropertyOptional({ 
    description: 'Time period to include in export',
    enum: AnalyticsPeriod,
    default: AnalyticsPeriod.ALL
  })
  @IsEnum(AnalyticsPeriod)
  @IsOptional()
  period?: AnalyticsPeriod = AnalyticsPeriod.ALL;

  @ApiPropertyOptional({ 
    description: 'Include detailed translation events',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  includeEvents?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Include error logs',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  includeErrors?: boolean = true;
}

// Response DTOs

export class UsageStatsResponseDto {
  @ApiProperty({ description: 'Total number of translations' })
  @IsNumber()
  totalTranslations: number;

  @ApiProperty({ description: 'Translations today' })
  @IsNumber()
  translationsToday: number;

  @ApiProperty({ description: 'Translations this week' })
  @IsNumber()
  translationsThisWeek: number;

  @ApiProperty({ description: 'Translations this month' })
  @IsNumber()
  translationsThisMonth: number;

  @ApiProperty({ description: 'Average confidence score' })
  @IsNumber()
  averageConfidence: number;

  @ApiProperty({ description: 'Average processing time in milliseconds' })
  @IsNumber()
  averageProcessingTime: number;

  @ApiProperty({ description: 'Cache hit rate percentage' })
  @IsNumber()
  cacheHitRate: number;

  @ApiProperty({ 
    description: 'Top source languages used',
    example: { wayuu: 150, spanish: 75 }
  })
  @IsObject()
  topSourceLanguages: Record<string, number>;

  @ApiProperty({ 
    description: 'Top target languages used',
    example: { spanish: 150, wayuu: 75 }
  })
  @IsObject()
  topTargetLanguages: Record<string, number>;

  @ApiProperty({ 
    description: 'Top domains translated',
    example: { cultural: 100, family: 50, ceremonial: 25 }
  })
  @IsObject()
  topDomains: Record<string, number>;

  @ApiProperty({ 
    description: 'Top models used',
    example: { 'nllb-demo': 200, 'nllb-context-aware': 25 }
  })
  @IsObject()
  topModels: Record<string, number>;

  @ApiProperty({ 
    description: 'Quality trends over time',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        date: { type: 'string' },
        avgQuality: { type: 'number' }
      }
    }
  })
  @IsArray()
  qualityTrends: Array<{ date: string; avgQuality: number }>;

  @ApiProperty({ 
    description: 'Performance trends over time',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        date: { type: 'string' },
        avgTime: { type: 'number' }
      }
    }
  })
  @IsArray()
  performanceTrends: Array<{ date: string; avgTime: number }>;
}

export class QualityReportResponseDto {
  @ApiProperty({ description: 'Overall quality score' })
  @IsNumber()
  overallQuality: number;

  @ApiProperty({ 
    description: 'Quality scores by domain',
    example: { cultural: 85.5, family: 90.2, ceremonial: 78.9 }
  })
  @IsObject()
  qualityByDomain: Record<string, number>;

  @ApiProperty({ 
    description: 'Quality scores by model',
    example: { 'nllb-demo': 80.5, 'nllb-context-aware': 92.1 }
  })
  @IsObject()
  qualityByModel: Record<string, number>;

  @ApiProperty({ 
    description: 'Distribution of quality scores',
    example: { 'Excellent (90-100)': 25, 'Good (80-89)': 50, 'Average (70-79)': 20 }
  })
  @IsObject()
  qualityDistribution: Record<string, number>;

  @ApiProperty({ 
    description: 'Suggestions for improvement',
    example: ['Consider implementing context-aware translation', 'Optimize cache strategy']
  })
  @IsArray()
  @IsString({ each: true })
  improvementSuggestions: string[];

  @ApiProperty({ 
    description: 'Low quality translations that need attention',
    type: 'array'
  })
  @IsArray()
  lowQualityTranslations: Array<{
    sourceText: string;
    translatedText: string;
    confidence: number;
    qualityScore?: number;
    model: string;
    timestamp: Date;
  }>;

  @ApiProperty({ 
    description: 'Quality trends over time with volume',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        period: { type: 'string' },
        quality: { type: 'number' },
        volume: { type: 'number' }
      }
    }
  })
  @IsArray()
  qualityTrends: Array<{ period: string; quality: number; volume: number }>;
}

export class PerformanceReportResponseDto {
  @ApiProperty({ description: 'Average response time in milliseconds' })
  @IsNumber()
  averageResponseTime: number;

  @ApiProperty({ description: '95th percentile response time' })
  @IsNumber()
  p95ResponseTime: number;

  @ApiProperty({ description: '99th percentile response time' })
  @IsNumber()
  p99ResponseTime: number;

  @ApiProperty({ 
    description: 'Slowest translations',
    type: 'array'
  })
  @IsArray()
  slowestTranslations: Array<{
    sourceText: string;
    translatedText: string;
    processingTime: number;
    model: string;
    timestamp: Date;
  }>;

  @ApiProperty({ 
    description: 'Performance metrics by model',
    example: { 
      'nllb-demo': { avgTime: 1500, count: 200 },
      'nllb-context-aware': { avgTime: 2100, count: 25 }
    }
  })
  @IsObject()
  performanceByModel: Record<string, { avgTime: number; count: number }>;

  @ApiProperty({ 
    description: 'Performance metrics by domain',
    example: { 
      cultural: { avgTime: 1600, count: 150 },
      ceremonial: { avgTime: 2200, count: 25 }
    }
  })
  @IsObject()
  performanceByDomain: Record<string, { avgTime: number; count: number }>;

  @ApiProperty({ 
    description: 'Cache efficiency metrics'
  })
  @IsObject()
  cacheEfficiency: {
    hitRate: number;
    missRate: number;
    avgHitTime: number;
    avgMissTime: number;
  };
}

export class TopTranslationResponseDto {
  @ApiProperty({ description: 'Source text' })
  @IsString()
  sourceText: string;

  @ApiProperty({ description: 'Translated text' })
  @IsString()
  translatedText: string;

  @ApiProperty({ description: 'Number of times this translation was performed' })
  @IsNumber()
  count: number;

  @ApiProperty({ description: 'Average confidence score' })
  @IsNumber()
  avgConfidence: number;

  @ApiPropertyOptional({ description: 'Average quality score if available' })
  @IsNumber()
  @IsOptional()
  avgQuality?: number;
}

export class ErrorAnalyticsResponseDto {
  @ApiProperty({ description: 'Total number of errors' })
  @IsNumber()
  totalErrors: number;

  @ApiProperty({ 
    description: 'Errors categorized by type',
    example: { Timeout: 10, Network: 5, Validation: 3 }
  })
  @IsObject()
  errorsByType: Record<string, number>;

  @ApiProperty({ 
    description: 'Errors by model',
    example: { 'nllb-demo': 8, 'nllb-context-aware': 2 }
  })
  @IsObject()
  errorsByModel: Record<string, number>;

  @ApiProperty({ 
    description: 'Error trends over time',
    type: 'array'
  })
  @IsArray()
  errorTrends: Array<{ date: string; errorCount: number }>;

  @ApiProperty({ 
    description: 'Recent errors',
    type: 'array'
  })
  @IsArray()
  recentErrors: Array<{ 
    timestamp: Date; 
    error: string; 
    context?: string 
  }>;
}

export class AnalyticsExportResponseDto {
  @ApiProperty({ description: 'Export format used' })
  @IsString()
  format: string;

  @ApiProperty({ description: 'Export data as string' })
  @IsString()
  data: string;

  @ApiProperty({ description: 'Export timestamp' })
  @IsDateString()
  exportDate: string;

  @ApiProperty({ description: 'Number of events included' })
  @IsNumber()
  totalEvents: number;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  fileSize: number;
} 
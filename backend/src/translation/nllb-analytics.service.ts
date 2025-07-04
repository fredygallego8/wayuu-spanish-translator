import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface TranslationEvent {
  id: string;
  timestamp: Date;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  model: string;
  confidence: number;
  processingTime: number;
  context?: string;
  domain?: string;
  cacheHit: boolean;
  userAgent?: string;
  ipAddress?: string;
  quality?: QualityMetrics;
}

export interface QualityMetrics {
  bleuScore?: number;
  lengthRatio: number;
  contextRelevance: number;
  terminologyConsistency: number;
  culturalAdaptation: number;
  overallScore: number;
}

export interface UsageStats {
  totalTranslations: number;
  translationsToday: number;
  translationsThisWeek: number;
  translationsThisMonth: number;
  averageConfidence: number;
  averageProcessingTime: number;
  cacheHitRate: number;
  topSourceLanguages: Record<string, number>;
  topTargetLanguages: Record<string, number>;
  topDomains: Record<string, number>;
  topModels: Record<string, number>;
  qualityTrends: Array<{ date: string; avgQuality: number }>;
  performanceTrends: Array<{ date: string; avgTime: number }>;
}

export interface QualityReport {
  overallQuality: number;
  qualityByDomain: Record<string, number>;
  qualityByModel: Record<string, number>;
  qualityDistribution: Record<string, number>;
  improvementSuggestions: string[];
  lowQualityTranslations: TranslationEvent[];
  qualityTrends: Array<{ period: string; quality: number; volume: number }>;
}

export interface PerformanceReport {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  slowestTranslations: TranslationEvent[];
  performanceByModel: Record<string, { avgTime: number; count: number }>;
  performanceByDomain: Record<string, { avgTime: number; count: number }>;
  cacheEfficiency: {
    hitRate: number;
    missRate: number;
    avgHitTime: number;
    avgMissTime: number;
  };
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByModel: Record<string, number>;
  errorTrends: Array<{ date: string; errorCount: number }>;
  recentErrors: Array<{ timestamp: Date; error: string; context?: string }>;
}

@Injectable()
export class NllbAnalyticsService {
  private readonly logger = new Logger(NllbAnalyticsService.name);
  private events: TranslationEvent[] = [];
  private errors: Array<{ timestamp: Date; error: string; context?: string }> = [];
  private dailyStats: Map<string, { translations: number; quality: number; time: number }> = new Map();

  private readonly maxEvents = 50000; // Keep last 50k events
  private readonly maxErrors = 1000;  // Keep last 1k errors

  constructor() {
    this.logger.log('Initializing NLLB Analytics Service');
    this.initializeDailyStats();
  }

  async recordTranslation(event: Omit<TranslationEvent, 'id' | 'timestamp'>): Promise<void> {
    const translationEvent: TranslationEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event
    };

    // Add to events array
    this.events.push(translationEvent);

    // Trim events if needed
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Update daily stats
    this.updateDailyStats(translationEvent);

    this.logger.debug(`Recorded translation event: ${event.sourceText.substring(0, 30)}...`);
  }

  async recordError(error: string, context?: string): Promise<void> {
    const errorEvent = {
      timestamp: new Date(),
      error,
      context
    };

    this.errors.push(errorEvent);

    // Trim errors if needed
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    this.logger.debug(`Recorded error: ${error}`);
  }

  async getUsageStats(period: 'day' | 'week' | 'month' | 'all' = 'all'): Promise<UsageStats> {
    const filteredEvents = this.filterEventsByPeriod(this.events, period);
    
    if (filteredEvents.length === 0) {
      return this.getEmptyUsageStats();
    }

    const stats: UsageStats = {
      totalTranslations: this.events.length,
      translationsToday: this.getTranslationsInPeriod('day'),
      translationsThisWeek: this.getTranslationsInPeriod('week'),
      translationsThisMonth: this.getTranslationsInPeriod('month'),
      averageConfidence: this.calculateAverageConfidence(filteredEvents),
      averageProcessingTime: this.calculateAverageProcessingTime(filteredEvents),
      cacheHitRate: this.calculateCacheHitRate(filteredEvents),
      topSourceLanguages: this.getTopItems(filteredEvents, 'sourceLang'),
      topTargetLanguages: this.getTopItems(filteredEvents, 'targetLang'),
      topDomains: this.getTopItems(filteredEvents, 'domain'),
      topModels: this.getTopItems(filteredEvents, 'model'),
      qualityTrends: this.getQualityTrends(),
      performanceTrends: this.getPerformanceTrends()
    };

    return stats;
  }

  async getQualityReport(period: 'day' | 'week' | 'month' | 'all' = 'all'): Promise<QualityReport> {
    const filteredEvents = this.filterEventsByPeriod(this.events, period);
    const eventsWithQuality = filteredEvents.filter(e => e.quality);

    const overallQuality = eventsWithQuality.length > 0 
      ? eventsWithQuality.reduce((sum, e) => sum + (e.quality?.overallScore || 0), 0) / eventsWithQuality.length
      : 0;

    const qualityByDomain = this.getQualityByAttribute(eventsWithQuality, 'domain');
    const qualityByModel = this.getQualityByAttribute(eventsWithQuality, 'model');
    const qualityDistribution = this.getQualityDistribution(eventsWithQuality);

    const lowQualityTranslations = filteredEvents
      .filter(e => e.confidence < 0.7 || (e.quality && e.quality.overallScore < 70))
      .sort((a, b) => (a.quality?.overallScore || a.confidence) - (b.quality?.overallScore || b.confidence))
      .slice(0, 10);

    const improvementSuggestions = this.generateImprovementSuggestions(filteredEvents);
    const qualityTrends = this.getQualityTrendsDetailed();

    return {
      overallQuality,
      qualityByDomain,
      qualityByModel,
      qualityDistribution,
      improvementSuggestions,
      lowQualityTranslations,
      qualityTrends
    };
  }

  async getPerformanceReport(): Promise<PerformanceReport> {
    const filteredEvents = this.events;
    
    if (filteredEvents.length === 0) {
      return this.getEmptyPerformanceReport();
    }

    const processingTimes = filteredEvents.map(e => e.processingTime).sort((a, b) => a - b);
    const averageResponseTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    
    const p95Index = Math.floor(processingTimes.length * 0.95);
    const p99Index = Math.floor(processingTimes.length * 0.99);
    
    const p95ResponseTime = processingTimes[p95Index] || 0;
    const p99ResponseTime = processingTimes[p99Index] || 0;

    const slowestTranslations = filteredEvents
      .sort((a, b) => b.processingTime - a.processingTime)
      .slice(0, 10);

    const performanceByModel = this.getPerformanceByAttribute(filteredEvents, 'model');
    const performanceByDomain = this.getPerformanceByAttribute(filteredEvents, 'domain');
    const cacheEfficiency = this.getCacheEfficiency(filteredEvents);

    return {
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      slowestTranslations,
      performanceByModel,
      performanceByDomain,
      cacheEfficiency
    };
  }

  async getErrorAnalytics(period: 'day' | 'week' | 'month' | 'all' = 'all'): Promise<ErrorAnalytics> {
    const filteredErrors = this.filterErrorsByPeriod(this.errors, period);

    const errorsByType = filteredErrors.reduce((acc, error) => {
      const errorType = this.categorizeError(error.error);
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorTrends = this.getErrorTrends();
    const recentErrors = filteredErrors.slice(-10);

    return {
      totalErrors: filteredErrors.length,
      errorsByType,
      errorsByModel: {}, // Would be populated with model-specific errors
      errorTrends,
      recentErrors
    };
  }

  async exportAnalytics(format: 'json' | 'csv' = 'json'): Promise<string> {
    const analytics = {
      usageStats: await this.getUsageStats(),
      qualityReport: await this.getQualityReport(),
      performanceReport: await this.getPerformanceReport(),
      errorAnalytics: await this.getErrorAnalytics(),
      exportDate: new Date().toISOString(),
      totalEvents: this.events.length
    };

    if (format === 'json') {
      return JSON.stringify(analytics, null, 2);
    } else {
      // Convert to CSV format
      return this.convertToCSV(analytics);
    }
  }

  async getTopTranslations(limit: number = 10): Promise<Array<{ 
    sourceText: string; 
    translatedText: string; 
    count: number; 
    avgConfidence: number; 
    avgQuality?: number 
  }>> {
    const translationCounts = new Map<string, {
      translatedText: string;
      count: number;
      totalConfidence: number;
      totalQuality: number;
      qualityCount: number;
    }>();

    this.events.forEach(event => {
      const key = `${event.sourceText}:${event.sourceLang}-${event.targetLang}`;
      const existing = translationCounts.get(key);
      
      if (existing) {
        existing.count++;
        existing.totalConfidence += event.confidence;
        if (event.quality) {
          existing.totalQuality += event.quality.overallScore;
          existing.qualityCount++;
        }
      } else {
        translationCounts.set(key, {
          translatedText: event.translatedText,
          count: 1,
          totalConfidence: event.confidence,
          totalQuality: event.quality?.overallScore || 0,
          qualityCount: event.quality ? 1 : 0
        });
      }
    });

    return Array.from(translationCounts.entries())
      .map(([key, data]) => ({
        sourceText: key.split(':')[0],
        translatedText: data.translatedText,
        count: data.count,
        avgConfidence: data.totalConfidence / data.count,
        avgQuality: data.qualityCount > 0 ? data.totalQuality / data.qualityCount : undefined
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Scheduled analytics aggregation
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async aggregateDailyStats(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = this.events.filter(e => 
      e.timestamp.toISOString().split('T')[0] === today
    );

    if (todayEvents.length > 0) {
      const avgQuality = todayEvents
        .filter(e => e.quality)
        .reduce((sum, e) => sum + (e.quality?.overallScore || 0), 0) / todayEvents.length;
      
      const avgTime = todayEvents.reduce((sum, e) => sum + e.processingTime, 0) / todayEvents.length;

      this.dailyStats.set(today, {
        translations: todayEvents.length,
        quality: avgQuality,
        time: avgTime
      });

      this.logger.log(`Aggregated daily stats for ${today}: ${todayEvents.length} translations`);
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private filterEventsByPeriod(events: TranslationEvent[], period: string): TranslationEvent[] {
    if (period === 'all') return events;

    const now = new Date();
    const cutoff = new Date();

    switch (period) {
      case 'day':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
    }

    return events.filter(e => e.timestamp >= cutoff);
  }

  private filterErrorsByPeriod(errors: Array<{ timestamp: Date; error: string; context?: string }>, period: string) {
    if (period === 'all') return errors;

    const now = new Date();
    const cutoff = new Date();

    switch (period) {
      case 'day':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
    }

    return errors.filter(e => e.timestamp >= cutoff);
  }

  private getTranslationsInPeriod(period: 'day' | 'week' | 'month'): number {
    return this.filterEventsByPeriod(this.events, period).length;
  }

  private calculateAverageConfidence(events: TranslationEvent[]): number {
    if (events.length === 0) return 0;
    return events.reduce((sum, e) => sum + e.confidence, 0) / events.length;
  }

  private calculateAverageProcessingTime(events: TranslationEvent[]): number {
    if (events.length === 0) return 0;
    return events.reduce((sum, e) => sum + e.processingTime, 0) / events.length;
  }

  private calculateCacheHitRate(events: TranslationEvent[]): number {
    if (events.length === 0) return 0;
    const cacheHits = events.filter(e => e.cacheHit).length;
    return (cacheHits / events.length) * 100;
  }

  private getTopItems(events: TranslationEvent[], field: keyof TranslationEvent): Record<string, number> {
    return events.reduce((acc, event) => {
      const value = event[field] as string;
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }

  private getQualityTrends(): Array<{ date: string; avgQuality: number }> {
    const last7Days = Array.from(this.dailyStats.entries())
      .slice(-7)
      .map(([date, stats]) => ({ date, avgQuality: stats.quality }));
    
    return last7Days;
  }

  private getPerformanceTrends(): Array<{ date: string; avgTime: number }> {
    const last7Days = Array.from(this.dailyStats.entries())
      .slice(-7)
      .map(([date, stats]) => ({ date, avgTime: stats.time }));
    
    return last7Days;
  }

  private getQualityByAttribute(events: TranslationEvent[], attribute: keyof TranslationEvent): Record<string, number> {
    const qualityByAttr: Record<string, { total: number; count: number }> = {};
    
    events.forEach(event => {
      const value = event[attribute] as string;
      if (value && event.quality) {
        if (!qualityByAttr[value]) {
          qualityByAttr[value] = { total: 0, count: 0 };
        }
        qualityByAttr[value].total += event.quality.overallScore;
        qualityByAttr[value].count++;
      }
    });

    const result: Record<string, number> = {};
    Object.entries(qualityByAttr).forEach(([key, { total, count }]) => {
      result[key] = total / count;
    });

    return result;
  }

  private getQualityDistribution(events: TranslationEvent[]): Record<string, number> {
    const distribution = {
      'Excellent (90-100)': 0,
      'Good (80-89)': 0,
      'Average (70-79)': 0,
      'Below Average (60-69)': 0,
      'Poor (0-59)': 0
    };

    events.forEach(event => {
      const quality = event.quality?.overallScore || (event.confidence * 100);
      
      if (quality >= 90) distribution['Excellent (90-100)']++;
      else if (quality >= 80) distribution['Good (80-89)']++;
      else if (quality >= 70) distribution['Average (70-79)']++;
      else if (quality >= 60) distribution['Below Average (60-69)']++;
      else distribution['Poor (0-59)']++;
    });

    return distribution;
  }

  private generateImprovementSuggestions(events: TranslationEvent[]): string[] {
    const suggestions: string[] = [];
    
    const avgConfidence = this.calculateAverageConfidence(events);
    if (avgConfidence < 0.8) {
      suggestions.push('Consider implementing context-aware translation to improve confidence scores');
    }

    const avgProcessingTime = this.calculateAverageProcessingTime(events);
    if (avgProcessingTime > 3000) {
      suggestions.push('Optimize processing pipeline - average response time is above 3 seconds');
    }

    const cacheHitRate = this.calculateCacheHitRate(events);
    if (cacheHitRate < 30) {
      suggestions.push('Improve cache strategy - current hit rate is below 30%');
    }

    const lowQualityCount = events.filter(e => e.confidence < 0.7).length;
    if (lowQualityCount > events.length * 0.2) {
      suggestions.push('High number of low-confidence translations - consider model fine-tuning');
    }

    return suggestions;
  }

  private getQualityTrendsDetailed(): Array<{ period: string; quality: number; volume: number }> {
    return Array.from(this.dailyStats.entries()).map(([date, stats]) => ({
      period: date,
      quality: stats.quality,
      volume: stats.translations
    }));
  }

  private getPerformanceByAttribute(events: TranslationEvent[], attribute: keyof TranslationEvent): Record<string, { avgTime: number; count: number }> {
    const perfByAttr: Record<string, { totalTime: number; count: number }> = {};
    
    events.forEach(event => {
      const value = event[attribute] as string;
      if (value) {
        if (!perfByAttr[value]) {
          perfByAttr[value] = { totalTime: 0, count: 0 };
        }
        perfByAttr[value].totalTime += event.processingTime;
        perfByAttr[value].count++;
      }
    });

    const result: Record<string, { avgTime: number; count: number }> = {};
    Object.entries(perfByAttr).forEach(([key, { totalTime, count }]) => {
      result[key] = { avgTime: totalTime / count, count };
    });

    return result;
  }

  private getCacheEfficiency(events: TranslationEvent[]) {
    const cacheHits = events.filter(e => e.cacheHit);
    const cacheMisses = events.filter(e => !e.cacheHit);
    
    const avgHitTime = cacheHits.length > 0 
      ? cacheHits.reduce((sum, e) => sum + e.processingTime, 0) / cacheHits.length 
      : 0;
    
    const avgMissTime = cacheMisses.length > 0
      ? cacheMisses.reduce((sum, e) => sum + e.processingTime, 0) / cacheMisses.length
      : 0;

    return {
      hitRate: this.calculateCacheHitRate(events),
      missRate: 100 - this.calculateCacheHitRate(events),
      avgHitTime,
      avgMissTime
    };
  }

  private categorizeError(error: string): string {
    if (error.includes('timeout')) return 'Timeout';
    if (error.includes('network') || error.includes('connection')) return 'Network';
    if (error.includes('validation') || error.includes('invalid')) return 'Validation';
    if (error.includes('authentication') || error.includes('auth')) return 'Authentication';
    if (error.includes('rate limit')) return 'Rate Limit';
    return 'Other';
  }

  private getErrorTrends(): Array<{ date: string; errorCount: number }> {
    // Implementation would track errors by date
    return [];
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion implementation
    return 'CSV conversion not implemented in demo version';
  }

  private updateDailyStats(event: TranslationEvent): void {
    const date = event.timestamp.toISOString().split('T')[0];
    const existing = this.dailyStats.get(date) || { translations: 0, quality: 0, time: 0 };
    
    existing.translations++;
    existing.time = (existing.time + event.processingTime) / 2; // Simple average
    if (event.quality) {
      existing.quality = (existing.quality + event.quality.overallScore) / 2;
    }
    
    this.dailyStats.set(date, existing);
  }

  private initializeDailyStats(): void {
    // Initialize with some sample data
    const today = new Date().toISOString().split('T')[0];
    this.dailyStats.set(today, { translations: 0, quality: 0, time: 0 });
  }

  private getEmptyUsageStats(): UsageStats {
    return {
      totalTranslations: 0,
      translationsToday: 0,
      translationsThisWeek: 0,
      translationsThisMonth: 0,
      averageConfidence: 0,
      averageProcessingTime: 0,
      cacheHitRate: 0,
      topSourceLanguages: {},
      topTargetLanguages: {},
      topDomains: {},
      topModels: {},
      qualityTrends: [],
      performanceTrends: []
    };
  }

  private getEmptyPerformanceReport(): PerformanceReport {
    return {
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      slowestTranslations: [],
      performanceByModel: {},
      performanceByDomain: {},
      cacheEfficiency: { hitRate: 0, missRate: 0, avgHitTime: 0, avgMissTime: 0 }
    };
  }
} 
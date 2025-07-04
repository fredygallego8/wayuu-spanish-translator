import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface CacheEntry {
  key: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  model: string;
  confidence: number;
  timestamp: Date;
  lastAccessed: Date;
  accessCount: number;
  context?: string;
  domain?: string;
  ttl: number; // Time to live in milliseconds
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  cacheSize: string;
  avgResponseTime: number;
  byDomain: Record<string, number>;
  byModel: Record<string, number>;
  topTranslations: CacheEntry[];
  recentTranslations: CacheEntry[];
}

export interface CacheConfig {
  maxEntries: number;
  defaultTtl: number; // milliseconds
  cleanupInterval: number; // milliseconds
  persistToDisk: boolean;
  enableStats: boolean;
}

@Injectable()
export class NllbCacheService {
  private readonly logger = new Logger(NllbCacheService.name);
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    totalResponseTime: 0,
    requestCount: 0
  };

  private readonly config: CacheConfig = {
    maxEntries: 10000,
    defaultTtl: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 60 * 60 * 1000, // 1 hour
    persistToDisk: true,
    enableStats: true
  };

  constructor() {
    this.logger.log('Initializing NLLB Cache Service');
    this.loadCacheFromDisk();
  }

  async get(sourceText: string, sourceLang: string, targetLang: string, context?: string): Promise<CacheEntry | null> {
    const key = this.generateCacheKey(sourceText, sourceLang, targetLang, context);
    const startTime = Date.now();

    const entry = this.cache.get(key);

    if (entry) {
      // Check if entry is still valid (TTL)
      if (this.isEntryValid(entry)) {
        // Update access statistics
        entry.lastAccessed = new Date();
        entry.accessCount++;
        
        this.stats.hits++;
        this.updateResponseTime(Date.now() - startTime);
        
        this.logger.debug(`Cache HIT for key: ${key.substring(0, 50)}...`);
        return entry;
      } else {
        // Entry expired, remove it
        this.cache.delete(key);
        this.logger.debug(`Cache entry expired and removed: ${key.substring(0, 50)}...`);
      }
    }

    this.stats.misses++;
    this.updateResponseTime(Date.now() - startTime);
    this.logger.debug(`Cache MISS for key: ${key.substring(0, 50)}...`);
    
    return null;
  }

  async set(
    sourceText: string,
    translatedText: string,
    sourceLang: string,
    targetLang: string,
    model: string,
    confidence: number,
    context?: string,
    domain?: string,
    customTtl?: number
  ): Promise<void> {
    const key = this.generateCacheKey(sourceText, sourceLang, targetLang, context);
    const now = new Date();
    
    const entry: CacheEntry = {
      key,
      sourceText,
      translatedText,
      sourceLang,
      targetLang,
      model,
      confidence,
      timestamp: now,
      lastAccessed: now,
      accessCount: 0,
      context,
      domain,
      ttl: customTtl || this.config.defaultTtl
    };

    // Check if we need to evict entries to stay within limits
    if (this.cache.size >= this.config.maxEntries) {
      await this.evictLRU();
    }

    this.cache.set(key, entry);
    this.logger.debug(`Cached translation: ${sourceText.substring(0, 30)}... -> ${translatedText.substring(0, 30)}...`);

    // Persist to disk if enabled
    if (this.config.persistToDisk) {
      await this.persistCacheToDisk();
    }
  }

  async invalidate(sourceText: string, sourceLang: string, targetLang: string, context?: string): Promise<boolean> {
    const key = this.generateCacheKey(sourceText, sourceLang, targetLang, context);
    const existed = this.cache.delete(key);
    
    if (existed) {
      this.logger.debug(`Invalidated cache entry: ${key.substring(0, 50)}...`);
    }
    
    return existed;
  }

  async invalidateByDomain(domain: string): Promise<number> {
    let invalidatedCount = 0;
    
    for (const [key, entry] of this.cache) {
      if (entry.domain === domain) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    this.logger.log(`Invalidated ${invalidatedCount} cache entries for domain: ${domain}`);
    return invalidatedCount;
  }

  async invalidateByModel(model: string): Promise<number> {
    let invalidatedCount = 0;
    
    for (const [key, entry] of this.cache) {
      if (entry.model === model) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    this.logger.log(`Invalidated ${invalidatedCount} cache entries for model: ${model}`);
    return invalidatedCount;
  }

  async clear(): Promise<void> {
    const entriesCount = this.cache.size;
    this.cache.clear();
    this.resetStats();
    
    this.logger.log(`Cleared all cache entries (${entriesCount} total)`);
  }

  async getStats(): Promise<CacheStats> {
    const entries = Array.from(this.cache.values());
    
    const byDomain: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    
    entries.forEach(entry => {
      if (entry.domain) {
        byDomain[entry.domain] = (byDomain[entry.domain] || 0) + 1;
      }
      if (entry.model) {
        byModel[entry.model] = (byModel[entry.model] || 0) + 1;
      }
    });

    const topTranslations = entries
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    const recentTranslations = entries
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    const missRate = totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0;
    const avgResponseTime = this.stats.requestCount > 0 ? this.stats.totalResponseTime / this.stats.requestCount : 0;

    // Calculate cache size in KB
    const cacheSize = this.calculateCacheSize();

    return {
      totalEntries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      cacheSize: `${Math.round(cacheSize / 1024 * 100) / 100} KB`,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      byDomain,
      byModel,
      topTranslations,
      recentTranslations
    };
  }

  async preload(translations: Array<{
    sourceText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    model: string;
    confidence: number;
    context?: string;
    domain?: string;
  }>): Promise<number> {
    let preloadedCount = 0;
    
    for (const translation of translations) {
      try {
        await this.set(
          translation.sourceText,
          translation.translatedText,
          translation.sourceLang,
          translation.targetLang,
          translation.model,
          translation.confidence,
          translation.context,
          translation.domain
        );
        preloadedCount++;
      } catch (error) {
        this.logger.error(`Failed to preload translation: ${error.message}`);
      }
    }
    
    this.logger.log(`Preloaded ${preloadedCount} translations into cache`);
    return preloadedCount;
  }

  private generateCacheKey(sourceText: string, sourceLang: string, targetLang: string, context?: string): string {
    const normalized = sourceText.toLowerCase().trim();
    const contextStr = context ? `|${context}` : '';
    return `${sourceLang}-${targetLang}|${normalized}${contextStr}`;
  }

  private isEntryValid(entry: CacheEntry): boolean {
    const now = Date.now();
    const entryTime = entry.timestamp.getTime();
    return (now - entryTime) < entry.ttl;
  }

  private async evictLRU(): Promise<void> {
    // Find least recently used entry
    let lruEntry: CacheEntry | null = null;
    let lruKey: string | null = null;

    for (const [key, entry] of this.cache) {
      if (!lruEntry || entry.lastAccessed.getTime() < lruEntry.lastAccessed.getTime()) {
        lruEntry = entry;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.logger.debug(`Evicted LRU cache entry: ${lruKey.substring(0, 50)}...`);
    }
  }

  private updateResponseTime(responseTime: number): void {
    this.stats.totalResponseTime += responseTime;
    this.stats.requestCount++;
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalResponseTime: 0,
      requestCount: 0
    };
  }

  private calculateCacheSize(): number {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      // Estimate size of each entry
      totalSize += JSON.stringify(entry).length * 2; // Rough estimate for UTF-16
    }
    
    return totalSize;
  }

  // Scheduled cleanup of expired entries
  @Cron(CronExpression.EVERY_HOUR)
  private async cleanupExpiredEntries(): Promise<void> {
    let expiredCount = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (!this.isEntryValid(entry)) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.logger.log(`Cleaned up ${expiredCount} expired cache entries`);
    }
  }

  // Persist cache to disk (simplified version)
  private async persistCacheToDisk(): Promise<void> {
    try {
      // This would typically save to a file or database
      // For now, we'll just log the action
      this.logger.debug(`Cache persistence triggered (${this.cache.size} entries)`);
    } catch (error) {
      this.logger.error(`Failed to persist cache to disk: ${error.message}`);
    }
  }

  // Load cache from disk on startup
  private async loadCacheFromDisk(): Promise<void> {
    try {
      // This would typically load from a file or database
      // For now, we'll preload some common translations
      await this.preloadCommonTranslations();
    } catch (error) {
      this.logger.error(`Failed to load cache from disk: ${error.message}`);
    }
  }

  private async preloadCommonTranslations(): Promise<void> {
    const commonTranslations = [
      {
        sourceText: 'taya wayuu',
        translatedText: 'yo soy wayuu',
        sourceLang: 'wayuu',
        targetLang: 'spanish',
        model: 'demo-nllb-wayuu-spanish-v1.0',
        confidence: 0.95,
        context: 'cultural',
        domain: 'cultural'
      },
      {
        sourceText: 'kaaꞌula anasü',
        translatedText: 'buenos días hermano',
        sourceLang: 'wayuu',
        targetLang: 'spanish',
        model: 'demo-nllb-wayuu-spanish-v1.0',
        confidence: 0.92,
        context: 'greeting',
        domain: 'cultural'
      },
      {
        sourceText: 'kassain',
        translatedText: 'hasta luego',
        sourceLang: 'wayuu',
        targetLang: 'spanish',
        model: 'demo-nllb-wayuu-spanish-v1.0',
        confidence: 0.89,
        context: 'farewell',
        domain: 'cultural'
      }
    ];

    await this.preload(commonTranslations);
    this.logger.log('Preloaded common translations into cache');
  }

  // Public utility methods for cache management
  async getHitRate(): Promise<number> {
    const totalRequests = this.stats.hits + this.stats.misses;
    return totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
  }

  async getCacheSize(): Promise<{ entries: number; sizeKB: number }> {
    return {
      entries: this.cache.size,
      sizeKB: Math.round(this.calculateCacheSize() / 1024 * 100) / 100
    };
  }

  async warmup(texts: string[], sourceLang: string, targetLang: string): Promise<number> {
    // This would be used to pre-populate cache with likely translations
    // For demo purposes, we'll just return the count
    this.logger.log(`Cache warmup requested for ${texts.length} texts`);
    return texts.length;
  }
} 
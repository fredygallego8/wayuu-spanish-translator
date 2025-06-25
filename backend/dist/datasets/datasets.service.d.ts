import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TranslationDirection } from '../translation/dto/translate.dto';
export interface DictionaryEntry {
    guc: string;
    spa: string;
}
export interface AudioEntry {
    id: string;
    transcription: string;
    audioDuration: number;
    audioUrl?: string;
    audioData?: Buffer;
    fileName?: string;
    localPath?: string;
    isDownloaded?: boolean;
    fileSize?: number;
    downloadPriority?: 'high' | 'medium' | 'low';
    batchNumber?: number;
    source: 'orkidea/wayuu_CO_test';
}
export interface TranslationResult {
    translatedText: string;
    confidence: number;
    sourceDataset: string;
    alternatives?: string[];
    contextInfo?: string;
}
export interface CacheMetadata {
    lastUpdated: string;
    totalEntries: number;
    datasetVersion: string;
    source: string;
    checksum?: string;
}
export interface AudioCacheMetadata {
    lastUpdated: string;
    totalAudioEntries: number;
    totalDurationSeconds: number;
    averageDurationSeconds: number;
    datasetVersion: string;
    source: string;
    checksum?: string;
}
export interface HuggingFaceSource {
    id: string;
    name: string;
    dataset: string;
    config: string;
    split: string;
    type: 'dictionary' | 'audio' | 'mixed';
    description: string;
    url: string;
    isActive: boolean;
    priority: number;
}
export declare class DatasetsService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private wayuuDictionary;
    private wayuuAudioDataset;
    private isLoaded;
    private isAudioLoaded;
    private totalEntries;
    private totalAudioEntries;
    private loadingPromise;
    private audioLoadingPromise;
    private readonly huggingFaceSources;
    private readonly cacheDir;
    private readonly cacheFile;
    private readonly metadataFile;
    private readonly audioCacheFile;
    private readonly audioMetadataFile;
    private readonly cacheMaxAge;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    loadWayuuDictionary(): Promise<void>;
    loadWayuuAudioDataset(): Promise<void>;
    private _performDatasetLoad;
    private _performAudioDatasetLoad;
    private loadViaRowsAPI;
    private loadAudioViaRowsAPI;
    private loadFromCache;
    private saveToCache;
    private checkForUpdatesInBackground;
    private loadAudioFromCache;
    private saveAudioToCache;
    private checkForAudioUpdatesInBackground;
    private loadSampleAudioData;
    private generateAudioChecksum;
    private fileExists;
    private ensureCacheDirectory;
    private generateChecksum;
    private loadViaParquet;
    private loadSampleData;
    reloadDataset(clearCache?: boolean): Promise<{
        success: boolean;
        message: string;
        totalEntries?: number;
    }>;
    clearCache(): Promise<void>;
    getCacheInfo(): Promise<{
        exists: boolean;
        metadata?: CacheMetadata;
        size?: string;
    }>;
    findExactMatch(text: string, direction: TranslationDirection, preferredDataset?: string): Promise<TranslationResult | null>;
    findFuzzyMatch(text: string, direction: TranslationDirection, preferredDataset?: string): Promise<TranslationResult | null>;
    private normalizeText;
    private calculateSimilarity;
    private levenshteinDistance;
    getLoadedDatasets(): Promise<string[]>;
    getDatasetInfo(): Promise<any>;
    getDictionaryStats(): Promise<any>;
    getAudioDatasetInfo(): Promise<any>;
    getAudioStats(): Promise<any>;
    getAudioEntries(page?: number, limit?: number): Promise<any>;
    searchAudioByTranscription(query: string, limit?: number): Promise<any>;
    reloadAudioDataset(clearCache?: boolean): Promise<{
        success: boolean;
        message: string;
        totalAudioEntries?: number;
    }>;
    getAudioCacheInfo(): Promise<{
        exists: boolean;
        metadata?: AudioCacheMetadata;
        size?: string;
    }>;
    clearAudioCache(): Promise<void>;
    getHuggingFaceSources(): HuggingFaceSource[];
    getActiveHuggingFaceSources(): HuggingFaceSource[];
    getDictionarySource(): HuggingFaceSource;
    getAudioSource(): HuggingFaceSource;
    addHuggingFaceSource(source: Omit<HuggingFaceSource, 'priority'>): void;
    updateHuggingFaceSource(id: string, updates: Partial<HuggingFaceSource>): boolean;
    removeHuggingFaceSource(id: string): boolean;
    toggleHuggingFaceSource(id: string): {
        success: boolean;
        isActive?: boolean;
        source?: HuggingFaceSource;
    };
    loadAdditionalDataset(id: string): Promise<{
        success: boolean;
        message: string;
        data?: any;
    }>;
}

import { DatasetsService } from './datasets.service';
import { AudioDurationService } from './audio-duration.service';
import { User } from '../auth/auth.service';
import { TranslationDirection } from '../translation/dto/translate.dto';
export declare class DatasetsController {
    private readonly datasetsService;
    private readonly audioDurationService;
    private readonly logger;
    constructor(datasetsService: DatasetsService, audioDurationService: AudioDurationService);
    getDatasetInfo(): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    getDictionaryStats(): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    reloadDataset(body: {
        clearCache?: boolean;
    }, user: User): Promise<{
        reloadedBy: string;
        timestamp: string;
        success: boolean;
        message: string;
        totalEntries?: number;
    }>;
    getCacheInfo(): Promise<{
        success: boolean;
        data: {
            exists: boolean;
            metadata?: import("./datasets.service").CacheMetadata;
            size?: string;
        };
        message: string;
    }>;
    clearCache(user: User): Promise<{
        success: boolean;
        message: string;
        clearedBy: string;
        timestamp: string;
    }>;
    getAudioInfo(): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    getAudioStats(): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    getAudioEntries(page?: number, limit?: number): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    searchAudio(query: string, limit?: number): Promise<{
        success: boolean;
        error: string;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: any;
        message: string;
        error?: undefined;
    }>;
    reloadAudioDataset(clearCache?: boolean): Promise<{
        success: boolean;
        data: {
            message: string;
            timestamp: string;
            totalAudioEntries: number;
            cacheCleared: boolean;
        };
        error: string;
        message: string;
    }>;
    getAudioCacheInfo(): Promise<{
        success: boolean;
        data: {
            exists: boolean;
            metadata?: import("./datasets.service").AudioCacheMetadata;
            size?: string;
        };
        message: string;
    }>;
    clearAudioCache(): Promise<{
        success: boolean;
        data: {
            message: string;
            timestamp: string;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message: string;
        data?: undefined;
    }>;
    getHuggingFaceSources(): Promise<{
        success: boolean;
        data: {
            sources: import("./datasets.service").HuggingFaceSource[];
            totalSources: number;
            activeSources: number;
        };
        message: string;
    }>;
    getActiveHuggingFaceSources(): Promise<{
        success: boolean;
        data: {
            sources: import("./datasets.service").HuggingFaceSource[];
            totalActiveSources: number;
        };
        message: string;
    }>;
    toggleHuggingFaceSource(id: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            isActive?: boolean;
            source?: import("./datasets.service").HuggingFaceSource;
        };
        message: string;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
    }>;
    loadAdditionalDataset(id: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            message: string;
            data?: any;
        };
        message: string;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
    }>;
    loadFullAdditionalDataset(id: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            message: string;
            data?: any;
        };
        message: string;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
    }>;
    getAudioDownloadStats(): Promise<{
        success: boolean;
        data: {
            totalFiles: number;
            downloadedFiles: number;
            pendingFiles: number;
            totalSizeDownloaded: number;
            downloadProgress: number;
        };
        message: string;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
    }>;
    downloadAudioBatch(body: {
        audioIds: string[];
        batchSize?: number;
    }): Promise<{
        success: boolean;
        data: {
            success: boolean;
            message: string;
            results: Array<{
                id: string;
                success: boolean;
                localPath?: string;
                error?: string;
            }>;
        };
        message: string;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
    }>;
    downloadAllAudio(body?: {
        batchSize?: number;
    }): Promise<{
        success: boolean;
        data: {
            success: boolean;
            message: string;
            stats: any;
        };
        message: string;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
    }>;
    downloadAudioFile(audioId: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            message: string;
            localPath?: string;
        };
        message: string;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
    }>;
    clearDownloadedAudio(): Promise<{
        success: boolean;
        data: {
            success: boolean;
            message: string;
            deletedFiles: number;
        };
        message: string;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
    }>;
    getAudioDurationStats(user: User): Promise<{
        success: boolean;
        cache: import("./audio-duration.service").AudioDurationCache;
        summary: {
            totalAudioFiles: number;
            totalDurationSeconds: number;
            totalDurationMinutes: number;
            averageDurationSeconds: number;
            lastUpdated: string;
        };
        timestamp: string;
    }>;
    recalculateAudioDurations(user: User): Promise<{
        triggeredBy: string;
        timestamp: string;
        calculated: number;
        failed: number;
        totalDuration: number;
    }>;
    updateCurrentDatasetDurations(user: User): Promise<{
        success: boolean;
        updated: number;
        totalDuration: number;
        averageDuration: number;
        message: string;
        updatedBy: string;
        timestamp: string;
    }>;
    searchDictionary(query: string, direction?: TranslationDirection): Promise<{
        success: boolean;
        type: string;
        result: import("./datasets.service").TranslationResult;
        query: string;
    }>;
}

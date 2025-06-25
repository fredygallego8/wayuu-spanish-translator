import { DatasetsService } from './datasets.service';
export declare class DatasetsController {
    private readonly datasetsService;
    constructor(datasetsService: DatasetsService);
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
    reloadDataset(clearCache?: boolean): Promise<{
        success: boolean;
        data: {
            message: string;
            timestamp: string;
            totalEntries: number;
            loadingMethods: any;
            cacheCleared: boolean;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        message: string;
        data?: undefined;
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
    clearCache(): Promise<{
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
}

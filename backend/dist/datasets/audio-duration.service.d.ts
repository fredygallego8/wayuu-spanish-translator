export interface AudioDurationInfo {
    id: string;
    duration: number;
    filePath?: string;
    calculated: boolean;
    error?: string;
}
export interface AudioDurationCache {
    lastUpdated: string;
    durations: Record<string, AudioDurationInfo>;
    totalCalculated: number;
    totalDurationSeconds: number;
    averageDurationSeconds: number;
}
export declare class AudioDurationService {
    private readonly logger;
    private readonly audioDirectory;
    private readonly cacheFile;
    private durationCache;
    onModuleInit(): Promise<void>;
    calculateAudioDuration(filePath: string): Promise<number>;
    calculateMultipleAudioDurations(filePaths: string[]): Promise<AudioDurationInfo[]>;
    updateAudioDurationCache(audioEntries: any[]): Promise<void>;
    loadDurationCache(): Promise<void>;
    saveDurationCache(): Promise<void>;
    getDurationCache(): AudioDurationCache;
    getDurationForAudio(audioId: string): AudioDurationInfo | null;
    recalculateAllDurations(): Promise<{
        calculated: number;
        failed: number;
        totalDuration: number;
    }>;
    enrichAudioEntriesWithDurations(audioEntries: any[]): any[];
}

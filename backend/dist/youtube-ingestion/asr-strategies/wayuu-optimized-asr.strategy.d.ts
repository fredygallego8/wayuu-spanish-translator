import { AsrStrategy } from './asr.strategy';
export interface WayuuOptimizedConfig {
    primaryModel: 'whisper-multilingual' | 'whisper-spanish' | 'whisper-english';
    enablePhoneticCorrection: boolean;
    enableWayuuDictionary: boolean;
    enableMultipleAttempts: boolean;
    confidenceThreshold: number;
    openaiApiKey?: string;
    whisperModel?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
}
export declare class WayuuOptimizedAsrStrategy implements AsrStrategy {
    private readonly logger;
    private readonly config;
    private readonly strategies;
    private readonly wayuuCommonWords;
    private readonly phoneticMappings;
    constructor(config: WayuuOptimizedConfig);
    private initializeStrategies;
    transcribe(audioPath: string): Promise<string>;
    private getWayuuPrompt;
    private postProcessWayuuText;
    private correctWithWayuuDictionary;
    private findBestWayuuMatch;
    private calculateSimilarity;
    private levenshteinDistance;
    private estimateWayuuConfidence;
    private cleanTranscription;
    getConfiguration(): WayuuOptimizedConfig;
    getAvailableStrategies(): string[];
    getWayuuVocabularySize(): number;
    addWayuuWords(words: string[]): void;
}

import { AsrStrategy } from './asr.strategy';
export interface WhisperConfig {
    model: 'tiny' | 'base' | 'small' | 'medium' | 'large';
    language?: string;
    task?: 'transcribe' | 'translate';
    outputFormat?: 'txt' | 'json' | 'srt' | 'vtt';
    enableFallback?: boolean;
    fallbackApiKey?: string;
    fallbackProvider?: 'openai' | 'google' | 'azure';
}
export declare class WhisperAsrStrategy implements AsrStrategy {
    private readonly logger;
    private readonly config;
    private whisperInstalled;
    constructor(config?: Partial<WhisperConfig>);
    transcribe(audioPath: string): Promise<string>;
    private transcribeWithWhisper;
    private transcribeWithCloudApi;
    private transcribeWithOpenAI;
    private transcribeWithGoogle;
    private transcribeWithAzure;
    private checkWhisperInstallation;
    getModelInfo(): {
        model: string;
        size: string;
        ramRequired: string;
    };
    isLocalAvailable(): boolean;
    isFallbackEnabled(): boolean;
}

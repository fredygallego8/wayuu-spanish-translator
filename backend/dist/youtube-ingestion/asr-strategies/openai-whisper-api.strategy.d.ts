import { AsrStrategy } from './asr.strategy';
export interface OpenAIWhisperConfig {
    apiKey: string;
    model?: 'whisper-1';
    language?: string;
    prompt?: string;
    responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
    temperature?: number;
    maxRetries?: number;
    timeout?: number;
}
export declare class OpenAIWhisperApiStrategy implements AsrStrategy {
    private readonly logger;
    private readonly config;
    constructor(config: OpenAIWhisperConfig);
    transcribe(audioPath: string): Promise<string>;
    private makeTranscriptionRequest;
    private sleep;
    getConfig(): Omit<OpenAIWhisperConfig, 'apiKey'>;
    getAccountUsage(): Promise<{
        hasApiKey: boolean;
        model: string;
    }>;
    getSupportedFormats(): string[];
    getMaxFileSize(): string;
    getEstimatedCost(durationMinutes: number): string;
}

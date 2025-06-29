import { AsrStrategy } from './asr-strategies/asr.strategy';
import { TranslationService } from '../translation/translation.service';
export declare class YoutubeIngestionService {
    private readonly asrStrategy;
    private readonly translationService;
    private readonly logger;
    private readonly audioPath;
    private readonly dbPath;
    private db;
    constructor(asrStrategy: AsrStrategy, translationService: TranslationService);
    private loadDb;
    private saveDb;
    private createOrUpdateRecord;
    processVideo(url: string): Promise<void>;
    processPendingTranslations(): Promise<{
        message: string;
        processed: number;
        successful: number;
        failed: number;
        results: Array<{
            videoId: string;
            title: string;
            status: string;
            translation?: string;
            error?: string;
        }>;
    }>;
    getDatabaseStatus(): {
        total: number;
        byStatus: Record<string, number>;
        videos: Array<{
            videoId: string;
            title: string;
            status: string;
            createdAt: string;
            updatedAt: string;
        }>;
    };
    getAsrConfiguration(): Promise<{
        provider: string;
        configuration: any;
        capabilities: {
            maxFileSize: string;
            supportedFormats: string[];
            estimatedCostPerMinute: string;
        };
        status: {
            available: boolean;
            lastCheck: string;
            message: string;
        };
    }>;
}

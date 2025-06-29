import { YoutubeIngestionService } from './youtube-ingestion.service';
import { IngestYoutubeDto } from './dto/ingest-youtube.dto';
export declare class YoutubeIngestionController {
    private readonly youtubeIngestionService;
    private readonly logger;
    constructor(youtubeIngestionService: YoutubeIngestionService);
    ingestVideo(ingestDto: IngestYoutubeDto): Promise<{
        success: boolean;
        message: string;
        data: {
            url: string;
            status: string;
            estimatedTime: string;
            asrProvider: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    processPendingTranslations(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getStatus(): Promise<{
        success: boolean;
        data: {
            asrConfig: {
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
            };
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
    }>;
    getAsrConfiguration(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}

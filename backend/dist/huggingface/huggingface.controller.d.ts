import { HuggingfaceService } from './huggingface.service';
import { User } from '../auth/auth.service';
export declare class HuggingfaceController {
    private readonly huggingfaceService;
    constructor(huggingfaceService: HuggingfaceService);
    getStatus(): {
        status: string;
        service: {
            configured: boolean;
            repoId: string;
            hasToken: boolean;
            sourcesDirectory: string;
            mode: string;
            onDemandLoading: boolean;
        };
        timestamp: string;
    };
    getCachedFiles(): Promise<{
        location: string;
        files: string[];
        count: number;
    }>;
    fetchSources(user: User): Promise<{
        downloadedBy: string;
        timestamp: string;
        message: string;
        files?: undefined;
        location?: undefined;
    } | {
        downloadedBy: string;
        timestamp: string;
        message: string;
        files: number;
        location: string;
    }>;
    fetchOrkideaDataset(user: User): Promise<{
        downloadedBy: string;
        timestamp: string;
        message: string;
        files: number;
        location: string;
    }>;
}

import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class HuggingfaceService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private readonly sourcesDir;
    private readonly repoId;
    private readonly token;
    private isConfigured;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private ensureDirectoryExists;
    fetchAndCacheSources(): Promise<{
        message: string;
        files?: undefined;
        location?: undefined;
    } | {
        message: string;
        files: number;
        location: string;
    }>;
    fetchOrkideaDataset(): Promise<{
        message: string;
        files: number;
        location: string;
    }>;
    getServiceStatus(): {
        configured: boolean;
        repoId: string;
        hasToken: boolean;
        sourcesDirectory: string;
        mode: string;
        onDemandLoading: boolean;
    };
    getCachedFiles(): Promise<{
        files: string[];
        count: number;
    }>;
}

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
    reloadDataset(): Promise<{
        success: boolean;
        data: {
            message: string;
            timestamp: string;
            totalEntries: any;
            loadingMethods: any;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message: string;
        data?: undefined;
    }>;
}

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
}

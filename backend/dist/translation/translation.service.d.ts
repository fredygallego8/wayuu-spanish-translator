import { TranslateDto, TranslationResponseDto } from './dto/translate.dto';
import { DatasetsService } from '../datasets/datasets.service';
export declare class TranslationService {
    private readonly datasetsService;
    private readonly logger;
    constructor(datasetsService: DatasetsService);
    translate(translateDto: TranslateDto): Promise<TranslationResponseDto>;
    private findTranslation;
    private generateFallbackTranslation;
    getHealthStatus(): Promise<{
        status: string;
        datasets: string[];
    }>;
    getAvailableDatasets(): Promise<any>;
}

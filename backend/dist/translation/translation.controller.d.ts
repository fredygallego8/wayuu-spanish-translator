import { TranslationService } from './translation.service';
import { TranslateDto, TranslationResponseDto } from './dto/translate.dto';
export declare class TranslationController {
    private readonly translationService;
    constructor(translationService: TranslationService);
    translate(translateDto: TranslateDto): Promise<TranslationResponseDto>;
    healthCheck(): Promise<{
        status: string;
        datasets: string[];
    }>;
    getAvailableDatasets(): Promise<any>;
}

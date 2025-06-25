import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TranslationDirection } from '../translation/dto/translate.dto';
export interface DictionaryEntry {
    guc: string;
    spa: string;
}
export interface TranslationResult {
    translatedText: string;
    confidence: number;
    sourceDataset: string;
    alternatives?: string[];
    contextInfo?: string;
}
export declare class DatasetsService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private wayuuDictionary;
    private isLoaded;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private loadWayuuDictionary;
    private loadSampleData;
    findExactMatch(text: string, direction: TranslationDirection, preferredDataset?: string): Promise<TranslationResult | null>;
    findFuzzyMatch(text: string, direction: TranslationDirection, preferredDataset?: string): Promise<TranslationResult | null>;
    private normalizeText;
    private calculateSimilarity;
    private levenshteinDistance;
    getLoadedDatasets(): Promise<string[]>;
    getDatasetInfo(): Promise<any>;
    getDictionaryStats(): Promise<any>;
}

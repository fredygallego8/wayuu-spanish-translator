import { TranslateDto, TranslationResponseDto, PhoneticAnalysisDto, PhoneticAnalysisResult, LearningExerciseDto, LearningExercise } from './dto/translate.dto';
import { DatasetsService } from '../datasets/datasets.service';
import { MetricsService } from '../metrics/metrics.service';
export declare class TranslationService {
    private readonly datasetsService;
    private readonly metricsService;
    private readonly logger;
    private readonly wayuuPhonemes;
    private readonly wayuuPhonemeMapping;
    constructor(datasetsService: DatasetsService, metricsService: MetricsService);
    translate(translateDto: TranslateDto): Promise<TranslationResponseDto>;
    analyzePhonetics(phoneticDto: PhoneticAnalysisDto): Promise<PhoneticAnalysisResult>;
    generateLearningExercise(exerciseDto: LearningExerciseDto): Promise<LearningExercise[]>;
    private breakIntoSyllables;
    private analyzeStressPattern;
    private extractPhonemes;
    private mapPhonemes;
    private assessPronunciationDifficulty;
    private findSimilarSounds;
    private generatePracticeRecommendations;
    private generatePronunciationExercises;
    private generateListeningExercises;
    private generatePatternRecognitionExercises;
    private generateVocabularyExercises;
    private generateLearningHints;
    private findTranslation;
    private generateFallbackTranslation;
    getHealthStatus(): Promise<{
        status: string;
        datasets: string[];
    }>;
    getAvailableDatasets(): Promise<any>;
}

import { TranslationService } from './translation.service';
import { TranslateDto, TranslationResponseDto, PhoneticAnalysisDto, PhoneticAnalysisResult, LearningExerciseDto, LearningExercise } from './dto/translate.dto';
export declare class TranslationController {
    private readonly translationService;
    private readonly logger;
    constructor(translationService: TranslationService);
    translate(translateDto: TranslateDto): Promise<TranslationResponseDto>;
    analyzePhonetics(phoneticDto: PhoneticAnalysisDto): Promise<{
        success: boolean;
        data: PhoneticAnalysisResult;
        message: string;
    }>;
    generateExercises(exerciseDto: LearningExerciseDto): Promise<{
        success: boolean;
        data: LearningExercise[];
        message: string;
    }>;
    getPhoneticPatterns(difficulty?: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    getLearningProgress(userId?: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    getHealth(): Promise<{
        status: string;
        datasets: string[];
    }>;
    getDatasets(): Promise<any>;
}

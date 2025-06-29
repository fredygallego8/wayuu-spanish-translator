export declare enum TranslationDirection {
    WAYUU_TO_SPANISH = "wayuu-to-spanish",
    SPANISH_TO_WAYUU = "spanish-to-wayuu"
}
export declare class TranslateDto {
    text: string;
    direction: TranslationDirection;
    preferredDataset?: string;
    includePhoneticAnalysis?: boolean;
    includeLearningHints?: boolean;
}
export declare class TranslationResponseDto {
    originalText: string;
    translatedText: string;
    direction: TranslationDirection;
    confidence: number;
    sourceDataset: string;
    alternatives?: string[];
    contextInfo?: string;
    phoneticAnalysis?: PhoneticAnalysisResult;
    learningHints?: string[];
}
export declare class PhoneticAnalysisDto {
    text: string;
    includeStressPatterns?: boolean;
    includeSyllableBreakdown?: boolean;
    includePhonemeMapping?: boolean;
}
export declare class LearningExerciseDto {
    exerciseType: 'pronunciation' | 'listening' | 'pattern-recognition' | 'vocabulary';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    count?: number;
    focusWords?: string[];
}
export interface PhoneticAnalysisResult {
    text: string;
    syllables: string[];
    stressPattern: number[];
    phonemes: string[];
    phonemeMapping: Array<{
        wayuu: string;
        ipa: string;
        description: string;
    }>;
    difficulty: 'easy' | 'medium' | 'hard';
    similarSounds: string[];
    practiceRecommendations: string[];
}
export interface LearningExercise {
    id: string;
    type: string;
    difficulty: string;
    title: string;
    description: string;
    content: any;
    expectedAnswer?: any;
    hints?: string[];
    audioId?: string;
}

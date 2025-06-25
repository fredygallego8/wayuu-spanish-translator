export declare enum TranslationDirection {
    WAYUU_TO_SPANISH = "wayuu-to-spanish",
    SPANISH_TO_WAYUU = "spanish-to-wayuu"
}
export declare class TranslateDto {
    text: string;
    direction: TranslationDirection;
    preferredDataset?: string;
}
export declare class TranslationResponseDto {
    originalText: string;
    translatedText: string;
    direction: TranslationDirection;
    confidence: number;
    sourceDataset: string;
    alternatives?: string[];
    contextInfo?: string;
}

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { TranslateDto, TranslationResponseDto, TranslationDirection } from './dto/translate.dto';
import { DatasetsService } from '../datasets/datasets.service';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(private readonly datasetsService: DatasetsService) {}

  async translate(translateDto: TranslateDto): Promise<TranslationResponseDto> {
    const { text, direction, preferredDataset } = translateDto;

    this.logger.log(`Translating text: "${text}" - Direction: ${direction}`);

    try {
      // Get translation from datasets
      const translation = await this.findTranslation(text, direction, preferredDataset);

      if (!translation) {
        // If no exact match found, try fuzzy matching or return a default response
        return this.generateFallbackTranslation(text, direction);
      }

      return {
        originalText: text,
        translatedText: translation.translatedText,
        direction,
        confidence: translation.confidence,
        sourceDataset: translation.sourceDataset,
        alternatives: translation.alternatives,
        contextInfo: translation.contextInfo,
      };
    } catch (error) {
      this.logger.error(`Translation error: ${error.message}`);
      throw new BadRequestException('Translation failed');
    }
  }

  private async findTranslation(
    text: string,
    direction: TranslationDirection,
    preferredDataset?: string,
  ): Promise<any> {
    // First try to find exact match
    const exactMatch = await this.datasetsService.findExactMatch(text, direction, preferredDataset);
    if (exactMatch) {
      return exactMatch;
    }

    // Try fuzzy matching
    const fuzzyMatch = await this.datasetsService.findFuzzyMatch(text, direction, preferredDataset);
    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    return null;
  }

  private generateFallbackTranslation(text: string, direction: TranslationDirection): TranslationResponseDto {
    // This is a fallback when no translation is found
    // In a real implementation, you might want to use a ML model here
    return {
      originalText: text,
      translatedText: direction === TranslationDirection.WAYUU_TO_SPANISH 
        ? `[Translation not found for: ${text}]`
        : `[Traducción no encontrada para: ${text}]`,
      direction,
      confidence: 0.1,
      sourceDataset: 'fallback',
      contextInfo: 'Translation not found in available datasets. Consider adding this phrase to improve the translator.',
    };
  }

  async getHealthStatus(): Promise<{ status: string; datasets: string[] }> {
    const datasets = await this.datasetsService.getLoadedDatasets();
    
    return {
      status: 'healthy',
      datasets,
    };
  }

  async getAvailableDatasets(): Promise<any> {
    return this.datasetsService.getDatasetInfo();
  }
}
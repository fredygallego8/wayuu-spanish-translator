import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { TranslationDirection } from '../translation/dto/translate.dto';

export interface DictionaryEntry {
  guc: string; // Wayuu language
  spa: string; // Spanish language
}

export interface TranslationResult {
  translatedText: string;
  confidence: number;
  sourceDataset: string;
  alternatives?: string[];
  contextInfo?: string;
}

@Injectable()
export class DatasetsService implements OnModuleInit {
  private readonly logger = new Logger(DatasetsService.name);
  private wayuuDictionary: DictionaryEntry[] = [];
  private isLoaded = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.loadWayuuDictionary();
  }

  private async loadWayuuDictionary(): Promise<void> {
    try {
      this.logger.log('Loading Wayuu-Spanish dictionary from Hugging Face...');
      
      // Hugging Face API endpoint for the dataset
      const apiUrl = 'https://datasets-server.huggingface.co/rows?dataset=Gaxys/wayuu_spa_dict&config=default&split=train&offset=0&length=5000';
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.data && response.data.rows) {
        this.wayuuDictionary = response.data.rows.map((row) => ({
          guc: row.row.translation_dict.guc?.trim() || '',
          spa: row.row.translation_dict.spa?.trim() || '',
        })).filter(entry => entry.guc && entry.spa); // Filter out empty entries

        this.isLoaded = true;
        this.logger.log(`Successfully loaded ${this.wayuuDictionary.length} dictionary entries`);
      } else {
        throw new Error('Invalid response format from Hugging Face API');
      }
    } catch (error) {
      this.logger.error('Failed to load dictionary:', error.message);
      // Fallback to static sample data for development
      await this.loadSampleData();
    }
  }

  private async loadSampleData(): Promise<void> {
    this.logger.log('Loading sample Wayuu-Spanish dictionary data...');
    
    // Sample data based on the Hugging Face dataset preview
    this.wayuuDictionary = [
      { guc: 'aa', spa: 'sí' },
      { guc: 'aainjaa', spa: 'hacer' },
      { guc: 'aainjaa', spa: 'elaborar fabricar' },
      { guc: 'aainjaa', spa: 'construir' },
      { guc: 'aainjala', spa: 'acción mala pecado' },
      { guc: 'aainjala', spa: 'hecho' },
      { guc: 'aajuna', spa: 'cubierta techo' },
      { guc: 'aakataa', spa: 'quitar' },
      { guc: 'aa\'ayajirawaa', spa: 'discutir' },
      { guc: 'aa\'ayula', spa: 'calor temperatura' },
      { guc: 'aa\'in', spa: 'corazón alma espíritu mente voluntad' },
      { guc: 'aa\'inmajaa', spa: 'cuidar' },
      { guc: 'aa\'inraa', spa: 'hacer' },
      { guc: 'aa\'inyajaa', spa: 'colgar una hamaca amarrar el cinturón' },
      { guc: 'aa\'irü', spa: 'tía (materna)' },
      { guc: 'aa\'u', spa: 'en' },
      { guc: 'aa\'u', spa: 'encima de' },
      { guc: 'aa\'u', spa: 'sobre' },
      { guc: 'aa\'u', spa: 'por (precio)' },
      { guc: 'aa\'u', spa: 'por causa de' },
      { guc: 'aalin, aalii', spa: 'por causa de' },
      { guc: 'aalin, aalii', spa: 'dolor' },
      { guc: 'aaluwain', spa: 'tobillo' },
      { guc: 'aamaka', spa: 'cementerio' },
      { guc: 'aamaka', spa: 'difunto -ta' },
      { guc: 'aamüjaa, aamajaa', spa: 'ayunar' },
      { guc: 'aanala', spa: 'cobija' },
      { guc: 'aanükü', spa: 'boca' },
      { guc: 'aapaa', spa: 'dar' },
      { guc: 'aapaa', spa: 'oír' },
      { guc: 'aapajaa', spa: 'escuchar' },
      { guc: 'aapawaa', spa: 'tomar coger' },
      { guc: 'aapawaa', spa: 'aceptar' },
      { guc: 'aapiee', spa: 'mensajero -ra' },
      { guc: 'aapiraa', spa: 'avisar' },
      { guc: 'aapuwaa', spa: 'estar enfermo -ma' },
      { guc: 'aapuwaa', spa: 'enfermarse' },
      { guc: 'aashajawaa', spa: 'hablar' },
      { guc: 'aashajawaa', spa: 'criticar' },
      { guc: 'aashaje\'eraa', spa: 'leer' },
      { guc: 'aashichijaa', spa: 'enojar provocar' },
      { guc: 'aashichijawaa', spa: 'enojarse' },
      { guc: 'aashin, aajüin', spa: 'según' },
      { guc: 'aataa eejuu', spa: 'oler' },
      { guc: 'aawain', spa: 'peso' },
      { guc: 'aawain', spa: 'influencia' },
      { guc: 'aawalaa', spa: 'aflojar' },
      { guc: 'aawalaa', spa: 'soltar' },
      { guc: 'aawalawaa', spa: 'aliviarse mejorarse de una aflicción' },
      { guc: 'achajawaa', spa: 'buscar' },
      { guc: 'acha\'a', spa: 'excremento' },
      { guc: 'acha\'a', spa: 'óxido' },
      { guc: 'achecheraa', spa: 'apretar' },
      { guc: 'achecheraa', spa: 'tensar' },
      { guc: 'achekaa', spa: 'querer' },
      { guc: 'achekajaa', spa: 'cobrar deuda reclamar' },
      { guc: 'ache\'e', spa: 'oreja oído' },
      { guc: 'achepchia', spa: 'sirviente -ta' },
      { guc: 'achepchia', spa: 'esclavo -va' },
      { guc: 'achepü', spa: 'pintura para la cara' },
      { guc: 'achiawaa', spa: 'amonestar aconsejar' },
      { guc: 'achiirua', spa: 'detrás de' },
      { guc: 'achijiraa', spa: 'despertar' },
      { guc: 'achijirawaa', spa: 'despertarse' },
      { guc: 'achikanain', spa: 'huella' },
      { guc: 'achikanain', spa: 'rastro' },
      { guc: 'achiki, achikü', spa: 'relato noticia' },
      { guc: 'achiki, achikü', spa: 'acerca de' },
      { guc: 'achikijee', spa: 'después de' },
      { guc: 'achikijee', spa: 'más allá de' },
      { guc: 'achikijee', spa: 'después de que' },
      { guc: 'achikiru\'u', spa: 'después de la salida de en ausencia de' },
      { guc: 'achira', spa: 'seno' },
      { guc: 'achira', spa: 'leche' },
      { guc: 'achisa, achise, aise', spa: 'carga' },
      { guc: 'achitaa', spa: 'martillar' },
      { guc: 'achitaa', spa: 'clavar' },
      { guc: 'achon', spa: 'hijo -ja' },
      { guc: 'achon', spa: 'cría' },
      { guc: 'achon', spa: 'fruto fruta' },
      { guc: 'achon\'irü', spa: 'sobrino -na (materno de hembra)' },
    ];

    this.isLoaded = true;
    this.logger.log(`Loaded ${this.wayuuDictionary.length} sample dictionary entries`);
  }

  async findExactMatch(
    text: string,
    direction: TranslationDirection,
    preferredDataset?: string,
  ): Promise<TranslationResult | null> {
    if (!this.isLoaded) {
      await this.loadWayuuDictionary();
    }

    const normalizedText = this.normalizeText(text);
    
    let matches: DictionaryEntry[] = [];

    if (direction === TranslationDirection.WAYUU_TO_SPANISH) {
      matches = this.wayuuDictionary.filter(entry => 
        this.normalizeText(entry.guc) === normalizedText
      );
    } else {
      matches = this.wayuuDictionary.filter(entry => 
        this.normalizeText(entry.spa).includes(normalizedText) ||
        entry.spa.toLowerCase().split(' ').some(word => 
          this.normalizeText(word) === normalizedText
        )
      );
    }

    if (matches.length === 0) {
      return null;
    }

    const primaryMatch = matches[0];
    const alternatives = matches.slice(1).map(match => 
      direction === TranslationDirection.WAYUU_TO_SPANISH ? match.spa : match.guc
    );

    return {
      translatedText: direction === TranslationDirection.WAYUU_TO_SPANISH ? 
        primaryMatch.spa : primaryMatch.guc,
      confidence: 1.0,
      sourceDataset: 'Gaxys/wayuu_spa_dict',
      alternatives: alternatives.length > 0 ? alternatives : undefined,
      contextInfo: alternatives.length > 0 ? 
        `Found ${matches.length} possible translations` : undefined,
    };
  }

  async findFuzzyMatch(
    text: string,
    direction: TranslationDirection,
    preferredDataset?: string,
  ): Promise<TranslationResult | null> {
    if (!this.isLoaded) {
      await this.loadWayuuDictionary();
    }

    const normalizedText = this.normalizeText(text);
    let bestMatches: { entry: DictionaryEntry; similarity: number }[] = [];

    if (direction === TranslationDirection.WAYUU_TO_SPANISH) {
      bestMatches = this.wayuuDictionary
        .map(entry => ({
          entry,
          similarity: this.calculateSimilarity(normalizedText, this.normalizeText(entry.guc))
        }))
        .filter(match => match.similarity > 0.6)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
    } else {
      bestMatches = this.wayuuDictionary
        .map(entry => ({
          entry,
          similarity: Math.max(
            this.calculateSimilarity(normalizedText, this.normalizeText(entry.spa)),
            ...entry.spa.toLowerCase().split(' ').map(word => 
              this.calculateSimilarity(normalizedText, this.normalizeText(word))
            )
          )
        }))
        .filter(match => match.similarity > 0.6)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
    }

    if (bestMatches.length === 0) {
      return null;
    }

    const bestMatch = bestMatches[0];
    const alternatives = bestMatches.slice(1).map(match => 
      direction === TranslationDirection.WAYUU_TO_SPANISH ? match.entry.spa : match.entry.guc
    );

    return {
      translatedText: direction === TranslationDirection.WAYUU_TO_SPANISH ? 
        bestMatch.entry.spa : bestMatch.entry.guc,
      confidence: bestMatch.similarity,
      sourceDataset: 'Gaxys/wayuu_spa_dict',
      alternatives: alternatives.length > 0 ? alternatives : undefined,
      contextInfo: `Fuzzy match with ${Math.round(bestMatch.similarity * 100)}% similarity`,
    };
  }

  private normalizeText(text: string): string {
    return text.toLowerCase()
      .trim()
      .replace(/[.,;:!?]/g, '')
      .replace(/\s+/g, ' ');
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  async getLoadedDatasets(): Promise<string[]> {
    return ['Gaxys/wayuu_spa_dict'];
  }

  async getDatasetInfo(): Promise<any> {
    return {
      datasets: [
        {
          name: 'Gaxys/wayuu_spa_dict',
          description: 'Wayuu-Spanish dictionary with over 2,000 entries',
          entries: this.wayuuDictionary.length,
          loaded: this.isLoaded,
          source: 'https://huggingface.co/datasets/Gaxys/wayuu_spa_dict',
        }
      ],
      totalEntries: this.wayuuDictionary.length,
      status: this.isLoaded ? 'loaded' : 'loading'
    };
  }

  async getDictionaryStats(): Promise<any> {
    if (!this.isLoaded) {
      await this.loadWayuuDictionary();
    }

    const wayuuWords = new Set(this.wayuuDictionary.map(entry => entry.guc)).size;
    const spanishWords = new Set(
      this.wayuuDictionary.flatMap(entry => entry.spa.toLowerCase().split(' '))
    ).size;

    return {
      totalEntries: this.wayuuDictionary.length,
      uniqueWayuuWords: wayuuWords,
      uniqueSpanishWords: spanishWords,
      averageSpanishWordsPerEntry: 
        this.wayuuDictionary.reduce((sum, entry) => sum + entry.spa.split(' ').length, 0) / 
        this.wayuuDictionary.length,
    };
  }
}

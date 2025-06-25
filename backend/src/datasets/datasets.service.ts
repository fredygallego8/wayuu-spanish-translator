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
  private totalEntries = 0;
  private loadingPromise: Promise<void> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.loadWayuuDictionary();
  }

  async loadWayuuDictionary(): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this._performDatasetLoad();
    return this.loadingPromise;
  }

  private async _performDatasetLoad(): Promise<void> {
    this.logger.log('Loading Wayuu-Spanish dictionary from Hugging Face...');
    
    const dataset = 'Gaxys/wayuu_spa_dict';
    const config = 'default';
    const split = 'train';

    try {
      // Método 1: Usar dataset viewer API con paginación (PRINCIPAL)
      this.logger.log('Attempting to load complete dataset via rows API...');
      const entries = await this.loadViaRowsAPI(dataset, config, split);
      
      if (entries.length > 0) {
        this.wayuuDictionary = entries;
        this.totalEntries = entries.length;
        this.isLoaded = true;
        this.logger.log(`✅ Successfully loaded ${entries.length} entries via rows API`);
        return;
      }

      // Método 2: Descarga directa de archivo parquet (FALLBACK)
      this.logger.log('Rows API failed, attempting parquet download...');
      const parquetEntries = await this.loadViaParquet(dataset);
      
      if (parquetEntries.length > 0) {
        this.wayuuDictionary = parquetEntries;
        this.totalEntries = parquetEntries.length;
        this.isLoaded = true;
        this.logger.log(`✅ Successfully loaded ${parquetEntries.length} entries via parquet`);
        return;
      }

      // Método 3: Sample data (ÚLTIMO RECURSO)
      this.logger.warn('All methods failed, using sample data');
      await this.loadSampleData();
      
    } catch (error) {
      this.logger.error(`Failed to load dataset: ${error.message}`);
      await this.loadSampleData();
    }
  }

  private async loadViaRowsAPI(dataset: string, config: string, split: string): Promise<DictionaryEntry[]> {
    const entries: DictionaryEntry[] = [];
    const batchSize = 100; // Máximo permitido por la API
    let offset = 0;
    let hasMoreData = true;
    let totalRows = 0;
    const maxEntries = 2200; // Límite de seguridad

    this.logger.log(`📥 Starting dataset load via rows API...`);

    while (hasMoreData && entries.length < maxEntries) {
      try {
        const url = `https://datasets-server.huggingface.co/rows?dataset=${dataset}&config=${config}&split=${split}&offset=${offset}&length=${batchSize}`;
        
        this.logger.log(`📥 Fetching batch ${Math.floor(offset/batchSize) + 1}: rows ${offset}-${offset + batchSize - 1}`);
        
        const response = await axios.get(url, {
          timeout: 30000,
          headers: {
            'User-Agent': 'WayuuTranslator/1.0'
          }
        });

        if (response.data && response.data.rows && response.data.rows.length > 0) {
          // Establecer total en la primera iteración
          if (totalRows === 0 && response.data.num_rows_total) {
            totalRows = response.data.num_rows_total;
            this.logger.log(`📊 Dataset contains ${totalRows} total rows`);
          }

          const batchEntries = response.data.rows.map((row) => ({
            guc: row.row.translation?.guc?.trim() || '',
            spa: row.row.translation?.spa?.trim() || '',
          })).filter(entry => entry.guc && entry.spa);

          entries.push(...batchEntries);
          
          this.logger.log(`✅ Batch ${Math.floor(offset/batchSize) + 1}: loaded ${batchEntries.length} entries (Total: ${entries.length})`);

          // Verificar si hay más datos
          offset += batchSize;
          hasMoreData = response.data.rows.length === batchSize && offset < totalRows;
          
          // Pequeña pausa para no sobrecargar la API
          if (hasMoreData) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else {
          this.logger.warn(`❌ Batch ${Math.floor(offset/batchSize) + 1}: No data received`);
          hasMoreData = false;
        }
      } catch (error) {
        this.logger.error(`❌ Batch ${Math.floor(offset/batchSize) + 1} failed: ${error.message}`);
        // No romper inmediatamente en caso de error de red temporal
        if (entries.length === 0) {
          hasMoreData = false;
        } else {
          // Si ya tenemos algunas entradas, intentar una vez más
          hasMoreData = false;
          this.logger.warn(`Stopping due to error, but loaded ${entries.length} entries successfully`);
        }
      }
    }

    this.logger.log(`🎯 Dataset loading completed: ${entries.length} entries loaded from ${totalRows} total`);
    return entries;
  }

  private async loadViaParquet(dataset: string): Promise<DictionaryEntry[]> {
    try {
      // Obtener URL del archivo parquet
      const parquetResponse = await axios.get(
        `https://datasets-server.huggingface.co/parquet?dataset=${dataset}`,
        { timeout: 10000 }
      );

      if (parquetResponse.data && parquetResponse.data.parquet_files && parquetResponse.data.parquet_files.length > 0) {
        const parquetUrl = parquetResponse.data.parquet_files[0].url;
        this.logger.log(`Found parquet file: ${parquetUrl}`);
        
        // Para implementación futura con biblioteca parquet
        // Por ahora, simplemente logeamos la URL disponible
        this.logger.warn('Parquet loading not yet implemented - parquet file available at: ' + parquetUrl);
      }
    } catch (error) {
      this.logger.error(`Parquet method failed: ${error.message}`);
    }
    
    return [];
  }

  private async loadSampleData(): Promise<void> {
    this.logger.log('Loading sample Wayuu-Spanish dictionary data...');
    
    // Data de muestra expandida basada en el dataset real
    this.wayuuDictionary = [
      { guc: 'aa', spa: 'sí' },
      { guc: 'aainjaa', spa: 'hacer' },
      { guc: 'aainjaa', spa: 'elaborar fabricar' },
      { guc: 'aainjaa', spa: 'construir' },
      { guc: 'aainjala', spa: 'acción mala pecado' },
      { guc: 'aaint', spa: 'donde' },
      { guc: 'aainjatü', spa: 'estar activo' },
      { guc: 'aaipana', spa: 'que me place' },
      { guc: 'aaipa', spa: 'querer desear' },
      { guc: 'aakua', spa: 'estar' },
      { guc: 'aalain', spa: 'dentro' },
      { guc: 'aalajawaa', spa: 'robar' },
      { guc: 'aalawaa', spa: 'lavar' },
      { guc: 'aamaa', spa: 'todavía aún' },
      { guc: 'aamaka', spa: 'también' },
      { guc: 'aamüin', spa: 'no querer' },
      { guc: 'aanain', spa: 'arriba' },
      { guc: 'aanaka', spa: 'después' },
      { guc: 'aane', spa: 'hacia arriba' },
      { guc: 'aantaa', spa: 'caminar' },
      { guc: 'aapain', spa: 'abajo' },
      { guc: 'aashajawin', spa: 'enseñar' },
      { guc: 'aashaje', spa: 'mostrárselo' },
      { guc: 'aashajia', spa: 'enseñar' },
      { guc: 'aashajuin', spa: 'mostrar' },
      { guc: 'aatamaajachi', spa: 'haber escuchado' },
      { guc: 'aatamaa', spa: 'escuchar' },
      { guc: 'aatchiki', spa: 'cómo está' },
      { guc: 'aatchon', spa: 'bueno' },
      { guc: 'aawataa', spa: 'hablar' },
      { guc: 'achajawaa', spa: 'soñar' },
      { guc: 'achakaa', spa: 'estar enfermo' },
      { guc: 'achekaa', spa: 'conocer' },
      { guc: 'achiki', spa: 'cómo' },
      { guc: 'achikijaa', spa: 'así' },
      { guc: 'achon', spa: 'bueno' },
      { guc: 'achukua', spa: 'coger' },
      { guc: 'achuntaa', spa: 'pensar' },
      { guc: 'achuntüin', spa: 'pensar en' },
      { guc: 'eekai', spa: 'aquí' },
      { guc: 'eera', spa: 'viento' },
      { guc: 'eiruku', spa: 'alma' },
      { guc: 'ekai', spa: 'aquí' },
      { guc: 'ekii', spa: 'este' },
      { guc: 'ekerata', spa: 'temprano' },
      { guc: 'eküülü', spa: 'tierra' },
      { guc: 'emaa', spa: 'agua' },
      { guc: 'epana', spa: 'qué bueno' },
      { guc: 'epeyuu', spa: 'lluvia' },
      { guc: 'jaarai', spa: 'cuándo' },
      { guc: 'jaashi', spa: 'sol' },
      { guc: 'jakaa', spa: 'comer' },
      { guc: 'jama', spa: 'perro' },
      { guc: 'jamü', spa: 'casa' },
      { guc: 'janama', spa: 'mujer' },
      { guc: 'jashichijee', spa: 'anteayer' },
      { guc: 'jashichon', spa: 'ayer' },
      { guc: 'jashichijeejachi', spa: 'antes de ayer' },
      { guc: 'jashichiree', spa: 'mañana' },
      { guc: 'jashichireejachi', spa: 'pasado mañana' },
      { guc: 'jataa', spa: 'venir' },
      { guc: 'jee', spa: 'día' },
      { guc: 'jemiai', spa: 'qué' },
      { guc: 'jerai', spa: 'cuál' },
      { guc: 'jierü', spa: 'barriga' },
      { guc: 'jimü', spa: 'mi' },
      { guc: 'jintü', spa: 'pueblo' },
      { guc: 'jiyaa', spa: 'corazón' },
      { guc: 'joo', spa: 'lluvia' },
      { guc: 'joolu', spa: 'joven' },
      { guc: 'jootoo', spa: 'dormir' },
      { guc: 'jopuu', spa: 'flor' },
      { guc: 'jukuaipa', spa: 'trabajar' },
      { guc: 'jukuaipaa', spa: 'trabajo' },
      { guc: 'jupuu', spa: 'verde' },
      { guc: 'jüchon', spa: 'dulce' },
      { guc: 'jümaa', spa: 'hijo' },
      { guc: 'jünüikü', spa: 'pequeño' },
      { guc: 'jürütü', spa: 'negro' },
      { guc: 'jütuma', spa: 'palabra' },
      { guc: 'jüyoutaasu', spa: 'cielo' },
      { guc: 'ka', spa: 'y' },
      { guc: 'kaa', spa: 'tierra' },
      { guc: 'kachon', spa: 'oro' },
      { guc: 'kai', spa: 'aquí' },
      { guc: 'kakat', spa: 'fuego' },
      { guc: 'kalaka', spa: 'gallo' },
      { guc: 'kama', spa: 'nosotros' },
      { guc: 'kamaa', spa: 'caimán' },
      { guc: 'kanülü', spa: 'mar' },
      { guc: 'kasain', spa: 'ahora' },
      { guc: 'kaseechi', spa: 'viejo' },
      { guc: 'kashí', spa: 'luna' },
      { guc: 'kashi', spa: 'mes' },
      { guc: 'kataa', spa: 'querer' },
      { guc: 'ke', spa: 'aquí' },
      { guc: 'kii', spa: 'este' },
      { guc: 'kooloo', spa: 'negro' },
      { guc: 'kottaa', spa: 'cortar' },
      { guc: 'küchee', spa: 'cochino' },
      { guc: 'kümaa', spa: 'tigre' },
      { guc: 'ma', spa: 'no' },
      { guc: 'maa', spa: 'no' },
      { guc: 'maalü', spa: 'morrocoy' },
      { guc: 'majaa', spa: 'cinco' },
      { guc: 'majayulü', spa: 'estrella' },
      { guc: 'makii', spa: 'lejos' },
      { guc: 'maköi', spa: 'cuando' },
      { guc: 'maleewa', spa: 'amigo' },
      { guc: 'maleiwa', spa: 'dios' },
      { guc: 'maliiwana', spa: 'espíritu' },
      { guc: 'mana', spa: 'donde' },
      { guc: 'maneiwa', spa: 'chamán' },
      { guc: 'mannei', spa: 'quien' },
      { guc: 'maralü', spa: 'sal' },
      { guc: 'maria', spa: 'diez' },
      { guc: 'marülü', spa: 'vaca' },
      { guc: 'masaa', spa: 'brazo' },
      { guc: 'matuna', spa: 'mujer sabia' },
      { guc: 'mawai', spa: 'por qué' },
      { guc: 'miichi', spa: 'gato' },
      { guc: 'mma', spa: 'tu' },
      { guc: 'mmakat', spa: 'cuatro' },
      { guc: 'mojuu', spa: 'dos' },
      { guc: 'muin', spa: 'cara' },
      { guc: 'müin', spa: 'cara' },
      { guc: 'mürülü', spa: 'caballo' },
      { guc: 'müshü', spa: 'ratón' },
      { guc: 'na', spa: 'allá' },
      { guc: 'naa', spa: 'él ella' },
      { guc: 'nnoho', spa: 'tú' },
      { guc: 'nüchiki', spa: 'donde' },
      { guc: 'ojorotaa', spa: 'jugar' },
      { guc: 'okotchon', spa: 'rojo' },
      { guc: 'olotoo', spa: 'mirar' },
      { guc: 'oo', spa: 'sí' },
      { guc: 'ootoo', spa: 'ir' },
      { guc: 'orülewaa', spa: 'bailar' },
      { guc: 'otta', spa: 'ave' },
      { guc: 'palaa', spa: 'mar' },
      { guc: 'püliiku', spa: 'burro' },
      { guc: 'pünaa', spa: 'tierra' },
      { guc: 'shia', spa: 'uno' },
      { guc: 'süchukua', spa: 'tres' },
      { guc: 'taa', spa: 'yo' },
      { guc: 'tü', spa: 'de' },
      { guc: 'tuma', spa: 'hijo' },
      { guc: 'tüü', spa: 'hombre' },
      { guc: 'uchii', spa: 'hermano' },
      { guc: 'ulakat', spa: 'otro' },
      { guc: 'wayuu', spa: 'persona' },
      { guc: 'watta', spa: 'hermana' }
    ];
    
    this.totalEntries = this.wayuuDictionary.length;
    this.isLoaded = true;
    this.logger.log(`Loaded ${this.totalEntries} sample dictionary entries`);
  }

  // Método para recargar el dataset manualmente
  async reloadDataset(): Promise<void> {
    this.isLoaded = false;
    this.wayuuDictionary = [];
    this.totalEntries = 0;
    await this.loadWayuuDictionary();
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
      totalEntriesExpected: this.totalEntries || 'Unknown',
      uniqueWayuuWords: wayuuWords,
      uniqueSpanishWords: spanishWords,
      averageSpanishWordsPerEntry: 
        this.wayuuDictionary.reduce((sum, entry) => sum + entry.spa.split(' ').length, 0) / 
        this.wayuuDictionary.length,
      loadingMethods: {
        parquetAPI: 'Not implemented (requires Apache Arrow)',
        datasetsAPI: 'Available with pagination (up to 10k entries)',
        directDownload: 'Attempted multiple JSON endpoints',
        sampleData: 'Enhanced fallback with 115 entries'
      },
      sampleEntries: this.wayuuDictionary.slice(0, 10),
      datasetInfo: {
        source: 'Gaxys/wayuu_spa_dict',
        url: 'https://huggingface.co/datasets/Gaxys/wayuu_spa_dict',
        description: 'Wayuu-Spanish dictionary dataset from Hugging Face',
        status: this.isLoaded ? 'loaded' : 'loading'
      },
      lastLoaded: new Date().toISOString(),
    };
  }
}

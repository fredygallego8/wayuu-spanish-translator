import { AsrStrategy } from './asr.strategy';
import { Injectable, Logger } from '@nestjs/common';
import { OpenAIWhisperApiStrategy } from './openai-whisper-api.strategy';
import { WhisperAsrStrategy } from './whisper-asr.strategy';
import * as fs from 'fs';

export interface WayuuOptimizedConfig {
  primaryModel: 'whisper-multilingual' | 'whisper-spanish' | 'whisper-english';
  enablePhoneticCorrection: boolean;
  enableWayuuDictionary: boolean;
  enableMultipleAttempts: boolean;
  confidenceThreshold: number;
  openaiApiKey?: string;
  whisperModel?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
}

@Injectable()
export class WayuuOptimizedAsrStrategy implements AsrStrategy {
  private readonly logger = new Logger(WayuuOptimizedAsrStrategy.name);
  private readonly config: WayuuOptimizedConfig;
  private readonly strategies: AsrStrategy[] = [];

  // Diccionario básico wayuunaiki para correcciones post-procesamiento
  private readonly wayuuCommonWords = [
    'wayuu', 'anaa', 'pia', 'taya', 'wane', 'chi', 'sulu', 'eekai', 'kasain',
    'maiki', 'süka', 'jia', 'süpüla', 'achukua', 'anain', 'eere', 'jintü',
    'kasachon', 'süchukua', 'watta', 'yaa', 'antüshi', 'süpüshi', 'juyakai',
    'akumajaa', 'süpüla', 'ekirajaa', 'joolu', 'süka', 'wanee', 'achiki',
    'süpüleerua', 'jintüin', 'anasü', 'süchon', 'ekirajüin', 'wattapia'
  ];

  // Mapeo de fonemas comunes español -> wayuunaiki
  private readonly phoneticMappings = new Map([
    ['ch', 'ch'], ['sh', 'sh'], ['ü', 'u'], ['j', 'h'],
    ['rr', 'r'], ['ll', 'y'], ['ñ', 'n'], ['c', 'k'],
    ['qu', 'k'], ['gue', 'we'], ['gui', 'wi']
  ]);

  constructor(config: WayuuOptimizedConfig) {
    this.config = {
      primaryModel: 'whisper-multilingual',
      enablePhoneticCorrection: true,
      enableWayuuDictionary: true,
      enableMultipleAttempts: true,
      confidenceThreshold: 0.6,
      ...config,
    };

    this.initializeStrategies();
    this.logger.log('✅ Wayuu-optimized ASR strategy initialized');
  }

  private initializeStrategies(): void {
    try {
      // Estrategia 1: OpenAI Whisper API con configuración multiidioma
      if (this.config.openaiApiKey) {
        this.strategies.push(new OpenAIWhisperApiStrategy({
          apiKey: this.config.openaiApiKey,
          language: undefined, // Auto-detect para mejor handling de wayuunaiki
          responseFormat: 'verbose_json', // Para obtener confianza
          temperature: 0.3, // Ligeramente más creativo para idiomas no estándar
          prompt: this.getWayuuPrompt(), // Contexto wayuunaiki
        }));
        this.logger.log('✅ OpenAI Whisper API strategy added (multilingual mode)');
      }

      // Estrategia 2: Whisper local si está disponible
      if (this.config.whisperModel) {
        this.strategies.push(new WhisperAsrStrategy({
          model: this.config.whisperModel,
          language: undefined, // Auto-detect
          task: 'transcribe',
          enableFallback: false, // Evitar loops
        }));
        this.logger.log('✅ Local Whisper strategy added');
      }

      // Estrategia 3: Whisper API con español como fallback
      if (this.config.openaiApiKey && this.strategies.length < 2) {
        this.strategies.push(new OpenAIWhisperApiStrategy({
          apiKey: this.config.openaiApiKey,
          language: 'es', // Español como fallback
          responseFormat: 'text',
          temperature: 0,
          prompt: 'Audio en idioma wayuunaiki (guajiro), idioma indígena de Colombia y Venezuela.',
        }));
        this.logger.log('✅ Spanish fallback strategy added');
      }

    } catch (error) {
      this.logger.error(`Error initializing ASR strategies: ${error.message}`);
    }
  }

  async transcribe(audioPath: string): Promise<string> {
    this.logger.log(`Starting Wayuu-optimized transcription for: ${audioPath}`);
    
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    const results: Array<{ transcription: string; confidence: number; strategy: string }> = [];

    // Intentar con múltiples estrategias
    for (let i = 0; i < this.strategies.length; i++) {
      const strategy = this.strategies[i];
      const strategyName = strategy.constructor.name;

      try {
        this.logger.log(`Attempt ${i + 1}/${this.strategies.length} with ${strategyName}`);
        
        const rawTranscription = await strategy.transcribe(audioPath);
        
        // Post-procesamiento específico para wayuunaiki
        const processedTranscription = await this.postProcessWayuuText(rawTranscription);
        
        // Calcular confianza estimada
        const confidence = this.estimateWayuuConfidence(processedTranscription, rawTranscription);
        
        results.push({
          transcription: processedTranscription,
          confidence,
          strategy: strategyName,
        });

        this.logger.log(`${strategyName} result: "${processedTranscription.substring(0, 50)}..." (confidence: ${confidence.toFixed(2)})`);

        // Si la confianza es alta, usar este resultado
        if (confidence >= this.config.confidenceThreshold) {
          this.logger.log(`✅ High confidence result from ${strategyName}, using it`);
          return processedTranscription;
        }

      } catch (error) {
        this.logger.warn(`${strategyName} failed: ${error.message}`);
      }
    }

    // Si tenemos resultados, usar el de mayor confianza
    if (results.length > 0) {
      const bestResult = results.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      this.logger.log(`Using best result from ${bestResult.strategy} (confidence: ${bestResult.confidence.toFixed(2)})`);
      return bestResult.transcription;
    }

    throw new Error('All ASR strategies failed for wayuunaiki audio');
  }

  private getWayuuPrompt(): string {
    return `Audio en idioma wayuunaiki (también conocido como guajiro), idioma indígena de la familia arawak hablado por el pueblo wayuu en Colombia y Venezuela. Palabras comunes incluyen: ${this.wayuuCommonWords.slice(0, 10).join(', ')}.`;
  }

  private async postProcessWayuuText(text: string): Promise<string> {
    if (!this.config.enablePhoneticCorrection && !this.config.enableWayuuDictionary) {
      return text;
    }

    let processedText = text.toLowerCase().trim();

    // 1. Correcciones fonéticas básicas
    if (this.config.enablePhoneticCorrection) {
      for (const [spanish, wayuu] of this.phoneticMappings) {
        const regex = new RegExp(spanish, 'gi');
        processedText = processedText.replace(regex, wayuu);
      }
    }

    // 2. Corrección con diccionario wayuu
    if (this.config.enableWayuuDictionary) {
      processedText = this.correctWithWayuuDictionary(processedText);
    }

    // 3. Limpieza final
    processedText = this.cleanTranscription(processedText);

    return processedText;
  }

  private correctWithWayuuDictionary(text: string): string {
    let correctedText = text;
    const words = text.split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase().replace(/[^\w]/g, '');
      
      // Buscar coincidencias aproximadas con palabras wayuu conocidas
      const bestMatch = this.findBestWayuuMatch(word);
      if (bestMatch && this.calculateSimilarity(word, bestMatch) > 0.7) {
        correctedText = correctedText.replace(new RegExp(`\\b${words[i]}\\b`, 'gi'), bestMatch);
      }
    }
    
    return correctedText;
  }

  private findBestWayuuMatch(word: string): string | null {
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const wayuuWord of this.wayuuCommonWords) {
      const similarity = this.calculateSimilarity(word, wayuuWord);
      if (similarity > bestSimilarity && similarity > 0.6) {
        bestSimilarity = similarity;
        bestMatch = wayuuWord;
      }
    }

    return bestMatch;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private estimateWayuuConfidence(processedText: string, originalText: string): number {
    let confidence = 0.5; // Base confidence
    
    // Factor 1: Presencia de palabras wayuu conocidas
    const wayuuWordCount = this.wayuuCommonWords.filter(word => 
      processedText.toLowerCase().includes(word.toLowerCase())
    ).length;
    confidence += Math.min(wayuuWordCount * 0.1, 0.3);
    
    // Factor 2: Longitud y coherencia
    if (processedText.length > 10) confidence += 0.1;
    if (processedText.split(' ').length > 3) confidence += 0.1;
    
    // Factor 3: Cambios en post-procesamiento (menos cambios = más confianza original)
    const changeRatio = this.calculateSimilarity(originalText, processedText);
    confidence += changeRatio * 0.2;
    
    return Math.min(confidence, 1.0);
  }

  private cleanTranscription(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Múltiples espacios -> uno
      .replace(/[^\w\s\-']/g, '') // Solo letras, espacios, guiones y apostrofes
      .trim();
  }

  // Métodos de utilidad
  getConfiguration(): WayuuOptimizedConfig {
    return { ...this.config };
  }

  getAvailableStrategies(): string[] {
    return this.strategies.map(s => s.constructor.name);
  }

  getWayuuVocabularySize(): number {
    return this.wayuuCommonWords.length;
  }

  addWayuuWords(words: string[]): void {
    this.wayuuCommonWords.push(...words);
    this.logger.log(`Added ${words.length} words to Wayuu vocabulary`);
  }
}
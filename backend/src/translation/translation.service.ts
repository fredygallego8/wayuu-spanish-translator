import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { 
  TranslateDto, 
  TranslationResponseDto, 
  TranslationDirection, 
  PhoneticAnalysisDto,
  PhoneticAnalysisResult,
  LearningExerciseDto,
  LearningExercise
} from './dto/translate.dto';
import { DatasetsService } from '../datasets/datasets.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  // Wayuu phonetic patterns and rules
  private readonly wayuuPhonemes = {
    vowels: ['a', 'e', 'i', 'o', 'u', 'ü'],
    consonants: ['ch', 'j', 'k', 'l', 'm', 'n', 'ñ', 'p', 'r', 's', 'sh', 't', 'w', 'y'],
    specialChars: ['ꞌ', '̈'],
    stressMarkers: ['́', '̀']
  };

  private readonly wayuuPhonemeMapping = [
    { wayuu: 'ch', ipa: 'tʃ', description: 'Consonante africada sorda' },
    { wayuu: 'j', ipa: 'x', description: 'Consonante fricativa velar sorda' },
    { wayuu: 'k', ipa: 'k', description: 'Consonante oclusiva velar sorda' },
    { wayuu: 'ñ', ipa: 'ɲ', description: 'Consonante nasal palatal' },
    { wayuu: 'sh', ipa: 'ʃ', description: 'Consonante fricativa postalveolar sorda' },
    { wayuu: 'ü', ipa: 'ɨ', description: 'Vocal central alta' },
    { wayuu: 'ꞌ', ipa: 'ʔ', description: 'Oclusión glotal' }
  ];

  constructor(
    private readonly datasetsService: DatasetsService,
    private readonly metricsService: MetricsService
  ) {}

  async translate(translateDto: TranslateDto): Promise<TranslationResponseDto> {
    const { text, direction, preferredDataset, includePhoneticAnalysis, includeLearningHints } = translateDto;
    const startTime = Date.now();

    this.logger.log(`Translating text: "${text}" - Direction: ${direction}`);

    // Determine source and target languages
    const sourceLang = direction === TranslationDirection.WAYUU_TO_SPANISH ? 'wayuu' : 'spanish';
    const targetLang = direction === TranslationDirection.WAYUU_TO_SPANISH ? 'spanish' : 'wayuu';

    try {
      // Get translation from datasets
      const translation = await this.findTranslation(text, direction, preferredDataset);

      if (!translation) {
        // Record metrics for failed translation
        const duration = (Date.now() - startTime) / 1000;
        this.metricsService.incrementTranslation(direction, sourceLang, targetLang, 'fallback');
        this.metricsService.recordTranslationDuration(direction, sourceLang, targetLang, duration);
        
        // If no exact match found, try fuzzy matching or return a default response
        return this.generateFallbackTranslation(text, direction);
      }

      const response: TranslationResponseDto = {
        originalText: text,
        translatedText: translation.translatedText,
        direction,
        confidence: translation.confidence,
        sourceDataset: translation.sourceDataset,
        alternatives: translation.alternatives,
        contextInfo: translation.contextInfo,
      };

      // Add phonetic analysis if requested
      if (includePhoneticAnalysis && direction === TranslationDirection.SPANISH_TO_WAYUU) {
        response.phoneticAnalysis = await this.analyzePhonetics({ text: translation.translatedText });
      }

      // Add learning hints if requested
      if (includeLearningHints) {
        response.learningHints = this.generateLearningHints(text, translation.translatedText, direction);
      }

      // Record successful translation metrics
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.incrementTranslation(direction, sourceLang, targetLang, 'success');
      this.metricsService.recordTranslationDuration(direction, sourceLang, targetLang, duration);

      return response;
    } catch (error) {
      // Record error metrics
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.incrementTranslationError(error.message || 'unknown_error', direction);
      this.metricsService.recordTranslationDuration(direction, sourceLang, targetLang, duration);
      
      this.logger.error(`Translation error: ${error.message}`);
      throw new BadRequestException('Translation failed');
    }
  }

  async analyzePhonetics(phoneticDto: PhoneticAnalysisDto): Promise<PhoneticAnalysisResult> {
    const { text } = phoneticDto;
    
    this.logger.log(`Analyzing phonetics for: "${text}"`);

    // Syllable breakdown
    const syllables = this.breakIntoSyllables(text);
    
    // Stress pattern analysis
    const stressPattern = this.analyzeStressPattern(syllables);
    
    // Phoneme extraction
    const phonemes = this.extractPhonemes(text);
    
    // Phoneme mapping
    const phonemeMapping = this.mapPhonemes(phonemes);
    
    // Difficulty assessment
    const difficulty = this.assessPronunciationDifficulty(phonemes);
    
    // Find similar sounds for practice
    const similarSounds = await this.findSimilarSounds(text);
    
    // Generate practice recommendations
    const practiceRecommendations = this.generatePracticeRecommendations(phonemes, difficulty);

    return {
      text,
      syllables,
      stressPattern,
      phonemes,
      phonemeMapping,
      difficulty,
      similarSounds,
      practiceRecommendations
    };
  }

  async generateLearningExercise(exerciseDto: LearningExerciseDto): Promise<LearningExercise[]> {
    const { exerciseType, difficulty = 'beginner', count = 5, focusWords } = exerciseDto;
    
    this.logger.log(`Generating ${count} ${exerciseType} exercises at ${difficulty} level`);

    const exercises: LearningExercise[] = [];

    switch (exerciseType) {
      case 'pronunciation':
        return this.generatePronunciationExercises(difficulty, count, focusWords);
      
      case 'listening':
        return this.generateListeningExercises(difficulty, count);
      
      case 'pattern-recognition':
        return this.generatePatternRecognitionExercises(difficulty, count);
      
      case 'vocabulary':
        return this.generateVocabularyExercises(difficulty, count, focusWords);
      
      default:
        throw new BadRequestException(`Unknown exercise type: ${exerciseType}`);
    }
  }

  private breakIntoSyllables(text: string): string[] {
    // Simple syllable breaking for Wayuu
    // This is a basic implementation - could be enhanced with more sophisticated rules
    const words = text.toLowerCase().split(' ');
    const allSyllables: string[] = [];

    for (const word of words) {
      const syllables = word.split(/([aeiouü])/g).filter(s => s.length > 0);
      let currentSyllable = '';
      
      for (let i = 0; i < syllables.length; i++) {
        currentSyllable += syllables[i];
        
        // If current part contains a vowel and next part starts with consonant
        if (/[aeiouü]/.test(currentSyllable) && 
            i + 1 < syllables.length && 
            /^[^aeiouü]/.test(syllables[i + 1])) {
          allSyllables.push(currentSyllable);
          currentSyllable = '';
        }
      }
      
      if (currentSyllable) {
        allSyllables.push(currentSyllable);
      }
    }

    return allSyllables;
  }

  private analyzeStressPattern(syllables: string[]): number[] {
    // Analyze stress patterns in Wayuu words
    // Returns array where 1 = stressed, 0 = unstressed
    const pattern: number[] = [];
    
    for (let i = 0; i < syllables.length; i++) {
      const syllable = syllables[i];
      
      // Check for stress markers
      if (syllable.includes('́') || syllable.includes('̀')) {
        pattern.push(1);
      } else if (i === syllables.length - 2 && syllables.length > 1) {
        // Wayuu typically stresses penultimate syllable
        pattern.push(1);
      } else {
        pattern.push(0);
      }
    }

    return pattern;
  }

  private extractPhonemes(text: string): string[] {
    const phonemes: string[] = [];
    const normalizedText = text.toLowerCase();
    let i = 0;

    while (i < normalizedText.length) {
      // Check for digraphs first
      if (i < normalizedText.length - 1) {
        const digraph = normalizedText.substring(i, i + 2);
        if (['ch', 'sh'].includes(digraph)) {
          phonemes.push(digraph);
          i += 2;
          continue;
        }
      }

      // Single characters
      const char = normalizedText[i];
      if (this.wayuuPhonemes.vowels.includes(char) || 
          this.wayuuPhonemes.consonants.includes(char) ||
          this.wayuuPhonemes.specialChars.includes(char)) {
        phonemes.push(char);
      }
      
      i++;
    }

    return phonemes;
  }

  private mapPhonemes(phonemes: string[]): Array<{wayuu: string; ipa: string; description: string}> {
    return phonemes
      .filter((phoneme, index, array) => array.indexOf(phoneme) === index) // Remove duplicates
      .map(phoneme => {
        const mapping = this.wayuuPhonemeMapping.find(m => m.wayuu === phoneme);
        return mapping || {
          wayuu: phoneme,
          ipa: phoneme,
          description: 'Sonido estándar'
        };
      });
  }

  private assessPronunciationDifficulty(phonemes: string[]): 'easy' | 'medium' | 'hard' {
    const difficultPhonemes = ['ꞌ', 'ü', 'ch', 'sh', 'j'];
    const difficultCount = phonemes.filter(p => difficultPhonemes.includes(p)).length;
    
    if (difficultCount === 0) return 'easy';
    if (difficultCount <= 2) return 'medium';
    return 'hard';
  }

  private async findSimilarSounds(text: string): Promise<string[]> {
    // Find audio entries with similar phonetic patterns
    const audioData = await this.datasetsService.getAudioEntries();
    const audioEntries = audioData.entries || [];
    const textPhonemes = this.extractPhonemes(text);
    
    const similarEntries = audioEntries
      .filter(entry => {
        const entryPhonemes = this.extractPhonemes(entry.transcription);
        const commonPhonemes = textPhonemes.filter(p => entryPhonemes.includes(p));
        return commonPhonemes.length >= Math.min(3, textPhonemes.length * 0.6);
      })
      .slice(0, 5)
      .map(entry => entry.transcription);

    return similarEntries;
  }

  private generatePracticeRecommendations(phonemes: string[], difficulty: string): string[] {
    const recommendations: string[] = [];
    
    if (phonemes.includes('ꞌ')) {
      recommendations.push('Practica la oclusión glotal (ꞌ) haciendo una pausa breve en la garganta');
    }
    
    if (phonemes.includes('ü')) {
      recommendations.push('La vocal ü se pronuncia como una "i" más relajada, en posición central');
    }
    
    if (phonemes.includes('ch') || phonemes.includes('sh')) {
      recommendations.push('Practica las consonantes africadas y fricativas con ejercicios de repetición');
    }

    if (difficulty === 'hard') {
      recommendations.push('Esta palabra contiene sonidos complejos. Practica lentamente y repite varias veces');
    }

    return recommendations;
  }

  private async generatePronunciationExercises(difficulty: string, count: number, focusWords?: string[]): Promise<LearningExercise[]> {
    const exercises: LearningExercise[] = [];
    const audioData = await this.datasetsService.getAudioEntries();
    const audioEntries = audioData.entries || [];
    
    // Filter by difficulty
    let filteredEntries = audioEntries.filter(entry => {
      const phonemes = this.extractPhonemes(entry.transcription);
      const entryDifficulty = this.assessPronunciationDifficulty(phonemes);
      
      switch (difficulty) {
        case 'beginner': return entryDifficulty === 'easy';
        case 'intermediate': return entryDifficulty === 'medium';
        case 'advanced': return entryDifficulty === 'hard';
        default: return true;
      }
    });

    // Filter by focus words if provided
    if (focusWords && focusWords.length > 0) {
      filteredEntries = filteredEntries.filter(entry =>
        focusWords.some(word => entry.transcription.toLowerCase().includes(word.toLowerCase()))
      );
    }

    // Generate exercises
    for (let i = 0; i < Math.min(count, filteredEntries.length); i++) {
      const entry = filteredEntries[i];
      const phoneticAnalysis = await this.analyzePhonetics({ text: entry.transcription });
      
      exercises.push({
        id: `pronunciation_${i + 1}`,
        type: 'pronunciation',
        difficulty,
        title: `Pronunciación: ${entry.transcription}`,
        description: 'Escucha el audio y practica la pronunciación de esta frase en Wayuu',
        content: {
          text: entry.transcription,
          phoneticAnalysis,
          audioId: entry.id
        },
        hints: phoneticAnalysis.practiceRecommendations,
        audioId: entry.id
      });
    }

    return exercises;
  }

  private async generateListeningExercises(difficulty: string, count: number): Promise<LearningExercise[]> {
    const exercises: LearningExercise[] = [];
    const audioData = await this.datasetsService.getAudioEntries();
    const audioEntries = audioData.entries || [];
    
    for (let i = 0; i < Math.min(count, audioEntries.length); i++) {
      const entry = audioEntries[i];
      
      exercises.push({
        id: `listening_${i + 1}`,
        type: 'listening',
        difficulty,
        title: 'Ejercicio de Comprensión Auditiva',
        description: 'Escucha el audio y escribe lo que oyes en Wayuu',
        content: {
          audioId: entry.id,
          instruction: 'Escucha cuidadosamente y transcribe el texto en Wayuu'
        },
        expectedAnswer: entry.transcription,
        hints: [
          'Escucha varias veces si es necesario',
          'Presta atención a los sonidos especiales del Wayuu',
          'Divide la frase en partes más pequeñas'
        ],
        audioId: entry.id
      });
    }

    return exercises;
  }

  private async generatePatternRecognitionExercises(difficulty: string, count: number): Promise<LearningExercise[]> {
    const exercises: LearningExercise[] = [];
    const audioData = await this.datasetsService.getAudioEntries();
    const audioEntries = audioData.entries || [];
    
    // Group entries by phonetic patterns
    const patternGroups = new Map<string, typeof audioEntries>();
    
    for (const entry of audioEntries) {
      const phonemes = this.extractPhonemes(entry.transcription);
      const key = phonemes.slice(0, 3).join('-'); // First 3 phonemes as pattern
      
      if (!patternGroups.has(key)) {
        patternGroups.set(key, []);
      }
      patternGroups.get(key)!.push(entry);
    }

    let exerciseCount = 0;
    for (const [pattern, entries] of patternGroups) {
      if (exerciseCount >= count) break;
      if (entries.length < 2) continue;

      const correctEntry = entries[0];
      const distractors = entries.slice(1, 4);

      exercises.push({
        id: `pattern_${exerciseCount + 1}`,
        type: 'pattern-recognition',
        difficulty,
        title: `Reconocimiento de Patrones Fonéticos`,
        description: 'Identifica cuál de las siguientes opciones tiene el mismo patrón fonético',
        content: {
          targetAudio: correctEntry.id,
          options: [correctEntry, ...distractors].map(e => ({
            id: e.id,
            text: e.transcription
          }))
        },
        expectedAnswer: correctEntry.id,
        hints: [
          'Escucha el patrón de sonidos al inicio de cada palabra',
          'Presta atención a las consonantes y vocales',
          'Compara los ritmos y acentos'
        ]
      });

      exerciseCount++;
    }

    return exercises;
  }

  private async generateVocabularyExercises(difficulty: string, count: number, focusWords?: string[]): Promise<LearningExercise[]> {
    const exercises: LearningExercise[] = [];
    
    // Get dictionary entries through proper method
    await this.datasetsService.loadWayuuDictionary();
    const allEntries = await this.datasetsService.getDatasetInfo();
    const dictionaryEntries = allEntries.entries || [];
    
    let filteredEntries = dictionaryEntries;
    
    // Filter by focus words if provided
    if (focusWords && focusWords.length > 0) {
      filteredEntries = dictionaryEntries.filter(entry =>
        focusWords.some(word => 
          entry.guc.toLowerCase().includes(word.toLowerCase()) ||
          entry.spa.toLowerCase().includes(word.toLowerCase())
        )
      );
    }

    for (let i = 0; i < Math.min(count, filteredEntries.length); i++) {
      const entry = filteredEntries[i];
      
      // Create multiple choice options
      const wrongOptions = dictionaryEntries
        .filter(e => e.guc !== entry.guc)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(e => e.spa);

      const options = [entry.spa, ...wrongOptions].sort(() => Math.random() - 0.5);

      exercises.push({
        id: `vocabulary_${i + 1}`,
        type: 'vocabulary',
        difficulty,
        title: `Vocabulario: ${entry.guc}`,
        description: '¿Cuál es la traducción correcta de esta palabra Wayuu?',
        content: {
          wayuuWord: entry.guc,
          options: options,
          context: 'Palabra del vocabulario Wayuu'
        },
        expectedAnswer: entry.spa,
        hints: [
          'Piensa en el contexto de la palabra',
          'Recuerda las raíces comunes en Wayuu',
          'Considera el significado más directo'
        ]
      });
    }

    return exercises;
  }

  private generateLearningHints(originalText: string, translatedText: string, direction: TranslationDirection): string[] {
    const hints: string[] = [];
    
    if (direction === TranslationDirection.SPANISH_TO_WAYUU) {
      const phonemes = this.extractPhonemes(translatedText);
      
      if (phonemes.includes('ꞌ')) {
        hints.push('Esta palabra contiene una oclusión glotal (ꞌ) - haz una pausa breve');
      }
      
      if (phonemes.includes('ü')) {
        hints.push('La vocal ü se pronuncia como una "i" central relajada');
      }
      
      if (translatedText.includes('Maleiwa')) {
        hints.push('Maleiwa es el nombre del Creador en la cosmogonía Wayuu');
      }
    } else {
      if (originalText.includes('wayuu')) {
        hints.push('Wayuu significa "persona" y es el nombre del pueblo indígena');
      }
    }

    return hints;
  }

  private async findTranslation(
    text: string,
    direction: TranslationDirection,
    preferredDataset?: string,
  ): Promise<any> {
    // First try to find exact match
    const exactMatch = await this.datasetsService.findExactMatch(text, direction, preferredDataset);
    if (exactMatch) {
      this.metricsService.incrementDictionaryLookup('exact_match', true);
      return exactMatch;
    }

    // Try fuzzy matching
    const fuzzyMatch = await this.datasetsService.findFuzzyMatch(text, direction, preferredDataset);
    if (fuzzyMatch) {
      this.metricsService.incrementDictionaryLookup('fuzzy_match', true);
      return fuzzyMatch;
    }

    // No match found
    this.metricsService.incrementDictionaryLookup('no_match', false);
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

  /**
   * 🎯 NUEVA FUNCIONALIDAD: Generador de ejercicios masivos con dataset completo
   */
  async generateMassiveExercises(exerciseDto: LearningExerciseDto & {
    useFullDataset?: boolean;
    frequencyBasedDifficulty?: boolean;
    adaptiveDifficulty?: boolean;
    includeAudioExercises?: boolean;
  }): Promise<LearningExercise[]> {
    const { 
      exerciseType, 
      difficulty, 
      count, 
      focusWords,
      useFullDataset = true,
      frequencyBasedDifficulty = true,
      adaptiveDifficulty = true,
      includeAudioExercises = true
    } = exerciseDto;

    this.logger.log(`🎯 Generating massive exercises: type=${exerciseType}, difficulty=${difficulty}, count=${count}`);

    try {
      let exercises: LearningExercise[] = [];

      // Obtener dataset completo (7K+ entradas) usando métodos existentes
      const dictionaryData = await this.getDictionaryEntries();
      const audioData = await this.datasetsService.getAudioEntries(1, 810); // Get all audio entries
      
      const dictionaryEntries = dictionaryData.entries || [];
      const audioEntries = audioData.entries || [];

      this.logger.log(`📚 Using massive dataset: ${dictionaryEntries.length} dictionary + ${audioEntries.length} audio entries`);

      // Análisis de frecuencia para dificultad adaptativa
      const wordFrequency = this.analyzeWordFrequency(dictionaryEntries);
      
      switch (exerciseType) {
        case 'vocabulary-massive':
          exercises = await this.generateVocabularyMassiveExercises(
            dictionaryEntries, difficulty, count, wordFrequency, frequencyBasedDifficulty
          );
          break;
          
        case 'translation-challenge':
          exercises = await this.generateTranslationChallengeExercises(
            dictionaryEntries, difficulty, count, wordFrequency
          );
          break;
          
        case 'phonetic-pattern-advanced':
          exercises = await this.generateAdvancedPhoneticExercises(
            dictionaryEntries, audioEntries, difficulty, count
          );
          break;
          
        case 'cultural-context':
          exercises = await this.generateCulturalContextExercises(
            dictionaryEntries, difficulty, count
          );
          break;
          
        case 'adaptive-learning':
          exercises = await this.generateAdaptiveLearningExercises(
            dictionaryEntries, audioEntries, difficulty, count, adaptiveDifficulty
          );
          break;
          
        case 'pronunciation':
          exercises = await this.generatePronunciationExercises(difficulty, count, focusWords);
          break;
          
        default:
          // Fallback a ejercicios estándar
          exercises = await this.generateStandardExercises(exerciseType, difficulty, count, focusWords);
      }

      // Mezclar audio si está disponible y solicitado
      if (includeAudioExercises && audioEntries.length > 0) {
        const audioExercises = await this.generateAudioIntegratedExercises(
          exercises, audioEntries, Math.min(count / 3, 5)
        );
        exercises = [...exercises, ...audioExercises];
      }

      // Ordenar por dificultad si es adaptativo
      if (adaptiveDifficulty) {
        exercises = this.sortExercisesByAdaptiveDifficulty(exercises, wordFrequency);
      }

      this.logger.log(`✅ Generated ${exercises.length} massive exercises successfully`);
      return exercises.slice(0, count);

    } catch (error) {
      this.logger.error(`❌ Error generating massive exercises: ${error.message}`);
      throw new Error(`Failed to generate massive exercises: ${error.message}`);
    }
  }

  /**
   * 🔧 Método auxiliar para obtener entradas del diccionario
   */
  private async getDictionaryEntries(): Promise<{ entries: any[] }> {
    try {
      // Cargar el dataset principal si no está cargado
      await this.datasetsService.loadWayuuDictionary();
      
      // Obtener estadísticas del diccionario que incluyen las entradas
      const stats = await this.datasetsService.getDictionaryStats();
      
      // Retornar un formato consistente
      return {
        entries: stats.sampleEntries || []
      };
    } catch (error) {
      this.logger.error(`Error getting dictionary entries: ${error.message}`);
      return { entries: [] };
    }
  }

  /**
   * 🧠 Ejercicios fonéticos avanzados con dataset masivo
   */
  private async generateAdvancedPhoneticExercises(
    dictionaryEntries: any[], 
    audioEntries: any[], 
    difficulty: string, 
    count: number
  ): Promise<LearningExercise[]> {
    const exercises: LearningExercise[] = [];
    
    // Combinar entradas de diccionario con audio para ejercicios complejos
    const combinedEntries = dictionaryEntries.filter(dictEntry => {
      // Buscar entradas que tengan fonemas complejos
      const hasComplexPhonemes = /[üꞌ]/.test(dictEntry.guc || '');
      const hasConsonantClusters = /[ptk][lr]|[mn][ptk]/.test(dictEntry.guc || '');
      
      switch (difficulty) {
        case 'beginner': return hasComplexPhonemes;
        case 'intermediate': return hasComplexPhonemes || hasConsonantClusters;
        case 'advanced': return hasComplexPhonemes && hasConsonantClusters;
        default: return hasComplexPhonemes;
      }
    });

    const shuffledEntries = combinedEntries.sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(count, shuffledEntries.length); i++) {
      const entry = shuffledEntries[i];
      
      // Análisis fonético profundo
      const phoneticAnalysis = await this.analyzePhonetics({ text: entry.guc });
      
      // Buscar audio relacionado si existe
      const relatedAudio = audioEntries.find(audio => 
        audio.transcription?.toLowerCase().includes(entry.guc.toLowerCase())
      );

      exercises.push({
        id: `phonetic_advanced_${i + 1}`,
        type: 'phonetic-pattern-advanced',
        difficulty,
        title: `Fonética Avanzada: ${entry.guc}`,
        description: 'Analiza patrones fonéticos complejos del wayuu con datos del dataset masivo',
        content: {
          wayuu: entry.guc,
          spanish: entry.spa,
          phoneticAnalysis,
          audioId: relatedAudio?.id || null,
          complexPhonemes: phoneticAnalysis.phonemes.filter(p => ['ü', 'ꞌ', 'ch', 'sh'].includes(p)),
          syllableStructure: phoneticAnalysis.syllables,
          practicePattern: this.generatePhoneticPattern(entry.guc)
        },
        expectedAnswer: entry.spa,
        hints: [
          `Fonemas complejos: ${phoneticAnalysis.phonemes.filter(p => ['ü', 'ꞌ', 'ch', 'sh'].includes(p)).join(', ')}`,
          `Estructura silábica: ${phoneticAnalysis.syllables.join(' - ')}`,
          'Presta atención a la pronunciación de los fonemas únicos del wayuu'
        ],
        audioId: relatedAudio?.id || undefined,
        metadata: {
          phoneticComplexity: phoneticAnalysis.difficulty,
          sourceDataset: 'Massive-7K-Dataset',
          multiModal: !!relatedAudio,
          sourceTypes: relatedAudio ? ['dictionary', 'audio'] : ['dictionary']
        }
      });
    }

    return exercises;
  }

  /**
   * 🎼 Generar patrón fonético para ejercicio
   */
  private generatePhoneticPattern(wayuuText: string): string {
    const phonemes = this.extractPhonemes(wayuuText);
    return phonemes.map(p => {
      if (['ü', 'ꞌ'].includes(p)) return `[${p}]`;
      if (['ch', 'sh'].includes(p)) return `{${p}}`;
      return p;
    }).join('-');
  }

  /**
   * 📊 Análisis de frecuencia de palabras en el dataset completo
   */
  private analyzeWordFrequency(entries: any[]): Map<string, number> {
    const wordFreq = new Map<string, number>();
    
    entries.forEach(entry => {
      // Analizar palabras wayuu
      const wayuuWords = entry.guc?.toLowerCase().split(/\s+/) || [];
      wayuuWords.forEach(word => {
        if (word.length > 1) {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
      });
      
      // Analizar palabras españolas
      const spanishWords = entry.spa?.toLowerCase().split(/\s+/) || [];
      spanishWords.forEach(word => {
        if (word.length > 1) {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
      });
    });

    return wordFreq;
  }

  /**
   * 🎯 Ejercicios de vocabulario masivo con dataset completo
   */
  private async generateVocabularyMassiveExercises(
    entries: any[], 
    difficulty: string, 
    count: number, 
    wordFreq: Map<string, number>,
    useFrequency: boolean
  ): Promise<LearningExercise[]> {
    const exercises: LearningExercise[] = [];
    
    // Filtrar entradas por dificultad basada en frecuencia
    let filteredEntries = entries;
    if (useFrequency) {
      filteredEntries = entries.filter(entry => {
        const wayuuWord = entry.guc?.toLowerCase() || '';
        const frequency = wordFreq.get(wayuuWord) || 0;
        
        switch (difficulty) {
          case 'beginner': return frequency >= 10; // Palabras muy frecuentes
          case 'intermediate': return frequency >= 3 && frequency < 10; // Frecuencia media
          case 'advanced': return frequency < 3; // Palabras raras
          default: return true;
        }
      });
    }

    // Mezclar entradas para variedad
    const shuffledEntries = filteredEntries.sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(count, shuffledEntries.length); i++) {
      const correctEntry = shuffledEntries[i];
      
      // Generar distractores del mismo dataset
      const distractors = shuffledEntries
        .filter(e => e.guc !== correctEntry.guc)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const options = [correctEntry, ...distractors]
        .sort(() => Math.random() - 0.5)
        .map(entry => ({
          id: entry.guc,
          text: entry.spa,
          isCorrect: entry.guc === correctEntry.guc
        }));

      exercises.push({
        id: `vocab_massive_${i + 1}`,
        type: 'vocabulary-massive',
        difficulty,
        title: `Vocabulario Masivo: ${correctEntry.guc}`,
        description: 'Selecciona la traducción correcta usando el dataset completo de 7K+ entradas',
        content: {
          question: correctEntry.guc,
          options,
          context: `Palabra del dataset masivo - Frecuencia: ${wordFreq.get(correctEntry.guc.toLowerCase()) || 'Única'}`
        },
        expectedAnswer: correctEntry.guc,
        hints: [
          'Este ejercicio usa el dataset completo de 7,033 entradas',
          'Considera el contexto cultural de la palabra',
          `Frecuencia en el dataset: ${wordFreq.get(correctEntry.guc.toLowerCase()) || 1} veces`
        ],
        metadata: {
          datasetSize: entries.length,
          wordFrequency: wordFreq.get(correctEntry.guc.toLowerCase()) || 1,
          sourceDataset: 'Massive-7K-Dataset'
        }
      });
    }

    return exercises;
  }

  /**
   * 🏆 Ejercicios de desafío de traducción avanzada
   */
  private async generateTranslationChallengeExercises(
    entries: any[], 
    difficulty: string, 
    count: number, 
    wordFreq: Map<string, number>
  ): Promise<LearningExercise[]> {
    const exercises: LearningExercise[] = [];
    
    // Seleccionar entradas complejas para desafío
    const challengeEntries = entries.filter(entry => {
      const wayuuText = entry.guc || '';
      const spanishText = entry.spa || '';
      
      // Criterios de dificultad
      const hasComplexPhonemes = /[üꞌ]/.test(wayuuText);
      const isMultiWord = wayuuText.split(' ').length > 1;
      const hasLongTranslation = spanishText.split(' ').length > 2;
      const lowFrequency = (wordFreq.get(wayuuText.toLowerCase()) || 0) < 5;
      
      switch (difficulty) {
        case 'beginner': return !hasComplexPhonemes && !isMultiWord;
        case 'intermediate': return hasComplexPhonemes || isMultiWord;
        case 'advanced': return hasComplexPhonemes && (isMultiWord || hasLongTranslation || lowFrequency);
        default: return true;
      }
    });

    const shuffledChallenges = challengeEntries.sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(count, shuffledChallenges.length); i++) {
      const challenge = shuffledChallenges[i];
      
      // Análisis fonético del desafío
      const phoneticAnalysis = await this.analyzePhonetics({ text: challenge.guc });
      
      exercises.push({
        id: `translation_challenge_${i + 1}`,
        type: 'translation-challenge',
        difficulty,
        title: `Desafío de Traducción: ${challenge.guc}`,
        description: 'Traduce esta expresión compleja del wayuu al español',
        content: {
          challenge: challenge.guc,
          expectedTranslation: challenge.spa,
          phoneticAnalysis,
          hints: phoneticAnalysis.practiceRecommendations,
          difficulty: phoneticAnalysis.difficulty
        },
        expectedAnswer: challenge.spa,
        hints: [
          `Dificultad fonética: ${phoneticAnalysis.difficulty}`,
          'Usa el análisis fonético como guía',
          `Esta palabra aparece ${wordFreq.get(challenge.guc.toLowerCase()) || 1} veces en el dataset`
        ],
        metadata: {
          phoneticComplexity: phoneticAnalysis.difficulty,
          sourceDataset: 'Massive-7K-Dataset',
          wordFrequency: wordFreq.get(challenge.guc.toLowerCase()) || 1
        }
      });
    }

    return exercises;
  }

  /**
   * 🧠 Ejercicios adaptativos basados en rendimiento
   */
  private async generateAdaptiveLearningExercises(
    dictionaryEntries: any[], 
    audioEntries: any[], 
    difficulty: string, 
    count: number,
    useAdaptive: boolean
  ): Promise<LearningExercise[]> {
    const exercises: LearningExercise[] = [];
    
    // Combinar fuentes de datos para ejercicios híbridos
    const combinedContent = this.createAdaptiveContent(dictionaryEntries, audioEntries);
    
    for (let i = 0; i < Math.min(count, combinedContent.length); i++) {
      const content = combinedContent[i];
      
      exercises.push({
        id: `adaptive_${i + 1}`,
        type: 'adaptive-learning',
        difficulty,
        title: `Aprendizaje Adaptativo: ${content.wayuu}`,
        description: 'Ejercicio que se adapta a tu nivel y combina audio, texto y contexto',
        content: {
          wayuu: content.wayuu,
          spanish: content.spanish,
          hasAudio: content.hasAudio,
          audioId: content.audioId,
          contextClues: content.contextClues,
          adaptiveHints: content.adaptiveHints
        },
        expectedAnswer: content.spanish,
        hints: content.adaptiveHints,
        metadata: {
          adaptiveLevel: difficulty,
          multiModal: content.hasAudio,
          datasetSize: 7000,
          sourceTypes: content.hasAudio ? ['dictionary', 'audio'] : ['dictionary']
        }
      });
    }

    return exercises;
  }

  /**
   * 🎵 Integración de ejercicios con audio
   */
  private async generateAudioIntegratedExercises(
    baseExercises: LearningExercise[], 
    audioEntries: any[], 
    audioCount: number
  ): Promise<LearningExercise[]> {
    const audioExercises: LearningExercise[] = [];
    
    const shuffledAudio = audioEntries.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(audioCount, shuffledAudio.length); i++) {
      const audioEntry = shuffledAudio[i];
      
      audioExercises.push({
        id: `audio_integrated_${i + 1}`,
        type: 'audio-integrated',
        difficulty: 'intermediate',
        title: `Audio + Texto: ${audioEntry.transcription}`,
        description: 'Combina audio real de wayuu con ejercicios de texto del dataset masivo',
        content: {
          audioId: audioEntry.id,
          transcription: audioEntry.transcription,
          relatedExercise: baseExercises[i % baseExercises.length]
        },
        expectedAnswer: audioEntry.transcription,
        hints: [
          'Escucha el audio y relaciona con el vocabulario del dataset',
          'Combina pronunciación nativa con conocimiento textual'
        ],
        audioId: audioEntry.id,
        metadata: {
          multiModal: true,
          sourceDataset: 'Audio+Massive-Dictionary',
          integrationLevel: 'advanced'
        }
      });
    }

    return audioExercises;
  }

  /**
   * 🏺 Ejercicios de contexto cultural
   */
  private async generateCulturalContextExercises(
    entries: any[], 
    difficulty: string, 
    count: number
  ): Promise<LearningExercise[]> {
    const exercises: LearningExercise[] = [];
    
    // Identificar entradas con contenido cultural
    const culturalEntries = entries.filter(entry => {
      const cultural_keywords = [
        'maleiwa', 'wayuu', 'alijuna', 'ouutsü', 'jouktai', 'ekii', 
        'maikiralii', 'shiiruku', 'chinchorro', 'kapasuuna'
      ];
      
      const text = (entry.guc + ' ' + entry.spa).toLowerCase();
      return cultural_keywords.some(keyword => text.includes(keyword));
    });

    const shuffledCultural = culturalEntries.sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(count, shuffledCultural.length); i++) {
      const culturalEntry = shuffledCultural[i];
      
      exercises.push({
        id: `cultural_${i + 1}`,
        type: 'cultural-context',
        difficulty,
        title: `Contexto Cultural: ${culturalEntry.guc}`,
        description: 'Aprende sobre la cultura wayuu a través de su idioma',
        content: {
          wayuu: culturalEntry.guc,
          spanish: culturalEntry.spa,
          culturalNote: this.generateCulturalNote(culturalEntry),
          context: 'Expresión importante en la cultura wayuu'
        },
        expectedAnswer: culturalEntry.spa,
        hints: [
          'Esta palabra tiene significado cultural especial',
          'Considera el contexto social y tradicional wayuu'
        ],
        metadata: {
          culturalRelevance: 'high',
          sourceDataset: 'Massive-7K-Dataset'
        }
      });
    }

    return exercises;
  }

  private createAdaptiveContent(dictionaryEntries: any[], audioEntries: any[]): any[] {
    return dictionaryEntries.slice(0, 50).map(dictEntry => {
      const matchingAudio = audioEntries.find(audio => 
        audio.transcription?.toLowerCase().includes(dictEntry.guc.toLowerCase())
      );
      
      return {
        wayuu: dictEntry.guc,
        spanish: dictEntry.spa,
        hasAudio: !!matchingAudio,
        audioId: matchingAudio?.id || null,
        contextClues: this.generateContextClues(dictEntry),
        adaptiveHints: this.generateAdaptiveHints(dictEntry, !!matchingAudio)
      };
    });
  }

  private generateContextClues(entry: any): string[] {
    const clues = [];
    
    if (entry.guc.length > 6) {
      clues.push('Palabra compuesta o de significado complejo');
    }
    
    if (entry.spa.split(' ').length > 1) {
      clues.push('Traducción con múltiples palabras en español');
    }
    
    return clues;
  }

  private generateAdaptiveHints(entry: any, hasAudio: boolean): string[] {
    const hints = [];
    
    hints.push(`Palabra wayuu: ${entry.guc.length} letras`);
    hints.push(`Traducción: ${entry.spa.split(' ').length} palabras en español`);
    
    if (hasAudio) {
      hints.push('🎵 Audio disponible para pronunciación');
    }
    
    return hints;
  }

  private generateCulturalNote(entry: any): string {
    const culturalNotes = {
      'maleiwa': 'Maleiwa es el creador en la cosmología wayuu',
      'wayuu': 'Autodenominación del pueblo wayuu, significa "persona"',
      'alijuna': 'Término para referirse a personas no wayuu',
      'chinchorro': 'Hamaca tradicional wayuu, símbolo cultural importante'
    };
    
    const key = entry.guc.toLowerCase();
    return culturalNotes[key] || 'Palabra con significado cultural en la tradición wayuu';
  }

  private sortExercisesByAdaptiveDifficulty(exercises: LearningExercise[], wordFreq: Map<string, number>): LearningExercise[] {
    return exercises.sort((a, b) => {
      const aFreq = wordFreq.get(a.content?.wayuu?.toLowerCase() || '') || 0;
      const bFreq = wordFreq.get(b.content?.wayuu?.toLowerCase() || '') || 0;
      
      // Ordenar por frecuencia (más frecuente = más fácil)
      return bFreq - aFreq;
    });
  }

  private async generateStandardExercises(
    exerciseType: string, 
    difficulty: string, 
    count: number, 
    focusWords?: string[]
  ): Promise<LearningExercise[]> {
    // Fallback a métodos existentes
    switch (exerciseType) {
      case 'pronunciation':
        return this.generatePronunciationExercises(difficulty, count, focusWords);
      case 'listening':
        return this.generateListeningExercises(difficulty, count);
      case 'vocabulary':
        return this.generateVocabularyExercises(difficulty, count, focusWords);
      case 'pattern-recognition':
        return this.generatePatternRecognitionExercises(difficulty, count);
      default:
        return [];
    }
  }
}
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
}
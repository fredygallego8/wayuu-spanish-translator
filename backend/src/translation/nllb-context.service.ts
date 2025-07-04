import { Injectable, Logger } from '@nestjs/common';

export interface TranslationContext {
  domain: 'cultural' | 'family' | 'ceremonial' | 'daily' | 'educational' | 'technical';
  culturalMarkers?: string[];
  previousTranslations?: TranslationMemory[];
  glossary?: Record<string, string>;
  formality?: 'formal' | 'informal' | 'ceremonial';
}

export interface TranslationMemory {
  sourceText: string;
  targetText: string;
  context: string;
  timestamp: Date;
  quality: number;
  domain: 'cultural' | 'family' | 'ceremonial' | 'daily' | 'educational' | 'technical';
}

export interface ContextualTranslationRequest {
  text: string;
  sourceLang: 'wayuu' | 'spanish';
  targetLang: 'wayuu' | 'spanish';
  context: TranslationContext;
  preserveTerminology?: boolean;
  useMemory?: boolean;
}

export interface ContextualTranslationResponse {
  translatedText: string;
  confidence: number;
  contextualAdjustments: string[];
  memoryMatches: TranslationMemory[];
  terminologyApplied: Record<string, string>;
  culturalNotes?: string[];
  qualityScore: number;
  processingTime: number;
  model: string;
  qualityMetrics?: {
    bleuScore?: number;
    lengthRatio: number;
    contextRelevance: number;
    terminologyConsistency: number;
    culturalAdaptation: number;
    overallScore: number;
  };
}

@Injectable()
export class NllbContextService {
  private readonly logger = new Logger(NllbContextService.name);
  private translationMemory: Map<string, TranslationMemory[]> = new Map();
  private culturalGlossary: Map<string, Record<string, string>> = new Map();

  constructor() {
    this.initializeCulturalGlossary();
    this.initializeTranslationMemory();
  }

  async translateContextual(request: ContextualTranslationRequest): Promise<ContextualTranslationResponse> {
    const startTime = Date.now();
    this.logger.debug(`Starting contextual translation for: "${request.text}"`);

    try {
      // 1. Analyze text context and domain
      const detectedContext = await this.analyzeTextContext(request.text, request.sourceLang);
      const mergedContext = this.mergeContexts(detectedContext, request.context);

      // 2. Search translation memory for matches
      const memoryMatches = this.searchTranslationMemory(request.text, mergedContext.domain);

      // 3. Apply terminology consistency
      const terminologyMap = this.buildTerminologyMap(request.text, mergedContext);

      // 4. Perform base translation with context hints
      const baseTranslation = await this.performContextualTranslation(request, mergedContext, terminologyMap);

      // 5. Post-process with cultural adaptations
      const culturallyAdapted = this.applyCulturalAdaptations(baseTranslation, mergedContext);

      // 6. Generate contextual adjustments and cultural notes
      const adjustments = this.generateContextualAdjustments(request.text, culturallyAdapted, mergedContext);
      const culturalNotes = this.generateCulturalNotes(request.text, mergedContext);

      // 7. Calculate quality score
      const qualityScore = this.calculateQualityScore(culturallyAdapted, memoryMatches, terminologyMap);

      // 8. Store in translation memory
      await this.storeTranslationMemory({
        sourceText: request.text,
        targetText: culturallyAdapted,
        context: mergedContext.domain,
        timestamp: new Date(),
        quality: qualityScore,
        domain: mergedContext.domain
      });

      const processingTime = Date.now() - startTime;

      return {
        translatedText: culturallyAdapted,
        confidence: Math.min(0.95, qualityScore * 0.01 + 0.85),
        contextualAdjustments: adjustments,
        memoryMatches: memoryMatches.slice(0, 3),
        terminologyApplied: terminologyMap,
        culturalNotes,
        qualityScore,
        processingTime,
        model: 'nllb-context-aware-v2.0',
        qualityMetrics: {
          lengthRatio: culturallyAdapted.length / request.text.length,
          contextRelevance: qualityScore * 0.01,
          terminologyConsistency: Object.keys(terminologyMap).length > 0 ? 0.9 : 0.8,
          culturalAdaptation: adjustments.length > 0 ? 0.95 : 0.85,
          overallScore: qualityScore
        }
      };

    } catch (error) {
      this.logger.error(`Contextual translation failed: ${error.message}`);
      throw new Error(`Context-aware translation failed: ${error.message}`);
    }
  }

  private async analyzeTextContext(text: string, sourceLang: string): Promise<Partial<TranslationContext>> {
    const culturalMarkers = this.detectCulturalMarkers(text, sourceLang);
    const domain = this.detectDomain(text, culturalMarkers);
    const formality = this.detectFormality(text, sourceLang);

    return {
      domain,
      culturalMarkers,
      formality
    };
  }

  private detectCulturalMarkers(text: string, sourceLang: string): string[] {
    const markers: string[] = [];
    const lowerText = text.toLowerCase();

    if (sourceLang === 'wayuu') {
      // Wayuu cultural markers
      const wayuuMarkers = {
        'greeting': ['kaaꞌula', 'jamaya', 'kassain'],
        'respect': ['aachin', 'anasü', 'chi'],
        'ceremonial': ['yonna', 'chicha', 'kashi'],
        'family': ['eekai', 'ouutsü', 'alama'],
        'spiritual': ['maleiwa', 'pulowi', 'wanülü']
      };

      for (const [category, words] of Object.entries(wayuuMarkers)) {
        if (words.some(word => lowerText.includes(word))) {
          markers.push(category);
        }
      }
    } else {
      // Spanish cultural context markers
      const spanishMarkers = {
        'formal': ['usted', 'señor', 'señora', 'don', 'doña'],
        'informal': ['tú', 'vos', 'che', 'hermano'],
        'ceremonial': ['ceremonia', 'ritual', 'tradición', 'ancestro'],
        'family': ['familia', 'padre', 'madre', 'hijo', 'hermano']
      };

      for (const [category, words] of Object.entries(spanishMarkers)) {
        if (words.some(word => lowerText.includes(word))) {
          markers.push(category);
        }
      }
    }

    return markers;
  }

  private detectDomain(text: string, culturalMarkers: string[]): TranslationContext['domain'] {
    if (culturalMarkers.includes('ceremonial') || culturalMarkers.includes('spiritual')) {
      return 'ceremonial';
    }
    if (culturalMarkers.includes('family')) {
      return 'family';
    }
    if (culturalMarkers.includes('greeting') || culturalMarkers.includes('respect')) {
      return 'cultural';
    }
    if (text.length < 10) {
      return 'daily';
    }
    return 'cultural'; // Default fallback
  }

  private detectFormality(text: string, sourceLang: string): TranslationContext['formality'] {
    const lowerText = text.toLowerCase();

    if (sourceLang === 'wayuu') {
      if (lowerText.includes('anasü') || lowerText.includes('aachin')) {
        return 'formal';
      }
      if (lowerText.includes('yonna') || lowerText.includes('maleiwa')) {
        return 'ceremonial';
      }
    } else {
      if (lowerText.includes('usted') || lowerText.includes('señor')) {
        return 'formal';
      }
      if (lowerText.includes('ceremonia') || lowerText.includes('ritual')) {
        return 'ceremonial';
      }
    }

    return 'informal';
  }

  private mergeContexts(detected: Partial<TranslationContext>, provided: TranslationContext): TranslationContext {
    return {
      domain: provided.domain || detected.domain || 'cultural',
      culturalMarkers: [...new Set([...(provided.culturalMarkers || []), ...(detected.culturalMarkers || [])])],
      previousTranslations: provided.previousTranslations || detected.previousTranslations || [],
      glossary: provided.glossary || detected.glossary,
      formality: provided.formality || detected.formality || 'informal'
    };
  }

  private searchTranslationMemory(text: string, domain: string): TranslationMemory[] {
    const domainMemory = this.translationMemory.get(domain) || [];
    const textLower = text.toLowerCase();

    return domainMemory
      .filter(memory => {
        const similarity = this.calculateTextSimilarity(textLower, memory.sourceText.toLowerCase());
        return similarity > 0.7; // 70% similarity threshold
      })
      .sort((a, b) => b.quality - a.quality)
      .slice(0, 5);
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
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
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private buildTerminologyMap(text: string, context: TranslationContext): Record<string, string> {
    const terminology: Record<string, string> = {};
    const domainGlossary = this.culturalGlossary.get(context.domain) || {};

    // Apply domain-specific terminology
    Object.entries(domainGlossary).forEach(([source, target]) => {
      if (text.toLowerCase().includes(source.toLowerCase())) {
        terminology[source] = target;
      }
    });

    // Apply user-provided glossary
    if (context.glossary) {
      Object.entries(context.glossary).forEach(([source, target]) => {
        if (text.toLowerCase().includes(source.toLowerCase())) {
          terminology[source] = target;
        }
      });
    }

    return terminology;
  }

  private async performContextualTranslation(
    request: ContextualTranslationRequest,
    context: TranslationContext,
    terminology: Record<string, string>
  ): Promise<string> {
    // This would integrate with the actual NLLB service
    // For now, simulate contextual translation with enhanced demo logic
    
    let translatedText = request.text;

    // Apply terminology consistently
    Object.entries(terminology).forEach(([source, target]) => {
      const regex = new RegExp(source, 'gi');
      translatedText = translatedText.replace(regex, target);
    });

    // Context-specific translations (enhanced demo)
    const contextualMap = this.getContextualTranslations(context.domain);
    
    Object.entries(contextualMap).forEach(([source, target]) => {
      const regex = new RegExp(`\\b${source}\\b`, 'gi');
      translatedText = translatedText.replace(regex, target);
    });

    return translatedText;
  }

  private getContextualTranslations(domain: string): Record<string, string> {
    const translations = {
      'cultural': {
        'taya wayuu': 'yo soy wayuu',
        'kaaꞌula anasü': 'buenos días hermano',
        'jamaya wayuu': 'hola paisano wayuu',
        'kassain': 'hasta luego'
      },
      'ceremonial': {
        'yonna': 'danza tradicional',
        'chicha': 'bebida ceremonial',
        'maleiwa': 'ser supremo',
        'kashi': 'luna'
      },
      'family': {
        'eekai': 'hermano mayor',
        'ouutsü': 'hermana',
        'alama': 'mi hijo'
      },
      'daily': {
        'anaa': 'agua',
        'ama': 'lluvia',
        'wuchii': 'cabra'
      }
    };

    return translations[domain] || translations['cultural'];
  }

  private applyCulturalAdaptations(translation: string, context: TranslationContext): string {
    let adapted = translation;

    // Apply formality adjustments
    if (context.formality === 'formal') {
      adapted = adapted.replace(/\btú\b/g, 'usted');
      adapted = adapted.replace(/\bhola\b/g, 'buenos días');
    } else if (context.formality === 'ceremonial') {
      adapted = adapted.replace(/\bhola\b/g, 'saludos ceremoniales');
    }

    // Cultural context adaptations
    if (context.domain === 'ceremonial') {
      adapted = adapted.replace(/\bbaile\b/g, 'danza tradicional');
      adapted = adapted.replace(/\bbebida\b/g, 'bebida ceremonial');
    }

    return adapted;
  }

  private generateContextualAdjustments(original: string, translated: string, context: TranslationContext): string[] {
    const adjustments: string[] = [];

    if (context.culturalMarkers?.includes('ceremonial')) {
      adjustments.push('Adaptación ceremonial aplicada');
    }

    if (context.formality === 'formal') {
      adjustments.push('Registro formal aplicado');
    }

    if (Object.keys(this.buildTerminologyMap(original, context)).length > 0) {
      adjustments.push('Terminología consistente aplicada');
    }

    return adjustments;
  }

  private generateCulturalNotes(text: string, context: TranslationContext): string[] {
    const notes: string[] = [];

    if (context.culturalMarkers.includes('greeting')) {
      notes.push('Los saludos wayuu varían según la hora del día y la relación familiar');
    }

    if (context.domain === 'ceremonial') {
      notes.push('Contexto ceremonial detectado - se preservan términos sagrados');
    }

    if (context.culturalMarkers.includes('family')) {
      notes.push('Términos familiares wayuu indican relaciones específicas del clan');
    }

    return notes;
  }

  private calculateQualityScore(translation: string, memoryMatches: TranslationMemory[], terminology: Record<string, string>): number {
    let score = 75; // Base score

    // Boost for memory matches
    if (memoryMatches.length > 0) {
      score += Math.min(15, memoryMatches.length * 3);
    }

    // Boost for terminology consistency
    if (Object.keys(terminology).length > 0) {
      score += Math.min(10, Object.keys(terminology).length * 2);
    }

    // Length and complexity adjustments
    if (translation.split(' ').length > 5) {
      score += 5; // Longer translations get slight boost
    }

    return Math.min(100, score);
  }

  private async storeTranslationMemory(memory: TranslationMemory): Promise<void> {
    const domain = memory.domain;
    
    if (!this.translationMemory.has(domain)) {
      this.translationMemory.set(domain, []);
    }

    const domainMemory = this.translationMemory.get(domain)!;
    domainMemory.push(memory);

    // Keep only the best 100 translations per domain
    if (domainMemory.length > 100) {
      domainMemory.sort((a, b) => b.quality - a.quality);
      this.translationMemory.set(domain, domainMemory.slice(0, 100));
    }

    this.logger.debug(`Stored translation memory for domain: ${domain}`);
  }

  private initializeCulturalGlossary(): void {
    // Cultural domain glossary
    this.culturalGlossary.set('cultural', {
      'taya': 'yo',
      'wayuu': 'wayuu',
      'anasü': 'hermano',
      'kaaꞌula': 'buenos días',
      'jamaya': 'hola'
    });

    // Ceremonial domain glossary
    this.culturalGlossary.set('ceremonial', {
      'yonna': 'danza tradicional wayuu',
      'chicha': 'bebida ceremonial',
      'maleiwa': 'ser supremo',
      'kashi': 'luna',
      'pulowi': 'espíritu de la tierra'
    });

    // Family domain glossary
    this.culturalGlossary.set('family', {
      'eekai': 'hermano mayor',
      'ouutsü': 'hermana',
      'alama': 'mi hijo',
      'alaüla': 'mi hija',
      'achakai': 'mi padre'
    });

    this.logger.log('Cultural glossary initialized with 3 domains');
  }

  private initializeTranslationMemory(): void {
    // Pre-populate with some high-quality translations
    const culturalMemory: TranslationMemory[] = [
      {
        sourceText: 'taya wayuu anasü',
        targetText: 'yo soy wayuu hermano',
        context: 'cultural',
        timestamp: new Date(),
        quality: 95,
        domain: 'cultural'
      },
      {
        sourceText: 'kaaꞌula anasü kassain',
        targetText: 'buenos días hermano, hasta luego',
        context: 'cultural',
        timestamp: new Date(),
        quality: 92,
        domain: 'cultural'
      }
    ];

    this.translationMemory.set('cultural', culturalMemory);
    this.logger.log('Translation memory initialized with seed data');
  }

  // Public methods for management
  async getTranslationMemoryStats(): Promise<{ domain: string; count: number; avgQuality: number }[]> {
    const stats: { domain: string; count: number; avgQuality: number }[] = [];

    for (const [domain, memories] of this.translationMemory) {
      const avgQuality = memories.reduce((sum, m) => sum + m.quality, 0) / memories.length;
      stats.push({
        domain,
        count: memories.length,
        avgQuality: Math.round(avgQuality * 100) / 100
      });
    }

    return stats;
  }

  async clearTranslationMemory(domain?: string): Promise<void> {
    if (domain) {
      this.translationMemory.delete(domain);
      this.logger.log(`Cleared translation memory for domain: ${domain}`);
    } else {
      this.translationMemory.clear();
      this.logger.log('Cleared all translation memory');
    }
  }
} 
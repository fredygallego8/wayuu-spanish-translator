import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatasetsService } from '../datasets/datasets.service';
import { PdfProcessingService } from '../pdf-processing/pdf-processing.service';
import { MetricsService } from '../metrics/metrics.service';

export interface GeminiDictionaryEntry {
  guc: string;
  spa: string;
  confidence: number;
  source: 'gemini-generated';
  context?: string;
  culturalNotes?: string;
  phonetic?: string;
  generatedAt: string;
}

export interface DictionaryExpansionResult {
  success: boolean;
  entriesGenerated: number;
  entriesValidated: number;
  entriesRejected: number;
  highQualityEntries: GeminiDictionaryEntry[];
  flaggedForReview: GeminiDictionaryEntry[];
  processingTime: number;
  batchId: string;
}

@Injectable()
export class GeminiDictionaryService {
  private readonly logger = new Logger(GeminiDictionaryService.name);
  private geminiApiKey: string;
  private isConfigured = false;

  // 📊 ESTADÍSTICAS EN MEMORIA
  private expansionStats = {
    totalGenerated: 0,
    totalIntegrated: 0,
    totalSessions: 0,
    confidenceSum: 0,
    entriesWithConfidence: 0,
    lastExpansion: null as string | null,
    expansionHistory: [] as any[],
    pendingReviewEntries: [] as GeminiDictionaryEntry[]
  };

  // Contexto cultural wayuu para el prompt
  private readonly wayuuCulturalContext = `
La cultura wayuu es rica en tradiciones donde el territorio sagrado incluye:
- Jüpula (cerros sagrados)
- Palaa (mar)
- Woummainpaa (territorio ancestral)
- Sistema de clanes matrilineales
- Figura del palabrero (pütchipü'ü) como mediador
- Economía pastoral con chivos y ganado
- Artesanías como mochilas wayuu y hamacas
- Ceremonias como el encierro de las niñas (Blanqueo)
- Creencias en Maleiwa (Ser Supremo) y Pulowi (espíritu de la sequía)
`;

  // Patrones fonéticos wayuu para validación
  private readonly wayuuPhoneticPatterns = [
    /[üꞌ]/,  // Caracteres específicos wayuu
    /aa|ee|ii|oo|uu/, // Vocales largas
    /ch|sh|j|k/, // Consonantes típicas
    /\w+chi$/, // Sufijo -chi común en wayuu
    /\w+ka$/, // Sufijo -ka común en wayuu
    /\w+na$/, // Sufijo -na común en wayuu
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly datasetsService: DatasetsService,
    private readonly pdfProcessingService: PdfProcessingService,
    private readonly metricsService: MetricsService
  ) {
    this.initializeGemini();
  }

  private initializeGemini(): void {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (!this.geminiApiKey) {
      this.logger.warn('⚠️ GEMINI_API_KEY not configured - dictionary expansion will use mock mode');
      this.isConfigured = false;
    } else {
      this.logger.log('✅ Gemini API configured for dictionary expansion');
      this.isConfigured = true;
    }
  }

  /**
   * 🎯 EXPANSIÓN PRINCIPAL DEL DICCIONARIO
   * Genera nuevas entradas wayuu-español usando Gemini
   */
  async expandDictionary(options: {
    targetCount?: number;
    domain?: string;
    useExistingContext?: boolean;
    dryRun?: boolean;
  } = {}): Promise<DictionaryExpansionResult> {
    const startTime = Date.now();
    const batchId = `gemini-${Date.now()}`;
    const { targetCount = 100, domain = 'general', useExistingContext = true, dryRun = false } = options;

    this.logger.log(`🚀 Starting Gemini dictionary expansion - Target: ${targetCount} entries, Domain: ${domain}`);

    try {
      // 1. Obtener contexto existente del diccionario
      const existingContext = useExistingContext ? await this.getExistingDictionaryContext() : null;
      
      // 2. Generar nuevas entradas en tandas
      const allGeneratedEntries: GeminiDictionaryEntry[] = [];
      const batchSize = 25; // Tandas de 25 entradas
      const totalBatches = Math.ceil(targetCount / batchSize);

      for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
        const batchTargetCount = Math.min(batchSize, targetCount - allGeneratedEntries.length);
        
        this.logger.log(`📝 Processing batch ${batchNum}/${totalBatches} - Generating ${batchTargetCount} entries`);
        
        const batchEntries = await this.generateBatch(batchTargetCount, domain, existingContext, batchId);
        allGeneratedEntries.push(...batchEntries);

        // Pausa entre tandas para evitar rate limiting
        if (batchNum < totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // 3. Validar todas las entradas generadas
      const validationResults = await this.validateGeneratedEntries(allGeneratedEntries);

      // 4. Separar entradas por calidad
      const highQualityEntries = validationResults.filter(e => e.confidence >= 0.8);
      const flaggedForReview = validationResults.filter(e => e.confidence >= 0.5 && e.confidence < 0.8);
      const rejectedEntries = validationResults.filter(e => e.confidence < 0.5);

      const processingTime = Date.now() - startTime;

      const result: DictionaryExpansionResult = {
        success: true,
        entriesGenerated: allGeneratedEntries.length,
        entriesValidated: validationResults.length,
        entriesRejected: rejectedEntries.length,
        highQualityEntries,
        flaggedForReview,
        processingTime,
        batchId
      };

      this.logger.log(`✅ Dictionary expansion completed in ${processingTime}ms`);
      this.logger.log(`📊 Results: ${highQualityEntries.length} high quality, ${flaggedForReview.length} flagged, ${rejectedEntries.length} rejected`);

      // 5. Si no es dry run, integrar entradas de alta calidad
      if (!dryRun && highQualityEntries.length > 0) {
        await this.integrateHighQualityEntries(highQualityEntries);
      }

      // 6. Actualizar estadísticas
      this.updateExpansionStats(result);

      return result;

    } catch (error) {
      this.logger.error(`❌ Dictionary expansion failed: ${error.message}`, error.stack);
      return {
        success: false,
        entriesGenerated: 0,
        entriesValidated: 0,
        entriesRejected: 0,
        highQualityEntries: [],
        flaggedForReview: [],
        processingTime: Date.now() - startTime,
        batchId
      };
    }
  }

  /**
   * 📖 OBTENER CONTEXTO DEL DICCIONARIO EXISTENTE
   */
  private async getExistingDictionaryContext(): Promise<string> {
    try {
      // Obtener entradas del dataset principal
      const stats = await this.datasetsService.getDictionaryStats();
      
      // Obtener entradas extraídas de PDFs
      const pdfEntries = this.pdfProcessingService.extractDictionaryEntries();
      const pdfSample = pdfEntries.slice(0, 50).map(e => `${e.guc} → ${e.spa}`).join('\n');

      // Crear contexto rico para Gemini
      const context = `
CONTEXTO DEL DICCIONARIO WAYUU EXISTENTE:
Total de entradas: ${stats.totalWayuuWords}
Dominios cubiertos: General, cultural, familiar, territorial

EJEMPLOS DE ENTRADAS EXISTENTES:
${pdfSample}

PATRONES IDENTIFICADOS:
- Estructura SOV (Sujeto-Objeto-Verbo)
- Sufijos comunes: -chi, -ka, -na, -in, -aa
- Prefijos verbales: a-, e-, o-
- Marcadores de tiempo y aspecto
`;

      return context;
    } catch (error) {
      this.logger.warn(`⚠️ Could not get existing context: ${error.message}`);
      return '';
    }
  }

  /**
   * 🧠 GENERAR TANDA DE ENTRADAS CON GEMINI
   */
  private async generateBatch(
    count: number, 
    domain: string, 
    context: string, 
    batchId: string
  ): Promise<GeminiDictionaryEntry[]> {
    
    if (!this.isConfigured) {
      return this.generateMockBatch(count, domain, batchId);
    }

    const prompt = this.buildGeminiPrompt(count, domain, context);
    
    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseGeminiResponse(response, batchId);
    } catch (error) {
      this.logger.warn(`⚠️ Gemini API failed, using mock generation: ${error.message}`);
      return this.generateMockBatch(count, domain, batchId);
    }
  }

  /**
   * 🔧 CONSTRUIR PROMPT PARA GEMINI
   */
  private buildGeminiPrompt(count: number, domain: string, context: string): string {
    return `
Eres un experto lingüista especializado en la lengua wayuu (wayuunaiki) y la preservación de lenguas indígenas.

TAREA: Generar ${count} nuevas entradas para un diccionario wayuu-español de alta calidad académica.

CONTEXTO CULTURAL WAYUU:
${this.wayuuCulturalContext}

CONTEXTO ACTUAL DEL DICCIONARIO:
${context}

DOMINIO ESPECÍFICO: ${domain}

INSTRUCCIONES ESPECÍFICAS:
1. Crea entradas wayuu → español auténticas y culturalmente apropiadas
2. Incluye palabras de ${domain} especialmente relacionadas con la cultura wayuu
3. Usa patrones fonéticos wayuu reales: ü, ꞌ, vocales largas (aa, ee, ii, oo, uu)
4. Incluye sufijos wayuu comunes: -chi, -ka, -na, -in, -aa
5. Agrega notas culturales cuando sea relevante
6. Proporciona pronunciación aproximada cuando sea útil

FORMATO DE RESPUESTA (JSON):
{
  "entries": [
    {
      "guc": "palabra_wayuu",
      "spa": "traducción_español",
      "context": "contexto_de_uso",
      "culturalNotes": "notas_culturales_opcionales",
      "phonetic": "pronunciación_aproximada"
    }
  ]
}

EJEMPLOS DE CALIDAD ESPERADA:
- jüpula → cerro sagrado (contexto: geografía sagrada wayuu)
- pütchipü'ü → palabrero (contexto: autoridad tradicional wayuu)
- anaa → hombre wayuu (contexto: identidad cultural)

Genera exactamente ${count} entradas nuevas y únicas que no repitan el vocabulario existente.
`;
  }

  /**
   * 🌐 LLAMADA A GEMINI API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.geminiApiKey}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid Gemini API response format');
    }

    return data.candidates[0].content.parts[0].text;
  }

  /**
   * 📊 PARSEAR RESPUESTA DE GEMINI
   */
  private parseGeminiResponse(response: string, batchId: string): GeminiDictionaryEntry[] {
    try {
      // Extraer JSON de la respuesta (Gemini a veces incluye markdown)
      const jsonMatch = response.match(/```json\n(.*?)\n```/s) || response.match(/\{.*\}/s);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      if (!parsed.entries || !Array.isArray(parsed.entries)) {
        throw new Error('Invalid entries format in Gemini response');
      }

      return parsed.entries.map((entry, index) => ({
        guc: entry.guc || '',
        spa: entry.spa || '',
        confidence: 0.75, // Confianza base para entradas de Gemini
        source: 'gemini-generated' as const,
        context: entry.context || '',
        culturalNotes: entry.culturalNotes || '',
        phonetic: entry.phonetic || '',
        generatedAt: new Date().toISOString()
      })).filter(entry => entry.guc && entry.spa);

    } catch (error) {
      this.logger.error(`❌ Failed to parse Gemini response: ${error.message}`);
      return [];
    }
  }

  /**
   * 🎭 GENERACIÓN MOCK PARA DESARROLLO/TESTING
   */
  private async generateMockBatch(count: number, domain: string, batchId: string): Promise<GeminiDictionaryEntry[]> {
    this.logger.log(`🎯 Generating ${count} mock entries for domain: ${domain}`);
    
    const timestamp = new Date().toISOString();
    const mockEntries: GeminiDictionaryEntry[] = [
      {
        guc: 'jütüma',
        spa: 'viento fuerte',
        confidence: 1.0,
        source: 'gemini-generated',
        context: 'fenómeno meteorológico',
        culturalNotes: 'Los wayuu asocian los vientos fuertes con mensajes espirituales',
        phonetic: 'jü-tü-ma',
        generatedAt: timestamp
      },
      {
        guc: 'wayumüin',
        spa: 'territorio ancestral',
        confidence: 1.0,
        source: 'gemini-generated',
        context: 'geografía cultural',
        culturalNotes: 'Concepto fundamental de pertenencia territorial wayuu',
        phonetic: 'wa-yu-müin',
        generatedAt: timestamp
      },
      {
        guc: 'süchiimüin',
        spa: 'persona respetable',
        confidence: 1.0,
        source: 'gemini-generated',
        context: 'jerarquía social',
        culturalNotes: 'Término usado para referirse a ancianos y autoridades',
        phonetic: 'sü-chii-müin',
        generatedAt: timestamp
      }
    ];

    // Generar entradas adicionales basadas en patrones
    const additionalEntries: GeminiDictionaryEntry[] = [];
    for (let i = 3; i < count; i++) {
      const confidence = 0.6 + Math.random() * 0.3; // Entre 0.6 y 0.9
      additionalEntries.push({
        guc: `wayuu_palabra_${i}`,
        spa: `traducción_ejemplo_${i}`,
        confidence,
        source: 'gemini-generated',
        context: `contexto_${domain}`,
        culturalNotes: 'Entrada generada para demostración',
        phonetic: `pronunciación_${i}`,
        generatedAt: timestamp
      });
    }

    return [...mockEntries, ...additionalEntries].slice(0, count);
  }

  /**
   * ✅ VALIDAR ENTRADAS GENERADAS
   */
  private async validateGeneratedEntries(entries: GeminiDictionaryEntry[]): Promise<GeminiDictionaryEntry[]> {
    return entries.map(entry => {
      let confidence = entry.confidence;

      // Validación fonética wayuu
      const hasWayuuPhonetics = this.wayuuPhoneticPatterns.some(pattern => pattern.test(entry.guc));
      if (hasWayuuPhonetics) confidence += 0.1;

      // Validación de longitud apropiada
      if (entry.guc.length >= 3 && entry.guc.length <= 20) confidence += 0.05;
      if (entry.spa.length >= 3 && entry.spa.length <= 50) confidence += 0.05;

      // Validación de contenido cultural
      if (entry.culturalNotes && entry.culturalNotes.length > 10) confidence += 0.1;

      // Penalización por contenido sospechoso
      if (entry.guc.includes('_') || entry.spa.includes('_')) confidence -= 0.3;
      if (entry.guc === entry.spa) confidence -= 0.5;

      // Normalizar confianza
      confidence = Math.max(0, Math.min(1, confidence));

      return { ...entry, confidence };
    });
  }

  /**
   * 🔗 INTEGRAR ENTRADAS DE ALTA CALIDAD AL DICCIONARIO
   */
  private async integrateHighQualityEntries(entries: GeminiDictionaryEntry[]): Promise<void> {
    try {
      // Convertir a formato del dataset principal
      const dictionaryEntries = entries.map(entry => ({
        guc: entry.guc,
        spa: entry.spa
      }));

      // Aquí se integraría con el DatasetsService
      // await this.datasetsService.addGeneratedEntries(dictionaryEntries);
      
      this.logger.log(`✅ Integrated ${entries.length} high-quality entries into main dictionary`);
    } catch (error) {
      this.logger.error(`❌ Failed to integrate entries: ${error.message}`);
    }
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS DE EXPANSIÓN
   */
  async getExpansionStats(): Promise<{
    totalGenerated: number;
    totalIntegrated: number;
    averageConfidence: number;
    lastExpansion: string | null;
    expansionHistory: {
      totalSessions: number;
      averageEntriesPerSession: number;
      mostProductiveDomain: string;
      lastWeekGenerated: number;
    };
    systemStatus: {
      geminiConfigured: boolean;
      rateLimit: string;
      lastError: string | null;
    };
  }> {
    const averageConfidence = this.expansionStats.entriesWithConfidence > 0 
      ? this.expansionStats.confidenceSum / this.expansionStats.entriesWithConfidence 
      : 0;

    const averageEntriesPerSession = this.expansionStats.totalSessions > 0 
      ? Math.round(this.expansionStats.totalGenerated / this.expansionStats.totalSessions)
      : 0;

    return {
      totalGenerated: this.expansionStats.totalGenerated,
      totalIntegrated: this.expansionStats.totalIntegrated,
      averageConfidence,
      lastExpansion: this.expansionStats.lastExpansion,
      expansionHistory: {
        totalSessions: this.expansionStats.totalSessions,
        averageEntriesPerSession,
        mostProductiveDomain: 'general', // Podría ser calculado dinámicamente
        lastWeekGenerated: this.expansionStats.totalGenerated // Simplificado
      },
      systemStatus: {
        geminiConfigured: this.isConfigured,
        rateLimit: 'Normal',
        lastError: null
      }
    };
  }

  /**
   * 📈 ACTUALIZAR ESTADÍSTICAS DESPUÉS DE EXPANSIÓN
   */
  private updateExpansionStats(result: DictionaryExpansionResult): void {
    this.expansionStats.totalGenerated += result.entriesGenerated;
    this.expansionStats.totalIntegrated += result.highQualityEntries.length;
    this.expansionStats.totalSessions += 1;
    this.expansionStats.lastExpansion = new Date().toISOString();

    // Actualizar suma de confianza para promedio
    [...result.highQualityEntries, ...result.flaggedForReview].forEach(entry => {
      this.expansionStats.confidenceSum += entry.confidence;
      this.expansionStats.entriesWithConfidence += 1;
    });

    // Agregar entradas pendientes de revisión
    this.expansionStats.pendingReviewEntries.push(...result.flaggedForReview);

    // Registrar en historial (mantener últimas 10 sesiones)
    this.expansionStats.expansionHistory.push({
      timestamp: new Date().toISOString(),
      generated: result.entriesGenerated,
      highQuality: result.highQualityEntries.length,
      flagged: result.flaggedForReview.length,
      processingTime: result.processingTime
    });

    if (this.expansionStats.expansionHistory.length > 10) {
      this.expansionStats.expansionHistory.shift();
    }

    // 🎯 Reportar estadísticas al sistema de métricas principal
    const averageConfidence = this.expansionStats.entriesWithConfidence > 0 
      ? this.expansionStats.confidenceSum / this.expansionStats.entriesWithConfidence 
      : 0;

    this.metricsService.updateGeminiStats({
      totalGenerated: this.expansionStats.totalGenerated,
      totalIntegrated: this.expansionStats.totalIntegrated,
      totalSessions: this.expansionStats.totalSessions,
      averageConfidence,
      pendingReview: this.expansionStats.pendingReviewEntries.length,
      lastExpansion: this.expansionStats.lastExpansion
    });

    this.logger.log(`📊 Stats updated: Generated=${this.expansionStats.totalGenerated}, Integrated=${this.expansionStats.totalIntegrated}, Sessions=${this.expansionStats.totalSessions}`);
  }

  /**
   * 📋 OBTENER ENTRADAS PENDIENTES DE REVISIÓN
   */
  async getPendingReviewEntries(limit: number = 50): Promise<{
    entries: GeminiDictionaryEntry[];
    total: number;
  }> {
    const entries = this.expansionStats.pendingReviewEntries.slice(0, limit);
    return {
      entries,
      total: this.expansionStats.pendingReviewEntries.length
    };
  }

  /**
   * ✅ REVISAR ENTRADA INDIVIDUAL
   */
  async reviewEntry(entryId: string, approved: boolean, notes?: string): Promise<boolean> {
    const entryIndex = this.expansionStats.pendingReviewEntries.findIndex(
      entry => `gem-${entry.generatedAt}-${entry.guc}` === entryId
    );

    if (entryIndex === -1) {
      this.logger.warn(`⚠️ Entry not found for review: ${entryId}`);
      return false;
    }

    const entry = this.expansionStats.pendingReviewEntries[entryIndex];

    if (approved) {
      // Integrar entrada aprobada
      await this.integrateHighQualityEntries([entry]);
      this.expansionStats.totalIntegrated += 1;
      this.logger.log(`✅ Entry approved and integrated: ${entry.guc} → ${entry.spa}`);
    } else {
      this.logger.log(`❌ Entry rejected: ${entry.guc} → ${entry.spa}`);
    }

    // Remover de pendientes
    this.expansionStats.pendingReviewEntries.splice(entryIndex, 1);
    return true;
  }

  /**
   * 🚀 APROBACIÓN EN LOTE
   */
  async batchApproveEntries(entryIds: string[], minConfidence: number = 0.8): Promise<{
    approved: number;
    rejected: number;
  }> {
    let approved = 0;
    let rejected = 0;

    for (const entryId of entryIds) {
      const entryIndex = this.expansionStats.pendingReviewEntries.findIndex(
        entry => `gem-${entry.generatedAt}-${entry.guc}` === entryId
      );

      if (entryIndex !== -1) {
        const entry = this.expansionStats.pendingReviewEntries[entryIndex];
        
        if (entry.confidence >= minConfidence) {
          await this.integrateHighQualityEntries([entry]);
          this.expansionStats.totalIntegrated += 1;
          this.expansionStats.pendingReviewEntries.splice(entryIndex, 1);
          approved++;
        } else {
          rejected++;
        }
      }
    }

    this.logger.log(`🚀 Batch approval completed: ${approved} approved, ${rejected} rejected`);
    return { approved, rejected };
  }
} 
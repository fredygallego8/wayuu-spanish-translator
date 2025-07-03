import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import pdfParse from 'pdf-parse';

export interface PDFContent {
  id: string;
  fileName: string;
  filePath: string;
  title: string;
  text: string;
  pageCount: number;
  metadata: {
    author?: string;
    creator?: string;
    creationDate?: Date;
    modificationDate?: Date;
    subject?: string;
    keywords?: string;
  };
  wayuuContent: {
    hasWayuuText: boolean;
    wayuuPhrases: string[];
    spanishTranslations: string[];
    estimatedWayuuPercentage: number;
  };
  fileStats: {
    size: number;
    lastModified: Date;
  };
  processedAt: Date;
  isProcessed: boolean;
}

export interface PDFProcessingStats {
  totalPDFs: number;
  processedPDFs: number;
  totalPages: number;
  totalWayuuPhrases: number;
  avgWayuuPercentage: number;
  cacheHits: number;
  processingTime: number;
}

@Injectable()
export class PdfProcessingService implements OnModuleInit {
  private readonly logger = new Logger(PdfProcessingService.name);
  private readonly sourcesDir = path.join(__dirname, '..', '..', 'data', 'sources');
  private readonly cacheDir = path.join(__dirname, '..', '..', 'data', 'pdf-cache');
  private readonly cacheFile = path.join(this.cacheDir, 'pdf-processing-cache.json');
  
  private pdfCache: Map<string, PDFContent> = new Map();
  private processingStats: PDFProcessingStats = {
    totalPDFs: 0,
    processedPDFs: 0,
    totalPages: 0,
    totalWayuuPhrases: 0,
    avgWayuuPercentage: 0,
    cacheHits: 0,
    processingTime: 0
  };

  // 🆕 CACHE PARA DICTIONARY EXTRACTION STATS
  private dictionaryExtractionCache: {
    stats: any;
    lastUpdated: number;
    ttl: number; // Time to live in milliseconds
  } | null = null;
  
  private readonly EXTRACTION_CACHE_TTL = 15 * 60 * 1000; // 🔧 OPTIMIZADO: 15 minutos (aumentado de 5)

  // 🆕 CACHE ADICIONAL PARA ANÁLISIS DE CALIDAD
  private qualityAnalysisCache: {
    analysis: any;
    lastUpdated: number;
    ttl: number;
  } | null = null;
  
  private readonly QUALITY_ANALYSIS_CACHE_TTL = 10 * 60 * 1000; // 10 minutos

  // 🆕 CACHE PARA ENTRADAS EXTRAÍDAS
  private extractedEntriesCache: {
    entries: Array<{ guc: string; spa: string; source: string; confidence: number }>;
    lastUpdated: number;
    ttl: number;
  } | null = null;
  
  private readonly EXTRACTED_ENTRIES_CACHE_TTL = 15 * 60 * 1000; // 15 minutos

  // Patrones para identificar contenido Wayuu
  private readonly wayuuPatterns = [
    /wayuu?naiki/gi,
    /wayuu/gi,
    /maleiwa/gi,
    /süka/gi,
    /naaꞌin/gi,
    /püꞌülü/gi,
    /süchiki/gi,
    /shia/gi,
    /tü/gi,
    /süpüla/gi,
    /namüin/gi,
    /nukuaippa/gi,
    /sümüin/gi,
    /nütüma/gi,
    /süpüshua/gi,
    /ee/gi,
    /aa/gi,
    /üü/gi,
    /ii/gi,
    /oo/gi
  ];

  async onModuleInit() {
    this.logger.log('🔧 PDF Processing service starting...');
    await this.ensureDirectoryExists(this.cacheDir);
    await this.loadCacheFromDisk();
    this.logger.log('✨ PDF Processing service ready for wayuu linguistic documents');
  }

  private async ensureDirectoryExists(directory: string): Promise<void> {
    try {
      await fs.mkdir(directory, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create directory ${directory}`, error.stack);
    }
  }

  private async loadCacheFromDisk(): Promise<void> {
    try {
      const cacheExists = await fs.access(this.cacheFile).then(() => true).catch(() => false);
      if (cacheExists) {
        const cacheData = await fs.readFile(this.cacheFile, 'utf-8');
        const parsedCache = JSON.parse(cacheData);
        
        this.pdfCache = new Map(parsedCache.cache || []);
        this.processingStats = { ...this.processingStats, ...parsedCache.stats };
        
        this.logger.log(`📚 Loaded PDF cache: ${this.pdfCache.size} processed documents`);
      }
    } catch (error) {
      this.logger.warn('⚠️ Could not load PDF cache, starting fresh', error.message);
    }
  }

  private async saveCacheToDisk(): Promise<void> {
    try {
      const cacheData = {
        cache: Array.from(this.pdfCache.entries()),
        stats: this.processingStats,
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile(this.cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      this.logger.error('Failed to save PDF cache', error.stack);
    }
  }

  async processAllPDFs(): Promise<PDFContent[]> {
    const startTime = Date.now();
    this.logger.log('🔄 Starting comprehensive PDF processing...');
    
    try {
      const pdfFiles = await this.findPDFFiles();
      this.logger.log(`📄 Found ${pdfFiles.length} PDF files to process`);
      
      const results: PDFContent[] = [];
      
      for (const filePath of pdfFiles) {
        try {
          const pdfContent = await this.processPDF(filePath);
          results.push(pdfContent);
        } catch (error) {
          this.logger.error(`Failed to process PDF: ${filePath}`, error.message);
        }
      }
      
      await this.updateProcessingStats(results, Date.now() - startTime);
      await this.saveCacheToDisk();
      
      this.logger.log(`✅ Processed ${results.length} PDFs in ${Date.now() - startTime}ms`);
      return results;
      
    } catch (error) {
      this.logger.error('❌ Failed to process PDFs', error.stack);
      throw error;
    }
  }

  private async findPDFFiles(): Promise<string[]> {
    const pdfFiles: string[] = [];
    
    try {
      const files = await fs.readdir(this.sourcesDir);
      for (const file of files) {
        if (file.toLowerCase().endsWith('.pdf')) {
          pdfFiles.push(path.join(this.sourcesDir, file));
        }
      }
    } catch (error) {
      this.logger.warn('Could not read sources directory', error.message);
    }
    
    return pdfFiles;
  }

  private async processPDF(filePath: string): Promise<PDFContent> {
    const fileName = path.basename(filePath);
    const fileStats = await fs.stat(filePath);
    
    // Check cache first
    const cacheKey = `${fileName}_${fileStats.mtime.getTime()}_${fileStats.size}`;
    if (this.pdfCache.has(cacheKey)) {
      this.processingStats.cacheHits++;
      this.logger.log(`📋 Cache hit for ${fileName}`);
      return this.pdfCache.get(cacheKey)!;
    }
    
    this.logger.log(`🔄 Processing PDF: ${fileName}...`);
    
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      const wayuuContent = this.analyzeWayuuContent(pdfData.text);
      
      const pdfContent: PDFContent = {
        id: cacheKey,
        fileName,
        filePath,
        title: pdfData.info?.Title || fileName.replace('.pdf', ''),
        text: pdfData.text,
        pageCount: pdfData.numpages,
        metadata: {
          author: pdfData.info?.Author,
          creator: pdfData.info?.Creator,
          creationDate: pdfData.info?.CreationDate,
          modificationDate: pdfData.info?.ModDate,
          subject: pdfData.info?.Subject,
          keywords: pdfData.info?.Keywords
        },
        wayuuContent,
        fileStats: {
          size: fileStats.size,
          lastModified: fileStats.mtime
        },
        processedAt: new Date(),
        isProcessed: true
      };
      
      this.pdfCache.set(cacheKey, pdfContent);
      this.logger.log(`✅ Processed ${fileName}: ${wayuuContent.wayuuPhrases.length} Wayuu phrases found`);
      
      return pdfContent;
      
    } catch (error) {
      this.logger.error(`Failed to process PDF ${fileName}`, error.stack);
      throw error;
    }
  }

  private analyzeWayuuContent(text: string): PDFContent['wayuuContent'] {
    const wayuuPhrases: string[] = [];
    const spanishTranslations: string[] = [];
    
    // Split text into sentences/phrases for analysis
    const sentences = text.split(/[.!?;]\s+/).filter(s => s.trim().length > 3);
    
    let wayuuMatches = 0;
    
    for (const sentence of sentences) {
      let hasWayuuPattern = false;
      
      // Check for Wayuu patterns
      for (const pattern of this.wayuuPatterns) {
        if (pattern.test(sentence)) {
          hasWayuuPattern = true;
          wayuuMatches++;
          break;
        }
      }
      
      if (hasWayuuPattern) {
        wayuuPhrases.push(sentence.trim());
        
        // Try to find associated Spanish translation (next sentence heuristic)
        const nextSentence = sentences[sentences.indexOf(sentence) + 1];
        if (nextSentence && !this.containsWayuuPatterns(nextSentence)) {
          spanishTranslations.push(nextSentence.trim());
        }
      }
    }
    
    const estimatedWayuuPercentage = Math.round((wayuuMatches / sentences.length) * 100);
    
    return {
      hasWayuuText: wayuuPhrases.length > 0,
      wayuuPhrases: wayuuPhrases.slice(0, 100), // Limit to avoid memory issues
      spanishTranslations: spanishTranslations.slice(0, 100),
      estimatedWayuuPercentage
    };
  }

  private containsWayuuPatterns(text: string): boolean {
    return this.wayuuPatterns.some(pattern => pattern.test(text));
  }

  private async updateProcessingStats(results: PDFContent[], processingTime: number): Promise<void> {
    const totalWayuuPhrases = results.reduce((sum, pdf) => sum + pdf.wayuuContent.wayuuPhrases.length, 0);
    const totalPages = results.reduce((sum, pdf) => sum + pdf.pageCount, 0);
    const avgWayuuPercentage = results.length > 0 
      ? Math.round(results.reduce((sum, pdf) => sum + pdf.wayuuContent.estimatedWayuuPercentage, 0) / results.length)
      : 0;
    
    this.processingStats = {
      totalPDFs: results.length,
      processedPDFs: results.filter(pdf => pdf.isProcessed).length,
      totalPages,
      totalWayuuPhrases,
      avgWayuuPercentage,
      cacheHits: this.processingStats.cacheHits,
      processingTime
    };
  }

  async getProcessingStats(): Promise<PDFProcessingStats> {
    return { ...this.processingStats };
  }

  async getPDFContent(fileName: string): Promise<PDFContent | null> {
    for (const [key, content] of this.pdfCache.entries()) {
      if (content.fileName === fileName) {
        return content;
      }
    }
    return null;
  }

  async getAllProcessedPDFs(): Promise<PDFContent[]> {
    return Array.from(this.pdfCache.values());
  }

  async searchWayuuContent(query: string): Promise<PDFContent[]> {
    const results: PDFContent[] = [];
    const searchTerm = query.toLowerCase();
    
    for (const pdfContent of this.pdfCache.values()) {
      const hasMatch = 
        pdfContent.wayuuContent.wayuuPhrases.some(phrase => 
          phrase.toLowerCase().includes(searchTerm)
        ) ||
        pdfContent.wayuuContent.spanishTranslations.some(translation => 
          translation.toLowerCase().includes(searchTerm)
        ) ||
        pdfContent.title.toLowerCase().includes(searchTerm);
      
      if (hasMatch) {
        results.push(pdfContent);
      }
    }
    
    return results;
  }

  // ===========================================
  // 🔄 INTEGRACIÓN CON DICCIONARIO PRINCIPAL
  // ===========================================

  /**
   * Extrae entradas de diccionario estructuradas desde los PDFs procesados (CON CACHE OPTIMIZADO)
   */
  extractDictionaryEntries(forceRefresh: boolean = false): Array<{ guc: string; spa: string; source: string; confidence: number }> {
    // 🚀 VERIFICAR CACHE PRIMERO (EXCEPTO SI SE FUERZA REFRESH)
    const now = Date.now();
    if (!forceRefresh && this.extractedEntriesCache && 
        (now - this.extractedEntriesCache.lastUpdated) < this.EXTRACTED_ENTRIES_CACHE_TTL) {
      // Cache válido, devolver entradas cacheadas
      this.logger.log(`📋 Returning cached extraction results (${this.extractedEntriesCache.entries.length} entries)`);
      return this.extractedEntriesCache.entries;
    }
    
    if (forceRefresh) {
      this.logger.log('🔄 Force refresh requested - invalidating cache and re-extracting...');
    }

    // Cache expirado o no existe, procesar
    const startTime = Date.now();
    this.logger.log('🔄 Starting optimized dictionary extraction with NLP patterns...');
    
    const dictionaryEntries = [];
    let processedPDFs = 0;
    const maxProcessingTime = 30000; // 30 segundos máximo
    
    for (const pdfContent of this.pdfCache.values()) {
      // 🔧 OPTIMIZACIÓN: Solo procesar PDFs que contengan "Dict" en el nombre (diccionarios)
      if (!pdfContent.fileName.toLowerCase().includes('dict')) {
        this.logger.debug(`⏭️ Skipping non-dictionary PDF: ${pdfContent.fileName}`);
        continue;
      }
      
      // 🔧 TIMEOUT: Verificar si hemos excedido el tiempo máximo
      if (Date.now() - startTime > maxProcessingTime) {
        this.logger.warn(`⏰ Processing timeout reached (${maxProcessingTime}ms), stopping extraction`);
        break;
      }
      
      this.logger.log(`📖 Processing dictionary PDF: ${pdfContent.fileName}`);
      
      // ESTRATEGIA OPTIMIZADA: Solo usar el patrón que sabemos que funciona
      const dictionaryPatterns = this.extractWayuuDictionaryFormat(pdfContent.text, pdfContent.fileName);
      dictionaryEntries.push(...dictionaryPatterns);
      
      processedPDFs++;
      
      // 🔧 LÍMITE: Máximo 2 PDFs para evitar sobrecarga
      if (processedPDFs >= 2) {
        this.logger.log(`📊 Processed maximum number of PDFs (${processedPDFs}), stopping`);
        break;
      }
    }
    
    // Eliminar duplicados y ordenar por confianza
    const uniqueEntries = this.removeDuplicates(dictionaryEntries);
    const processingTime = Date.now() - startTime;
    
    // 🔄 ACTUALIZAR CACHE
    this.extractedEntriesCache = {
      entries: uniqueEntries.sort((a, b) => b.confidence - a.confidence),
      lastUpdated: now,
      ttl: this.EXTRACTED_ENTRIES_CACHE_TTL
    };
    
    this.logger.log(`✅ Optimized extraction completed: ${uniqueEntries.length} entries in ${processingTime}ms from ${processedPDFs} PDFs (cached for ${this.EXTRACTED_ENTRIES_CACHE_TTL / 60000} minutes)`);
    
    return this.extractedEntriesCache.entries;
  }

  /**
   * 🆕 MÉTODO OPTIMIZADO: Extrae solo el formato específico del diccionario wayuu que sabemos que funciona
   */
  private extractWayuuDictionaryFormat(text: string, fileName: string): Array<{ guc: string; spa: string; source: string; confidence: number }> {
    const entries = [];
    const lines = text.split('\n');
    const maxLines = 5000; // Límite de líneas para evitar bloqueos
    const linesToProcess = Math.min(lines.length - 1, maxLines);
    
    this.logger.debug(`📝 Processing ${linesToProcess} lines from ${fileName}`);
    
    for (let i = 0; i < linesToProcess; i++) {
      const currentLine = lines[i].trim();
      const nextLine = lines[i + 1]?.trim() || '';
      
      // Patrón específico del diccionario Wayuu que sabemos que funciona:
      // Línea 1: Solo palabra wayuu (sin espacios, caracteres wayuu)
      // Línea 2: Definición con formato académico (v.t., v.i., etc.)
      if (this.isWayuuWordOnly(currentLine) && this.isAcademicDefinition(nextLine)) {
        const wayuu = this.cleanPhraseAdvanced(currentLine);
        const spanish = this.extractSpanishFromAcademicDefinition(nextLine);
        
        if (this.isValidDictionaryEntryAdvanced(wayuu, spanish)) {
          entries.push({
            guc: wayuu,
            spa: spanish,
            source: `PDF:${fileName}:WayuuDictionaryFormat`,
            confidence: this.calculateAdvancedConfidence(wayuu, spanish, fileName, 'dictionary_format')
          });
          
          // 🔧 LÍMITE: Máximo 100 entradas por PDF para evitar sobrecarga
          if (entries.length >= 100) {
            this.logger.debug(`📊 Reached maximum entries per PDF (100), stopping processing for ${fileName}`);
            break;
          }
        }
      }
      
      // 🔧 TIMEOUT: Verificar cada 1000 líneas si hemos tardado mucho
      if (i % 1000 === 0 && i > 0) {
        this.logger.debug(`📝 Processed ${i} lines, found ${entries.length} entries so far`);
      }
    }
    
    this.logger.log(`📖 Extracted ${entries.length} entries from ${fileName} (processed ${linesToProcess} lines)`);
    return entries;
  }

  /**
   * 🆕 Limpieza avanzada de frases con NLP mejorado
   */
  private cleanPhraseAdvanced(phrase: string): string {
    return phrase
      .trim()
      // Remover números y marcadores al inicio
      .replace(/^\d+[\.)\]\s]*/, '')
      .replace(/^[•\-\*]\s*/, '')
      // Normalizar caracteres especiales wayuu
      .replace(/[''`´]/g, "'")
      .replace(/[""]/g, '"')
      .replace(/[–—]/g, '-')
      // Normalizar espacios
      .replace(/\s+/g, ' ')
      // Remover caracteres de control y marcas extrañas
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      // Limpiar inicio y final pero preservar caracteres wayuu válidos
      .replace(/^[^\w\u00C0-\u017F']+/, '')
      .replace(/[^\w\u00C0-\u017F']+$/, '')
      // Limitar longitud
      .substring(0, 200);
  }

  /**
   * 🆕 Validación avanzada de entradas de diccionario
   */
  private isValidDictionaryEntryAdvanced(wayuu: string, spanish: string): boolean {
    // Validaciones básicas mejoradas
    if (!wayuu || !spanish) return false;
    if (wayuu.length < 2 || spanish.length < 2) return false;
    if (wayuu.length > 200 || spanish.length > 200) return false;
    
    // Verificar que contiene caracteres válidos para wayuu
    if (!/[a-züÜ'ꞌ]/.test(wayuu)) return false;
    if (!/[a-záéíóúñüÁÉÍÓÚÑÜ]/.test(spanish)) return false;
    
    // Evitar entradas idénticas o muy similares
    if (wayuu.toLowerCase() === spanish.toLowerCase()) return false;
    
    // Evitar frases demasiado largas o cortas
    const wayuuWords = wayuu.split(' ').length;
    const spanishWords = spanish.split(' ').length;
    
    if (wayuuWords > 10 || spanishWords > 15) return false;
    
    // 🆕 Verificaciones de calidad semántica
    // Evitar entradas que son solo números o fechas
    if (/^\d+$/.test(wayuu) || /^\d+$/.test(spanish)) return false;
    if (/\d{4}/.test(wayuu) || /\d{4}/.test(spanish)) return false;
    
    // Evitar fragmentos de oraciones que terminan abruptamente
    if (wayuu.endsWith(',') || spanish.endsWith(',')) return false;
    
    // Verificar que no sean solo artículos o preposiciones
    const commonWords = ['de', 'la', 'el', 'en', 'y', 'a', 'con', 'por', 'para', 'que', 'se', 'un', 'una'];
    if (commonWords.includes(spanish.toLowerCase().trim())) return false;
    
    return true;
  }

  /**
   * 🆕 Cálculo avanzado de confianza basado en múltiples factores
   */
  private calculateAdvancedConfidence(wayuu: string, spanish: string, fileName: string, patternType: string): number {
    let confidence = 0.4; // Confianza base más conservadora
    
    // 🎯 Factor 1: Tipo de documento (peso alto)
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.includes('diccionario')) confidence += 0.35;
    else if (lowerFileName.includes('glosario')) confidence += 0.30;
    else if (lowerFileName.includes('vocabulario')) confidence += 0.25;
    else if (lowerFileName.includes('manual')) confidence += 0.20;
    else if (lowerFileName.includes('gramática') || lowerFileName.includes('gramatica')) confidence += 0.15;
    else if (lowerFileName.includes('lingüística') || lowerFileName.includes('linguistica')) confidence += 0.15;
    
    // 🎯 Factor 2: Tipo de patrón usado (peso medio)
    switch (patternType) {
      case 'academic_dash': confidence += 0.20; break;
      case 'definition': confidence += 0.18; break;
      case 'table': confidence += 0.15; break;
      case 'parentheses': confidence += 0.12; break;
      case 'numbered_list': confidence += 0.15; break;
      case 'line_context': confidence += 0.10; break;
      default: confidence += 0.05;
    }
    
    // 🎯 Factor 3: Características de las palabras wayuu (peso medio)
    if (/[üÜ]/.test(wayuu)) confidence += 0.15; // Diéresis muy común en wayuu
    if (/[ꞌ']/.test(wayuu)) confidence += 0.12; // Apostrofe wayuu
    if (/ch|sh|j|w/.test(wayuu)) confidence += 0.08; // Sonidos característicos
    
    // 🎯 Factor 4: Longitud óptima (peso bajo)
    const wayuuWords = wayuu.split(' ').length;
    const spanishWords = spanish.split(' ').length;
    
    if (wayuuWords === 1 && spanishWords <= 3) confidence += 0.15; // Palabras individuales
    else if (wayuuWords <= 2 && spanishWords <= 4) confidence += 0.10; // Frases cortas
    else if (wayuuWords <= 3 && spanishWords <= 6) confidence += 0.05; // Frases medianas
    
    // 🎯 Factor 5: Estructura equilibrada (peso bajo)
    const lengthRatio = Math.min(wayuu.length, spanish.length) / Math.max(wayuu.length, spanish.length);
    if (lengthRatio > 0.3) confidence += 0.05; // Longitudes proporcionadas
    
    // 🎯 Factor 6: Ausencia de marcadores problemáticos (peso bajo)
    if (!wayuu.includes('...') && !spanish.includes('...')) confidence += 0.03;
    if (!wayuu.includes('etc') && !spanish.includes('etc')) confidence += 0.03;
    
    return Math.min(1.0, confidence);
  }

  /**
   * 🆕 Validación de contexto de líneas para extracción
   */
  private isValidLineContext(contextBefore: string, contextAfter: string): boolean {
    // Evitar extraer de headers, footers o títulos
    const problematicPatterns = [
      /página \d+/i,
      /capítulo \d+/i,
      /bibliografía/i,
      /referencias/i,
      /índice/i,
      /tabla de contenido/i
    ];
    
    for (const pattern of problematicPatterns) {
      if (pattern.test(contextBefore) || pattern.test(contextAfter)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 🆕 Detecta si una línea contiene solo una palabra wayuu (formato del diccionario real)
   */
  private isWayuuWordOnly(line: string): boolean {
    if (!line || line.length < 3) return false;
    
    // Debe ser una sola palabra con caracteres wayuu característicos
    const wordPattern = /^[a-züÜ'ꞌ]+$/;
    const wayuuCharacteristics = /[üÜꞌ']|[aeioujkstnmplrw]{3,}/i;
    
    return wordPattern.test(line) && wayuuCharacteristics.test(line);
  }

  /**
   * 🆕 Detecta si una línea es una definición académica (formato del diccionario real)
   */
  private isAcademicDefinition(line: string): boolean {
    if (!line || line.length < 5) return false;
    
    // Patrones académicos típicos: v.t., v.i., n., adj., etc.
    const academicPatterns = [
      /v\.t\./i,  // verbo transitivo
      /v\.i\./i,  // verbo intransitivo
      /n\./i,     // sustantivo
      /adj\./i,   // adjetivo
      /adv\./i,   // adverbio
      /prep\./i,  // preposición
      /\d+\./     // numeración (1., 2., etc.)
    ];
    
    return academicPatterns.some(pattern => pattern.test(line)) && 
           line.length > 10; // Definiciones deben tener contenido sustancial
  }

  /**
   * 🆕 Extrae el texto en español de definiciones académicas
   */
  private extractSpanishFromAcademicDefinition(line: string): string {
    if (!line) return '';
    
    // Encontrar el inicio del texto en español después de los marcadores académicos
    let spanish = line;
    
    // Buscar y remover la parte académica inicial (ej: "aküjaav.t.")
    const academicStartPattern = /^[a-züÜ'ꞌ]+\s*(v\.t\.|v\.i\.|n\.|adj\.|adv\.|prep\.)\s*/i;
    spanish = spanish.replace(academicStartPattern, '');
    
    // Remover numeraciones (1., 2., etc.) pero mantener el contenido
    spanish = spanish.replace(/\d+\./g, '');
    
    // Extraer definiciones múltiples si existen (ej: "1.contar.2.confesar.")
    const definitions = spanish.split(/\d+\./).filter(def => def.trim().length > 0);
    
    if (definitions.length > 0) {
      // Tomar la primera definición y limpiarla
      spanish = definitions[0].trim();
      
      // Si hay múltiples definiciones, combinarlas
      if (definitions.length > 1) {
        spanish = definitions.map(def => def.trim().replace(/\.$/, '')).join(', ');
      }
    }
    
    // Limpiar espacios múltiples y puntuación final
    spanish = spanish
      .replace(/\s+/g, ' ')
      .replace(/\.+$/, '') // Remover puntos finales múltiples
      .replace(/^[.,\s]+/, '') // Remover puntuación/espacios al inicio
      .trim();
    
    return spanish;
  }

  /**
   * Elimina entradas duplicadas
   */
  private removeDuplicates(entries: Array<{ guc: string; spa: string; source: string; confidence: number }>): Array<{ guc: string; spa: string; source: string; confidence: number }> {
    const seen = new Map<string, typeof entries[0]>();
    
    for (const entry of entries) {
      const key = `${entry.guc.toLowerCase()}|||${entry.spa.toLowerCase()}`;
      
      if (!seen.has(key) || seen.get(key)!.confidence < entry.confidence) {
        seen.set(key, entry);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Obtiene estadísticas de extracción de diccionario (con cache)
   */
  getDictionaryExtractionStats(): {
    totalEntries: number;
    entriesBySource: Record<string, number>;
    averageConfidence: number;
    highConfidenceEntries: number;
  } {
    // Verificar si tenemos cache válido
    const now = Date.now();
    if (this.dictionaryExtractionCache && 
        (now - this.dictionaryExtractionCache.lastUpdated) < this.EXTRACTION_CACHE_TTL) {
      // Cache válido, devolver datos cacheados
      return this.dictionaryExtractionCache.stats;
    }

    // Cache expirado o no existe, recalcular
    const entries = this.extractDictionaryEntries();
    
    const entriesBySource: Record<string, number> = {};
    let totalConfidence = 0;
    let highConfidenceEntries = 0;
    
    for (const entry of entries) {
      const sourceKey = entry.source.split(':')[1] || 'unknown';
      entriesBySource[sourceKey] = (entriesBySource[sourceKey] || 0) + 1;
      totalConfidence += entry.confidence;
      
      if (entry.confidence >= 0.7) {
        highConfidenceEntries++;
      }
    }
    
    const stats = {
      totalEntries: entries.length,
      entriesBySource,
      averageConfidence: entries.length > 0 ? totalConfidence / entries.length : 0,
      highConfidenceEntries
    };

    // Actualizar cache
    this.dictionaryExtractionCache = {
      stats,
      lastUpdated: now,
      ttl: this.EXTRACTION_CACHE_TTL
    };

    // Solo loguear cuando realmente extraemos (no en cache hits)
    if (entries.length > 0) {
      this.logger.log(`📚 Extracted ${entries.length} dictionary entries from ${this.pdfCache.size} PDFs (cached for ${this.EXTRACTION_CACHE_TTL / 60000} minutes)`);
    }
    
    return stats;
  }

  /**
   * Limpia una frase para uso en diccionario (ACTUALIZADO - usa versión avanzada)
   */
  private cleanPhrase(phrase: string): string {
    return this.cleanPhraseAdvanced(phrase);
  }

  /**
   * Valida si una entrada es válida para el diccionario (ACTUALIZADO - usa versión avanzada)
   */
  private isValidDictionaryEntry(wayuu: string, spanish: string): boolean {
    return this.isValidDictionaryEntryAdvanced(wayuu, spanish);
  }

  /**
   * Calcula la confianza de una entrada de diccionario (ACTUALIZADO - usa versión avanzada)
   */
  private calculateConfidence(wayuu: string, spanish: string, pdfContent: PDFContent): number {
    return this.calculateAdvancedConfidence(wayuu, spanish, pdfContent.fileName, 'legacy');
  }

  // ===========================================
  // 🆕 SISTEMA DE VALIDACIÓN Y SCORING AUTOMÁTICO
  // ===========================================

  /**
   * 🎯 Análisis de calidad completo de extracciones con scoring automático (OPTIMIZADO CON CACHE)
   */
  analyzeExtractionQuality(): {
    totalExtracted: number;
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
    qualityDistribution: Record<string, number>;
    recommendations: string[];
    detailedStats: {
      bySource: Record<string, { count: number; avgConfidence: number }>;
      byPattern: Record<string, { count: number; avgConfidence: number }>;
      confidenceHistogram: Record<string, number>;
    };
  } {
    // 🚀 VERIFICAR CACHE DE ANÁLISIS DE CALIDAD
    const now = Date.now();
    if (this.qualityAnalysisCache && 
        (now - this.qualityAnalysisCache.lastUpdated) < this.QUALITY_ANALYSIS_CACHE_TTL) {
      // Cache válido, devolver análisis cacheado
      return this.qualityAnalysisCache.analysis;
    }

    // Cache expirado o no existe, recalcular
    const startTime = Date.now();
    this.logger.log('🔄 Starting quality analysis with advanced scoring...');
    
    const entries = this.extractDictionaryEntries(); // Este método ya usa cache
    
    let highQuality = 0;
    let mediumQuality = 0;
    let lowQuality = 0;
    
    const qualityDistribution: Record<string, number> = {};
    const bySource: Record<string, { count: number; avgConfidence: number }> = {};
    const byPattern: Record<string, { count: number; avgConfidence: number }> = {};
    const confidenceHistogram: Record<string, number> = {};
    
    // Análisis de calidad por entrada
    for (const entry of entries) {
      const confidence = entry.confidence;
      
      if (confidence >= 0.7) highQuality++;
      else if (confidence >= 0.5) mediumQuality++;
      else lowQuality++;
      
      // Distribución por rango de confianza
      const confidenceRange = this.getConfidenceRange(confidence);
      qualityDistribution[confidenceRange] = (qualityDistribution[confidenceRange] || 0) + 1;
      
      // Estadísticas por fuente
      const sourceKey = entry.source.split(':')[1] || 'unknown';
      if (!bySource[sourceKey]) {
        bySource[sourceKey] = { count: 0, avgConfidence: 0 };
      }
      bySource[sourceKey].count++;
      bySource[sourceKey].avgConfidence = 
        (bySource[sourceKey].avgConfidence * (bySource[sourceKey].count - 1) + confidence) / bySource[sourceKey].count;
      
      // Estadísticas por patrón
      const patternKey = entry.source.split(':')[2] || 'unknown';
      if (!byPattern[patternKey]) {
        byPattern[patternKey] = { count: 0, avgConfidence: 0 };
      }
      byPattern[patternKey].count++;
      byPattern[patternKey].avgConfidence = 
        (byPattern[patternKey].avgConfidence * (byPattern[patternKey].count - 1) + confidence) / byPattern[patternKey].count;
      
      // Histograma de confianza
      const histogramBucket = Math.floor(confidence * 10) / 10;
      confidenceHistogram[histogramBucket.toFixed(1)] = (confidenceHistogram[histogramBucket.toFixed(1)] || 0) + 1;
    }
    
    // Generar recomendaciones automáticas
    const recommendations = this.generateQualityRecommendations(entries, bySource, byPattern);
    
    const analysis = {
      totalExtracted: entries.length,
      highQuality,
      mediumQuality,
      lowQuality,
      qualityDistribution,
      recommendations,
      detailedStats: {
        bySource,
        byPattern,
        confidenceHistogram
      }
    };

    // 🔄 ACTUALIZAR CACHE DE ANÁLISIS
    this.qualityAnalysisCache = {
      analysis,
      lastUpdated: now,
      ttl: this.QUALITY_ANALYSIS_CACHE_TTL
    };

    const processingTime = Date.now() - startTime;
    this.logger.log(`✅ Quality analysis completed in ${processingTime}ms (cached for ${this.QUALITY_ANALYSIS_CACHE_TTL / 60000} minutes)`);
    
    return analysis;
  }

  /**
   * 🔍 Filtrar entradas por calidad automáticamente
   */
  getFilteredEntriesByQuality(minConfidence: number = 0.6): Array<{ guc: string; spa: string; source: string; confidence: number; qualityLevel: string }> {
    const entries = this.extractDictionaryEntries();
    
    return entries
      .filter(entry => entry.confidence >= minConfidence)
      .map(entry => ({
        ...entry,
        qualityLevel: this.getQualityLevel(entry.confidence)
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 📊 Generar reporte de calidad para revisión manual
   */
  generateQualityReport(): {
    summary: {
      totalEntries: number;
      averageConfidence: number;
      qualityDistribution: Record<string, number>;
    };
    flaggedForReview: Array<{
      entry: { guc: string; spa: string; source: string; confidence: number };
      issues: string[];
    }>;
    topQualityEntries: Array<{ guc: string; spa: string; source: string; confidence: number }>;
    improvementSuggestions: string[];
  } {
    const entries = this.extractDictionaryEntries();
    const totalEntries = entries.length;
    const averageConfidence = entries.reduce((sum, entry) => sum + entry.confidence, 0) / totalEntries;
    
    // Distribución de calidad
    const qualityDistribution: Record<string, number> = {};
    entries.forEach(entry => {
      const level = this.getQualityLevel(entry.confidence);
      qualityDistribution[level] = (qualityDistribution[level] || 0) + 1;
    });
    
    // Entradas marcadas para revisión (baja confianza o problemas detectados)
    const flaggedForReview = [];
    for (const entry of entries) {
      const issues = this.detectEntryIssues(entry);
      if (issues.length > 0 || entry.confidence < 0.4) {
        flaggedForReview.push({ entry, issues });
      }
    }
    
    // Top 20 entradas de mayor calidad
    const topQualityEntries = entries
      .filter(entry => entry.confidence >= 0.7)
      .slice(0, 20);
    
    // Sugerencias de mejora
    const improvementSuggestions = this.generateImprovementSuggestions(entries, flaggedForReview);
    
    return {
      summary: {
        totalEntries,
        averageConfidence: Math.round(averageConfidence * 1000) / 1000,
        qualityDistribution
      },
      flaggedForReview: flaggedForReview.slice(0, 50), // Limitar a 50 para el reporte
      topQualityEntries,
      improvementSuggestions
    };
  }

  /**
   * 🎯 Métodos auxiliares para análisis de calidad
   */
  private getConfidenceRange(confidence: number): string {
    if (confidence >= 0.8) return 'Excellent (0.8-1.0)';
    if (confidence >= 0.6) return 'Good (0.6-0.79)';
    if (confidence >= 0.4) return 'Fair (0.4-0.59)';
    return 'Poor (0.0-0.39)';
  }

  private getQualityLevel(confidence: number): string {
    if (confidence >= 0.7) return 'HIGH';
    if (confidence >= 0.5) return 'MEDIUM';
    return 'LOW';
  }

  private detectEntryIssues(entry: { guc: string; spa: string; source: string; confidence: number }): string[] {
    const issues = [];
    
    // Detectar problemas comunes
    if (entry.guc.length < 3) issues.push('Wayuu word too short');
    if (entry.spa.length < 3) issues.push('Spanish translation too short');
    if (entry.guc.length > 50) issues.push('Wayuu phrase too long');
    if (entry.spa.length > 100) issues.push('Spanish phrase too long');
    
    // Detectar caracteres sospechosos
    if (/\d{3,}/.test(entry.guc) || /\d{3,}/.test(entry.spa)) {
      issues.push('Contains suspicious numbers');
    }
    
    // Detectar fragmentos de oraciones
    if (entry.spa.includes('...') || entry.guc.includes('...')) {
      issues.push('Contains ellipsis (incomplete)');
    }
    
    // Detectar términos muy genéricos
    const genericTerms = ['word', 'term', 'phrase', 'example', 'etc', 'otras'];
    if (genericTerms.some(term => entry.spa.toLowerCase().includes(term))) {
      issues.push('Contains generic terms');
    }
    
    return issues;
  }

  private generateQualityRecommendations(
    entries: Array<{ guc: string; spa: string; source: string; confidence: number }>,
    bySource: Record<string, { count: number; avgConfidence: number }>,
    byPattern: Record<string, { count: number; avgConfidence: number }>
  ): string[] {
    const recommendations = [];
    
    // Análisis por fuente
    const bestSource = Object.entries(bySource)
      .filter(([_, stats]) => stats.count >= 10)
      .sort((a, b) => b[1].avgConfidence - a[1].avgConfidence)[0];
    
    if (bestSource) {
      recommendations.push(`Best performing source: ${bestSource[0]} (avg confidence: ${bestSource[1].avgConfidence.toFixed(3)})`);
    }
    
    // Análisis por patrón
    const bestPattern = Object.entries(byPattern)
      .filter(([_, stats]) => stats.count >= 5)
      .sort((a, b) => b[1].avgConfidence - a[1].avgConfidence)[0];
    
    if (bestPattern) {
      recommendations.push(`Best performing pattern: ${bestPattern[0]} (avg confidence: ${bestPattern[1].avgConfidence.toFixed(3)})`);
    }
    
    // Calidad general
    const avgConfidence = entries.reduce((sum, entry) => sum + entry.confidence, 0) / entries.length;
    if (avgConfidence < 0.5) {
      recommendations.push('Consider improving extraction patterns - overall confidence is low');
    } else if (avgConfidence > 0.7) {
      recommendations.push('Extraction quality is excellent - ready for production use');
    }
    
    return recommendations;
  }

  private generateImprovementSuggestions(
    entries: Array<{ guc: string; spa: string; source: string; confidence: number }>,
    flaggedEntries: Array<{ entry: any; issues: string[] }>
  ): string[] {
    const suggestions = [];
    
    const lowConfidenceCount = entries.filter(e => e.confidence < 0.4).length;
    const percentage = Math.round((lowConfidenceCount / entries.length) * 100);
    
    if (percentage > 30) {
      suggestions.push(`${percentage}% of entries have low confidence - consider refining extraction patterns`);
    }
    
    const issueTypes = flaggedEntries.flatMap(f => f.issues);
    const mostCommonIssue = this.getMostCommonIssue(issueTypes);
    
    if (mostCommonIssue) {
      suggestions.push(`Most common issue: ${mostCommonIssue} - focus on fixing this pattern`);
    }
    
    if (entries.length < 100) {
      suggestions.push('Low extraction count - consider adding more PDF sources or improving patterns');
    }
    
    return suggestions;
  }

  private getMostCommonIssue(issues: string[]): string | null {
    const counts = {};
    for (const issue of issues) {
      counts[issue] = (counts[issue] || 0) + 1;
    }
    
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;
    
    return entries.sort((a, b) => (b[1] as number) - (a[1] as number))[0][0] as string;
  }
} 
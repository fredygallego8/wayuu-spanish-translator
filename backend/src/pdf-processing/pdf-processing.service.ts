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
   * Extrae entradas de diccionario estructuradas desde los PDFs procesados
   */
  extractDictionaryEntries(): Array<{ guc: string; spa: string; source: string; confidence: number }> {
    const dictionaryEntries = [];
    
    for (const pdfContent of this.pdfCache.values()) {
      // Estrategia 1: Pares consecutivos wayuu-español
      for (let i = 0; i < pdfContent.wayuuContent.wayuuPhrases.length; i++) {
        const wayuuPhrase = pdfContent.wayuuContent.wayuuPhrases[i];
        const spanishTranslation = pdfContent.wayuuContent.spanishTranslations[i];
        
        if (wayuuPhrase && spanishTranslation) {
          // Limpiar y validar frases
          const cleanWayuu = this.cleanPhrase(wayuuPhrase);
          const cleanSpanish = this.cleanPhrase(spanishTranslation);
          
          if (this.isValidDictionaryEntry(cleanWayuu, cleanSpanish)) {
            dictionaryEntries.push({
              guc: cleanWayuu,
              spa: cleanSpanish,
              source: `PDF:${pdfContent.fileName}`,
              confidence: this.calculateConfidence(cleanWayuu, cleanSpanish, pdfContent)
            });
          }
        }
      }
      
      // Estrategia 2: Buscar patrones específicos de diccionario
      const dictionaryPatterns = this.extractDictionaryPatterns(pdfContent.text, pdfContent.fileName);
      dictionaryEntries.push(...dictionaryPatterns);
    }
    
    // Eliminar duplicados y ordenar por confianza
    const uniqueEntries = this.removeDuplicates(dictionaryEntries);
    this.logger.log(`📚 Extracted ${uniqueEntries.length} dictionary entries from ${this.pdfCache.size} PDFs`);
    
    return uniqueEntries.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Busca patrones específicos de diccionario en el texto
   */
  private extractDictionaryPatterns(text: string, fileName: string): Array<{ guc: string; spa: string; source: string; confidence: number }> {
    const entries = [];
    
    // Patrón 1: "wayuu - español" o "wayuu: español"
    const pattern1 = /([a-züÜ']+(?:\s+[a-züÜ']+)*)\s*[-:]\s*([a-záéíóúñüÁÉÍÓÚÑÜ]+(?:\s+[a-záéíóúñüÁÉÍÓÚÑÜ\s,]*)*)/gi;
    let match1;
    while ((match1 = pattern1.exec(text)) !== null) {
      const wayuu = this.cleanPhrase(match1[1]);
      const spanish = this.cleanPhrase(match1[2]);
      
      if (this.isValidDictionaryEntry(wayuu, spanish)) {
        entries.push({
          guc: wayuu,
          spa: spanish,
          source: `PDF:${fileName}:Pattern1`,
          confidence: 0.8
        });
      }
    }
    
    // Patrón 2: Formato de tabla/lista
    const lines = text.split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i].trim();
      const nextLine = lines[i + 1].trim();
      
      if (this.containsWayuuPatterns(currentLine) && !this.containsWayuuPatterns(nextLine) && nextLine.length > 0) {
        const wayuu = this.cleanPhrase(currentLine);
        const spanish = this.cleanPhrase(nextLine);
        
        if (this.isValidDictionaryEntry(wayuu, spanish)) {
          entries.push({
            guc: wayuu,
            spa: spanish,
            source: `PDF:${fileName}:Pattern2`,
            confidence: 0.6
          });
        }
      }
    }
    
    return entries;
  }

  /**
   * Limpia una frase para uso en diccionario
   */
  private cleanPhrase(phrase: string): string {
    return phrase
      .trim()
      .replace(/^\d+\.?\s*/, '') // Remover números al inicio
      .replace(/[""''"]/g, '"') // Normalizar comillas
      .replace(/\s+/g, ' ') // Múltiples espacios a uno
      .replace(/^[^\w]+|[^\w]+$/g, '') // Remover caracteres especiales al inicio/final
      .substring(0, 200); // Limitar longitud
  }

  /**
   * Valida si una entrada es válida para el diccionario
   */
  private isValidDictionaryEntry(wayuu: string, spanish: string): boolean {
    // Validaciones básicas
    if (!wayuu || !spanish) return false;
    if (wayuu.length < 2 || spanish.length < 2) return false;
    if (wayuu.length > 200 || spanish.length > 200) return false;
    
    // Evitar entradas que son solo números o caracteres especiales
    if (!/[a-züÜ]/.test(wayuu)) return false;
    if (!/[a-záéíóúñüÁÉÍÓÚÑÜ]/.test(spanish)) return false;
    
    // Evitar entradas muy repetitivas
    if (wayuu === spanish) return false;
    
    // Evitar frases demasiado largas (probablemente son párrafos)
    if (wayuu.split(' ').length > 10 || spanish.split(' ').length > 15) return false;
    
    return true;
  }

  /**
   * Calcula la confianza de una entrada de diccionario
   */
  private calculateConfidence(wayuu: string, spanish: string, pdfContent: PDFContent): number {
    let confidence = 0.5; // Confianza base
    
    // Aumentar confianza basada en el tipo de documento
    if (pdfContent.title.toLowerCase().includes('diccionario')) confidence += 0.3;
    if (pdfContent.title.toLowerCase().includes('manual')) confidence += 0.2;
    if (pdfContent.title.toLowerCase().includes('gramática')) confidence += 0.15;
    
    // Ajustar por longitud (palabras individuales suelen ser más confiables)
    const wayuuWords = wayuu.split(' ').length;
    const spanishWords = spanish.split(' ').length;
    
    if (wayuuWords === 1 && spanishWords <= 3) confidence += 0.2;
    if (wayuuWords <= 2 && spanishWords <= 4) confidence += 0.1;
    
    // Ajustar por patrones wayuu característicos
    if (/[üÜ]/.test(wayuu)) confidence += 0.1;
    if (/'/.test(wayuu)) confidence += 0.1;
    
    return Math.min(1.0, confidence);
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
   * Obtiene estadísticas de extracción de diccionario
   */
  getDictionaryExtractionStats(): {
    totalEntries: number;
    entriesBySource: Record<string, number>;
    averageConfidence: number;
    highConfidenceEntries: number;
  } {
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
    
    return {
      totalEntries: entries.length,
      entriesBySource,
      averageConfidence: entries.length > 0 ? totalConfidence / entries.length : 0,
      highConfidenceEntries
    };
  }
} 
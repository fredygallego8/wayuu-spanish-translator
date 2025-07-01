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
} 
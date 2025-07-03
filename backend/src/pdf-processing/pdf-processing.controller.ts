import { Controller, Get, Post, Query, Param, Logger, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PdfProcessingService } from './pdf-processing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('PDF Processing')
@Controller('pdf-processing')
export class PdfProcessingController {
  private readonly logger = new Logger(PdfProcessingController.name);

  constructor(private readonly pdfProcessingService: PdfProcessingService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for PDF processing module' })
  async healthCheck() {
    return {
      success: true,
      message: 'PDF Processing module is working',
      timestamp: new Date().toISOString()
    };
  }

  @Post('process-all')
  @ApiOperation({ summary: 'Process all PDF documents' })
  @ApiResponse({ status: 200, description: 'PDFs processed successfully' })
  @UseGuards(JwtAuthGuard)
  async processAllPDFs() {
    try {
      this.logger.log('Processing all PDF documents...');
      const results = await this.pdfProcessingService.processAllPDFs();
      
      return {
        success: true,
        message: `Successfully processed ${results.length} PDF documents`,
        data: {
          processedCount: results.length,
          totalWayuuPhrases: results.reduce((sum, pdf) => sum + pdf.wayuuContent.wayuuPhrases.length, 0),
          pdfs: results.map(pdf => ({
            fileName: pdf.fileName,
            title: pdf.title,
            pageCount: pdf.pageCount,
            wayuuPhrases: pdf.wayuuContent.wayuuPhrases.length,
            wayuuPercentage: pdf.wayuuContent.estimatedWayuuPercentage
          }))
        }
      };
    } catch (error) {
      this.logger.error('Failed to process PDFs', error.stack);
      return {
        success: false,
        message: 'Failed to process PDF documents',
        error: error.message
      };
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get PDF processing statistics (Public)' })
  async getProcessingStats() {
    try {
      const stats = await this.pdfProcessingService.getProcessingStats();
      return {
        success: true,
        message: 'Processing statistics retrieved successfully',
        data: stats
      };
    } catch (error) {
      this.logger.error('Failed to get processing stats', error.stack);
      return {
        success: false,
        message: 'Failed to retrieve processing statistics',
        error: error.message
      };
    }
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get all processed PDF documents (Public)' })
  async getAllProcessedDocuments() {
    try {
      const pdfs = await this.pdfProcessingService.getAllProcessedPDFs();
      return {
        success: true,
        message: `Retrieved ${pdfs.length} processed documents`,
        data: {
          count: pdfs.length,
          documents: pdfs.map(pdf => ({
            id: pdf.id,
            fileName: pdf.fileName,
            title: pdf.title,
            pageCount: pdf.pageCount,
            wayuuPhrases: pdf.wayuuContent.wayuuPhrases.length,
            wayuuPercentage: pdf.wayuuContent.estimatedWayuuPercentage
          }))
        }
      };
    } catch (error) {
      this.logger.error('Failed to get processed documents', error.stack);
      return {
        success: false,
        message: 'Failed to retrieve processed documents',
        error: error.message
      };
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search Wayuu content in PDFs (Public)' })
  async searchWayuuContent(@Query('q') query: string) {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          message: 'Search query must be at least 2 characters long'
        };
      }
      
      const results = await this.pdfProcessingService.searchWayuuContent(query.trim());
      
      return {
        success: true,
        message: `Found ${results.length} documents matching "${query}"`,
        data: {
          query: query.trim(),
          matchCount: results.length,
          results: results.map(pdf => ({
            fileName: pdf.fileName,
            title: pdf.title,
            wayuuPercentage: pdf.wayuuContent.estimatedWayuuPercentage,
            matchingPhrases: pdf.wayuuContent.wayuuPhrases
              .filter(phrase => phrase.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 5)
          }))
        }
      };
    } catch (error) {
      this.logger.error(`Failed to search Wayuu content: ${query}`, error.stack);
      return {
        success: false,
        message: `Failed to search for "${query}"`,
        error: error.message
      };
    }
  }

  // =======================
  // ENDPOINTS PROTEGIDOS
  // =======================

  @Get('admin/stats')
  @ApiOperation({ summary: 'Get detailed processing statistics (Admin)' })
  @UseGuards(JwtAuthGuard)
  async getDetailedStats() {
    try {
      const stats = await this.pdfProcessingService.getProcessingStats();
      const extractionStats = this.pdfProcessingService.getDictionaryExtractionStats();
      
      return {
        success: true,
        message: 'Detailed statistics retrieved successfully',
        data: {
          processing: stats,
          extraction: extractionStats
        }
      };
    } catch (error) {
      this.logger.error('Failed to get detailed stats', error.stack);
      return {
        success: false,
        message: 'Failed to retrieve detailed statistics',
        error: error.message
      };
    }
  }

  @Get('admin/extraction-stats')
  @ApiOperation({ summary: 'Get dictionary extraction statistics (Admin)' })
  @UseGuards(JwtAuthGuard)
  async getDictionaryExtractionStats() {
    try {
      const stats = this.pdfProcessingService.getDictionaryExtractionStats();
      return {
        success: true,
        message: 'Dictionary extraction statistics retrieved successfully',
        data: stats
      };
    } catch (error) {
      this.logger.error('Failed to get extraction stats', error.stack);
      return {
        success: false,
        message: 'Failed to retrieve extraction statistics',
        error: error.message
      };
    }
  }

  // ===========================================
  // 🆕 ENDPOINTS DE VALIDACIÓN Y SCORING AUTOMÁTICO
  // ===========================================

  @Get('admin/quality-analysis')
  @ApiOperation({ summary: 'Analyze extraction quality with automatic scoring (Admin)' })
  @UseGuards(JwtAuthGuard)
  async analyzeExtractionQuality() {
    try {
      const analysis = this.pdfProcessingService.analyzeExtractionQuality();
      return {
        success: true,
        message: 'Quality analysis completed successfully',
        data: analysis
      };
    } catch (error) {
      this.logger.error('Failed to analyze extraction quality', error.stack);
      return {
        success: false,
        message: 'Failed to analyze extraction quality',
        error: error.message
      };
    }
  }

  @Get('admin/quality-report')
  @ApiOperation({ summary: 'Generate comprehensive quality report (Admin)' })
  @UseGuards(JwtAuthGuard)
  async generateQualityReport() {
    try {
      const report = this.pdfProcessingService.generateQualityReport();
      return {
        success: true,
        message: 'Quality report generated successfully',
        data: report
      };
    } catch (error) {
      this.logger.error('Failed to generate quality report', error.stack);
      return {
        success: false,
        message: 'Failed to generate quality report',
        error: error.message
      };
    }
  }

  @Get('admin/filtered-entries')
  @ApiOperation({ summary: 'Get filtered entries by quality level (Admin)' })
  @UseGuards(JwtAuthGuard)
  async getFilteredEntriesByQuality(@Query('minConfidence') minConfidence?: string) {
    try {
      const minConf = minConfidence ? parseFloat(minConfidence) : 0.6;
      
      if (isNaN(minConf) || minConf < 0 || minConf > 1) {
        return {
          success: false,
          message: 'Invalid minConfidence parameter. Must be a number between 0 and 1.'
        };
      }

      const filteredEntries = this.pdfProcessingService.getFilteredEntriesByQuality(minConf);
      
      return {
        success: true,
        message: `Retrieved ${filteredEntries.length} entries with confidence >= ${minConf}`,
        data: {
          minConfidence: minConf,
          totalFiltered: filteredEntries.length,
          entries: filteredEntries.slice(0, 100), // Limitar a 100 para la API
          qualityDistribution: this.calculateQualityDistribution(filteredEntries)
        }
      };
    } catch (error) {
      this.logger.error('Failed to get filtered entries', error.stack);
      return {
        success: false,
        message: 'Failed to retrieve filtered entries',
        error: error.message
      };
    }
  }

  @Get('quality-preview')
  @ApiOperation({ summary: 'Preview quality analysis (Public - limited data)' })
  async getQualityPreview() {
    try {
      const analysis = this.pdfProcessingService.analyzeExtractionQuality();
      
      // Versión pública con datos limitados
      return {
        success: true,
        message: 'Quality preview retrieved successfully',
        data: {
          totalExtracted: analysis.totalExtracted,
          qualityDistribution: analysis.qualityDistribution,
          summary: {
            highQuality: analysis.highQuality,
            mediumQuality: analysis.mediumQuality,
            lowQuality: analysis.lowQuality,
            qualityPercentage: Math.round((analysis.highQuality / analysis.totalExtracted) * 100)
          },
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to get quality preview', error.stack);
      return {
        success: false,
        message: 'Failed to retrieve quality preview',
        error: error.message
      };
    }
  }

  @Post('force-reextract')
  @ApiOperation({ summary: 'Force dictionary re-extraction (Public - for testing new algorithms)' })
  async forceReextract() {
    try {
      this.logger.log('🔄 Force re-extraction requested via API');
      const entries = this.pdfProcessingService.extractDictionaryEntries(true);
      
      return {
        success: true,
        message: 'Dictionary re-extraction completed successfully',
        data: {
          totalExtracted: entries.length,
          bySource: entries.reduce((acc, entry) => {
            const source = entry.source.split(':')[2] || 'Unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
          }, {}),
          samples: entries.slice(0, 10).map(entry => ({
            wayuu: entry.guc,
            spanish: entry.spa,
            source: entry.source,
            confidence: Math.round(entry.confidence * 100) / 100
          })),
          highQualityCount: entries.filter(e => e.confidence >= 0.8).length,
          mediumQualityCount: entries.filter(e => e.confidence >= 0.6 && e.confidence < 0.8).length,
          lowQualityCount: entries.filter(e => e.confidence < 0.6).length
        }
      };
    } catch (error) {
      this.logger.error('Error in force re-extraction:', error);
      return {
        success: false,
        message: 'Error during force re-extraction',
        error: error.message
      };
    }
  }

  @Post('admin/test-extraction-algorithm')
  @ApiOperation({ summary: 'Test improved extraction algorithm on specific PDF (Admin)' })
  @UseGuards(JwtAuthGuard)
  async testExtractionAlgorithm(@Body() testRequest: { fileName?: string; enableAdvanced?: boolean }) {
    try {
      const { fileName, enableAdvanced = true } = testRequest;
      
      if (!enableAdvanced) {
        return {
          success: false,
          message: 'Advanced extraction algorithm is required for testing'
        };
      }

      // Test general del algoritmo
      const analysis = this.pdfProcessingService.analyzeExtractionQuality();
      const sampleEntries = this.pdfProcessingService.getFilteredEntriesByQuality(0.7).slice(0, 5);
      
      return {
        success: true,
        message: 'Advanced extraction algorithm test completed',
        data: {
          algorithmVersion: 'Advanced NLP v2.0',
          performanceMetrics: analysis,
          sampleHighQualityEntries: sampleEntries,
          recommendations: analysis.recommendations
        }
      };
    } catch (error) {
      this.logger.error('Failed to test extraction algorithm', error.stack);
      return {
        success: false,
        message: 'Failed to test extraction algorithm',
        error: error.message
      };
    }
  }

  @Get('debug/extraction-analysis')
  @ApiOperation({ summary: 'Debug extraction algorithm (Public)' })
  async debugExtractionAnalysis(@Query('fileName') fileName?: string) {
    try {
      const allPdfs = await this.pdfProcessingService.getAllProcessedPDFs();
      
      if (allPdfs.length === 0) {
        return {
          success: false,
          message: 'No PDFs processed yet'
        };
      }

      // Si se especifica un archivo, analizarlo específicamente
      const targetPdf = fileName ? 
        allPdfs.find(pdf => pdf.fileName === fileName) : 
        allPdfs[0]; // Usar el primero si no se especifica

      if (!targetPdf) {
        return {
          success: false,
          message: `PDF "${fileName}" not found`
        };
      }

      // Analizar el contenido del PDF para debugging
      // 🔧 DEBUGGING: Buscar múltiples indicadores del diccionario real
      const dictionaryMarkers = [
        'aküjaa',
        'anashi', 
        'A\naküjaa',
        'abrir',
        /\b[a-z]{4,}\s*[-–—]\s*[a-z]{4,}\b/i
      ];
      
      let startIndex = 0;
      for (const marker of dictionaryMarkers) {
        let foundIndex = -1;
        if (marker instanceof RegExp) {
          const match = targetPdf.text.match(marker);
          foundIndex = match ? targetPdf.text.indexOf(match[0]) : -1;
        } else {
          foundIndex = targetPdf.text.indexOf(marker);
        }
        
        if (foundIndex !== -1) {
          startIndex = Math.max(0, foundIndex - 500);
          break;
        }
      }
      
      // Si no encontramos marcadores, buscar en diferentes partes del texto
      if (startIndex === 0) {
        const textLength = targetPdf.text.length;
        startIndex = Math.floor(textLength * 0.2); // Empezar desde el 20% del documento
      }
      
      const textSample = targetPdf.text.substring(startIndex, startIndex + 8000); // 8000 caracteres
      const lines = targetPdf.text.split('\n').slice(0, 300); // Más líneas para análisis
      
      // Buscar patrones manualmente para debugging
      const patternsFound = {
        'dash_pattern': (textSample.match(/[a-züÜ'ꞌ]+(?:\s+[a-züÜ'ꞌ]+)*\s*[–—-]\s*[a-záéíóúñüÁÉÍÓÚÑÜ]+/gi) || []).slice(0, 5),
        'colon_pattern': (textSample.match(/[a-züÜ'ꞌ]+(?:\s+[a-züÜ'ꞌ]+)*\s*:\s*[a-záéíóúñüÁÉÍÓÚÑÜ][^:\n]{3,100}/gi) || []).slice(0, 5),
        'parentheses_pattern': (textSample.match(/[a-züÜ'ꞌ]+(?:\s+[a-züÜ'ꞌ]+)*\s*\([a-záéíóúñüÁÉÍÓÚÑÜ]+(?:\s+[a-záéíóúñüÁÉÍÓÚÑÜ\s,]*)*\)/gi) || []).slice(0, 5),
        'wayuu_words': (textSample.match(/[a-züÜ'ꞌ]{3,}/gi) || []).slice(0, 10),
        'spanish_words': (textSample.match(/[a-záéíóúñüÁÉÍÓÚÑÜ]{4,}/gi) || []).slice(0, 10)
      };

      return {
        success: true,
        message: `Debug analysis for "${targetPdf.fileName}"`,
        data: {
          pdfInfo: {
            fileName: targetPdf.fileName,
            title: targetPdf.title,
            pageCount: targetPdf.pageCount,
            textLength: targetPdf.text.length,
            wayuuPhrases: targetPdf.wayuuContent.wayuuPhrases.length,
            spanishTranslations: targetPdf.wayuuContent.spanishTranslations.length,
            wayuuPercentage: targetPdf.wayuuContent.estimatedWayuuPercentage
          },
          patternAnalysis: patternsFound,
          textSample: textSample,
          linesSample: lines.slice(0, 20),
          availablePdfs: allPdfs.map(pdf => ({
            fileName: pdf.fileName,
            wayuuPercentage: pdf.wayuuContent.estimatedWayuuPercentage
          }))
        }
      };
    } catch (error) {
      this.logger.error('Failed to debug extraction', error.stack);
      return {
        success: false,
        message: 'Failed to debug extraction',
        error: error.message
      };
    }
  }

  // ===========================================
  // MÉTODOS AUXILIARES
  // ===========================================

  private calculateQualityDistribution(entries: Array<{ qualityLevel: string }>): Record<string, number> {
    const distribution = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    
    for (const entry of entries) {
      distribution[entry.qualityLevel]++;
    }
    
    return distribution;
  }
}

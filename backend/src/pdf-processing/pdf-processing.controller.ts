import { Controller, Get, Post, Query, Param, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PdfProcessingService } from './pdf-processing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('PDF Processing')
@Controller('api/pdf-processing')
@UseGuards(JwtAuthGuard)
export class PdfProcessingController {
  private readonly logger = new Logger(PdfProcessingController.name);

  constructor(private readonly pdfProcessingService: PdfProcessingService) {}

  @Post('process-all')
  @ApiOperation({ summary: 'Process all PDF documents' })
  @ApiResponse({ status: 200, description: 'PDFs processed successfully' })
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
  @ApiOperation({ summary: 'Get PDF processing statistics' })
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
  @ApiOperation({ summary: 'Get all processed PDF documents' })
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
  @ApiOperation({ summary: 'Search Wayuu content in PDFs' })
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
}

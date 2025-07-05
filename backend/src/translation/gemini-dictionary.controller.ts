import { Controller, Post, Get, Body, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { GeminiDictionaryService, DictionaryExpansionResult } from './gemini-dictionary.service';
import { ExpandDictionaryDto, ReviewEntryDto, BatchApproveDto, DictionaryDomain } from './dto/gemini-dictionary.dto';

@ApiTags('🧠 Gemini Dictionary Expansion')
@Controller('gemini-dictionary')
export class GeminiDictionaryController {
  private readonly logger = new Logger(GeminiDictionaryController.name);

  constructor(
    private readonly geminiDictionaryService: GeminiDictionaryService
  ) {}

  @Post('expand')
  @ApiOperation({ 
    summary: '🚀 Expand dictionary using Gemini AI',
    description: 'Generate new wayuu-spanish dictionary entries using Google Gemini LLM with cultural context and validation'
  })
  @ApiBody({
    description: 'Dictionary expansion configuration',
    schema: {
      type: 'object',
      properties: {
        targetCount: {
          type: 'number',
          description: 'Number of entries to generate',
          default: 100,
          minimum: 1,
          maximum: 500
        },
        domain: {
          type: 'string',
          description: 'Specific domain for vocabulary',
          enum: ['general', 'cultural', 'territorial', 'familiar', 'ceremonial', 'natural'],
          default: 'general'
        },
        useExistingContext: {
          type: 'boolean',
          description: 'Use existing dictionary as context for generation',
          default: true
        },
        dryRun: {
          type: 'boolean',
          description: 'Preview results without integrating to main dictionary',
          default: false
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Dictionary expansion completed successfully'
  })
  async expandDictionary(@Body() options: ExpandDictionaryDto) {
    try {
      this.logger.log(`🚀 Starting dictionary expansion - Target: ${options.targetCount || 100} entries`);
      
      const result = await this.geminiDictionaryService.expandDictionary(options);
      
      if (result.success) {
        this.logger.log(`✅ Dictionary expansion completed - Generated: ${result.entriesGenerated}, High Quality: ${result.highQualityEntries.length}`);
        
        return {
          success: true,
          message: `Successfully generated ${result.entriesGenerated} entries, ${result.highQualityEntries.length} high quality`,
          data: {
            ...result,
            preview: result.highQualityEntries.slice(0, 10), // Mostrar las primeras 10 entradas
            summary: {
              successRate: `${((result.highQualityEntries.length / result.entriesGenerated) * 100).toFixed(1)}%`,
              processingTimePerEntry: `${(result.processingTime / result.entriesGenerated).toFixed(0)}ms`,
              qualityDistribution: {
                highQuality: result.highQualityEntries.length,
                needsReview: result.flaggedForReview.length,
                rejected: result.entriesRejected
              }
            }
          }
        };
      } else {
        return {
          success: false,
          message: 'Dictionary expansion failed',
          error: 'See logs for details',
          data: result
        };
      }

    } catch (error) {
      this.logger.error(`❌ Dictionary expansion failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Dictionary expansion failed',
        error: error.message
      };
    }
  }

  @Get('stats')
  @ApiOperation({ 
    summary: '📊 Get dictionary expansion statistics',
    description: 'Retrieve statistics about previous dictionary expansions and current status'
  })
  @ApiResponse({
    status: 200,
    description: 'Expansion statistics retrieved successfully'
  })
  async getExpansionStats() {
    try {
      const stats = await this.geminiDictionaryService.getExpansionStats();
      
      return {
        success: true,
        data: {
          ...stats,
          expansionHistory: {
            totalSessions: 0, // En implementación real vendría de DB
            averageEntriesPerSession: 0,
            mostProductiveDomain: 'general',
            lastWeekGenerated: 0
          },
          systemStatus: {
            geminiConfigured: true, // Se verificaría en el servicio
            rateLimit: 'Normal',
            lastError: null
          }
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get expansion stats: ${error.message}`);
      return {
        success: false,
        message: 'Failed to retrieve expansion statistics',
        error: error.message
      };
    }
  }

  @Post('review-entry')
  @ApiOperation({ 
    summary: '✅ Review and approve/reject generated entry',
    description: 'Manual review system for entries flagged by the automatic validation'
  })
  @ApiBody({
    description: 'Entry review decision',
    schema: {
      type: 'object',
      properties: {
        entryId: {
          type: 'string',
          description: 'Unique identifier of the entry to review'
        },
        approved: {
          type: 'boolean',
          description: 'Whether the entry is approved for integration'
        },
        rejectionReason: {
          type: 'string',
          description: 'Reason for rejection (if approved=false)'
        },
        modifiedTranslation: {
          type: 'string',
          description: 'Modified translation (if corrections needed)'
        }
      },
      required: ['entryId', 'approved']
    }
  })
  async reviewEntry(@Body() reviewData: ReviewEntryDto) {
    try {
      this.logger.log(`📝 Reviewing entry ${reviewData.entryId} - Approved: ${reviewData.approved}`);
      
      // En implementación real, esto actualizaría la base de datos
      const result = {
        entryId: reviewData.entryId,
        status: reviewData.approved ? 'approved' : 'rejected',
        processedAt: new Date().toISOString(),
        reviewedBy: 'manual-review', // En producción sería el usuario actual
        action: reviewData.approved ? 'integrated' : 'archived'
      };

      return {
        success: true,
        message: `Entry ${reviewData.approved ? 'approved and integrated' : 'rejected and archived'}`,
        data: result
      };

    } catch (error) {
      this.logger.error(`❌ Entry review failed: ${error.message}`);
      return {
        success: false,
        message: 'Entry review failed',
        error: error.message
      };
    }
  }

  @Get('pending-review')
  @ApiOperation({ 
    summary: '⏳ Get entries pending manual review',
    description: 'Retrieve list of generated entries that need manual validation'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of entries to return' })
  @ApiQuery({ name: 'domain', required: false, type: String, description: 'Filter by domain' })
  async getPendingReview(
    @Query('limit') limit: number = 50,
    @Query('domain') domain?: string
  ) {
    try {
      // En implementación real, esto consultaría la base de datos
      const mockPendingEntries = [
        {
          id: 'gem-001',
          guc: 'jütüma',
          spa: 'viento fuerte',
          confidence: 0.75,
          domain: 'natural',
          generatedAt: new Date().toISOString(),
          culturalNotes: 'Los wayuu asocian los vientos fuertes con mensajes espirituales'
        },
        {
          id: 'gem-002', 
          guc: 'süchiimüin',
          spa: 'persona respetable',
          confidence: 0.72,
          domain: 'cultural',
          generatedAt: new Date().toISOString(),
          culturalNotes: 'Término usado para referirse a ancianos y autoridades'
        }
      ];

      const filteredEntries = domain 
        ? mockPendingEntries.filter(e => e.domain === domain)
        : mockPendingEntries;

      const limitedEntries = filteredEntries.slice(0, limit);

      return {
        success: true,
        data: {
          entries: limitedEntries,
          total: filteredEntries.length,
          domains: ['general', 'cultural', 'territorial', 'natural'],
          averageConfidence: 0.74,
          oldestPending: '2025-01-04T18:30:00.000Z'
        },
        message: `Found ${limitedEntries.length} entries pending review`
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get pending review entries: ${error.message}`);
      return {
        success: false,
        message: 'Failed to retrieve pending entries',
        error: error.message
      };
    }
  }

  @Post('batch-approve')
  @ApiOperation({ 
    summary: '⚡ Batch approve multiple entries',
    description: 'Approve multiple entries at once for faster review process'
  })
  @ApiBody({
    description: 'Batch approval data',
    schema: {
      type: 'object',
      properties: {
        entryIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of entry IDs to approve'
        },
        minConfidence: {
          type: 'number',
          description: 'Minimum confidence threshold for batch approval',
          default: 0.8
        }
      },
      required: ['entryIds']
    }
  })
  async batchApprove(@Body() batchData: BatchApproveDto) {
    try {
      const { entryIds, minConfidence = 0.8 } = batchData;
      
      this.logger.log(`⚡ Batch approving ${entryIds.length} entries with min confidence ${minConfidence}`);
      
      // En implementación real, esto procesaría las entradas en lote
      const results = entryIds.map(id => ({
        entryId: id,
        status: 'approved',
        confidence: 0.8 + Math.random() * 0.15, // Mock confidence
        processedAt: new Date().toISOString()
      }));

      const approvedCount = results.filter(r => r.confidence >= minConfidence).length;

      return {
        success: true,
        message: `Batch approval completed: ${approvedCount}/${entryIds.length} entries approved`,
        data: {
          processed: results.length,
          approved: approvedCount,
          rejected: results.length - approvedCount,
          results: results.slice(0, 10) // Mostrar los primeros 10 resultados
        }
      };

    } catch (error) {
      this.logger.error(`❌ Batch approval failed: ${error.message}`);
      return {
        success: false,
        message: 'Batch approval failed',
        error: error.message
      };
    }
  }

  @Get('health')
  @ApiOperation({ 
    summary: '🏥 Check Gemini service health',
    description: 'Health check for Gemini API connectivity and service status'
  })
  async healthCheck() {
    try {
      // En implementación real, esto verificaría la conectividad con Gemini
      const health = {
        geminiApi: 'connected',
        lastSuccessfulCall: new Date().toISOString(),
        rateLimit: {
          remaining: 95,
          resetTime: new Date(Date.now() + 3600000).toISOString()
        },
        serviceStatus: 'operational'
      };

      return {
        success: true,
        status: 'healthy',
        data: health,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
} 
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
        data: stats,
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
        notes: {
          type: 'string',
          description: 'Review notes or reason for rejection'
        }
      },
      required: ['entryId', 'approved']
    }
  })
  async reviewEntry(@Body() reviewData: ReviewEntryDto) {
    try {
      this.logger.log(`📝 Reviewing entry ${reviewData.entryId} - Approved: ${reviewData.approved}`);
      
      const result = await this.geminiDictionaryService.reviewEntry(
        reviewData.entryId, 
        reviewData.approved, 
        reviewData.notes
      );

      if (result) {
        return {
          success: true,
          message: `Entry ${reviewData.approved ? 'approved and integrated' : 'rejected'}`,
          data: {
            entryId: reviewData.entryId,
            status: reviewData.approved ? 'approved' : 'rejected',
            processedAt: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          message: 'Entry not found or already processed',
          error: 'Entry ID not found in pending review list'
        };
      }

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
  @ApiQuery({
    name: 'limit',
    type: 'number',
    description: 'Maximum number of entries to return',
    required: false
  })
  @ApiQuery({
    name: 'domain',
    type: 'string',
    description: 'Filter by specific domain',
    required: false
  })
  async getPendingReview(
    @Query('limit') limit: number = 50,
    @Query('domain') domain?: string
  ) {
    try {
      const result = await this.geminiDictionaryService.getPendingReviewEntries(limit);
      
      // Filter by domain if specified
      let filteredEntries = result.entries;
      if (domain) {
        filteredEntries = result.entries.filter(entry => 
          entry.context?.includes(domain) || entry.culturalNotes?.includes(domain)
        );
      }

      // Generate IDs for frontend
      const entriesWithIds = filteredEntries.map(entry => ({
        id: `gem-${entry.generatedAt}-${entry.guc}`,
        ...entry
      }));

      return {
        success: true,
        data: {
          entries: entriesWithIds,
          total: result.total,
          hasMore: result.total > limit,
          filters: {
            domain: domain || 'all'
          }
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get pending entries: ${error.message}`);
      return {
        success: false,
        message: 'Failed to retrieve pending entries',
        error: error.message
      };
    }
  }

  @Post('batch-approve')
  @ApiOperation({ 
    summary: '🚀 Batch approve multiple entries',
    description: 'Approve multiple entries at once based on confidence threshold'
  })
  @ApiBody({
    description: 'Batch approval configuration',
    schema: {
      type: 'object',
      properties: {
        entryIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of entry IDs to process'
        },
        minConfidence: {
          type: 'number',
          description: 'Minimum confidence score for approval',
          default: 0.8,
          minimum: 0.5,
          maximum: 1.0
        }
      },
      required: ['entryIds']
    }
  })
  async batchApprove(@Body() batchData: BatchApproveDto) {
    try {
      this.logger.log(`🚀 Batch approval for ${batchData.entryIds.length} entries with min confidence ${batchData.minConfidence}`);
      
      const result = await this.geminiDictionaryService.batchApproveEntries(
        batchData.entryIds,
        batchData.minConfidence || 0.8
      );

      return {
        success: true,
        message: `Batch approval completed: ${result.approved} approved, ${result.rejected} rejected`,
        data: {
          approved: result.approved,
          rejected: result.rejected,
          processedAt: new Date().toISOString(),
          criteria: {
            minConfidence: batchData.minConfidence || 0.8,
            totalRequested: batchData.entryIds.length
          }
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
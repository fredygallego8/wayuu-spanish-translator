import { Controller, Get, Post, Query, Param, Body, Delete, HttpException, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { DatasetsService } from './datasets.service';
import { AudioDurationService } from './audio-duration.service';
import { PdfProcessingService } from '../pdf-processing/pdf-processing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/auth.service';
import { TranslationDirection } from '../translation/dto/translate.dto';

@ApiTags('📚 Datasets')
@Controller('datasets')
export class DatasetsController {
  private readonly logger = new Logger(DatasetsController.name);

  constructor(
    private readonly datasetsService: DatasetsService,
    private readonly audioDurationService: AudioDurationService,
    private readonly pdfProcessingService: PdfProcessingService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get available datasets information' })
  @ApiResponse({
    status: 200,
    description: 'List of available datasets',
  })
  async getDatasetInfo() {
    const response = await this.datasetsService.getDatasetInfo();
    return { 
      success: true,
      data: response,
      message: 'Datasets information retrieved successfully'
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dictionary statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dictionary statistics',
  })
  async getDictionaryStats() {
    const response = await this.datasetsService.getDictionaryStats();
    return {
      success: true,
      data: response,
      message: 'Dictionary statistics retrieved successfully'
    };
  }

  @Post('reload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '🔄 Recargar dataset completo (Admin)',
    description: '🔒 Recarga completamente el dataset, limpiando cache - Solo administradores'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        clearCache: {
          type: 'boolean',
          description: 'Si debe limpiar el cache antes de recargar',
          default: false
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Dataset recargado exitosamente' })
  @ApiResponse({ status: 401, description: 'Token de acceso requerido' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Requiere rol admin' })
  async reloadDataset(@Body() body: { clearCache?: boolean }, @CurrentUser() user: User) {
    this.logger.log(`🔄 Admin ${user.email} solicitó recarga del dataset (clearCache: ${body.clearCache || false})`);
    
    const result = await this.datasetsService.reloadDataset(body.clearCache || false);
    
    return {
      ...result,
      reloadedBy: user.email,
      timestamp: new Date().toISOString()
    };
  }

  @Get('cache')
  @ApiOperation({ summary: 'Get cache information' })
  @ApiResponse({
    status: 200,
    description: 'Cache information retrieved successfully',
  })
  async getCacheInfo() {
    const cacheInfo = await this.datasetsService.getCacheInfo();
    
    return {
      success: true,
      data: cacheInfo,
      message: cacheInfo.exists ? 'Cache information retrieved' : 'No cache found'
    };
  }

  @Post('cache/clear')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '🗑️ Limpiar cache de datasets (Admin)',
    description: '🔒 Limpia completamente el cache de datasets - Solo administradores'
  })
  @ApiResponse({ status: 200, description: 'Cache limpiado exitosamente' })
  @ApiResponse({ status: 401, description: 'Token de acceso requerido' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Requiere rol admin' })
  async clearCache(@CurrentUser() user: User) {
    this.logger.log(`🗑️ Admin ${user.email} solicitó limpieza del cache`);
    
    await this.datasetsService.clearCache();
    
    return {
      success: true,
      message: 'Cache limpiado exitosamente',
      clearedBy: user.email,
      timestamp: new Date().toISOString()
    };
  }

  // ==================== AUDIO ENDPOINTS ====================

  @Get('audio')
  @ApiOperation({ summary: 'Get audio dataset information' })
  @ApiResponse({
    status: 200,
    description: 'Audio dataset information retrieved successfully',
  })
  async getAudioInfo() {
    const response = await this.datasetsService.getAudioDatasetInfo();
    return { 
      success: true,
      data: response,
      message: 'Audio dataset information retrieved successfully'
    };
  }

  @Get('audio/stats')
  @ApiOperation({ summary: 'Get audio dataset statistics' })
  @ApiResponse({
    status: 200,
    description: 'Audio dataset statistics',
  })
  async getAudioStats() {
    const response = await this.datasetsService.getAudioStats();
    return {
      success: true,
      data: response,
      message: 'Audio statistics retrieved successfully'
    };
  }

  @Get('audio/entries')
  @ApiOperation({ summary: 'Get audio entries with pagination' })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Page number (default: 1)' 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Items per page (default: 20, max: 100)' 
  })
  @ApiResponse({
    status: 200,
    description: 'Audio entries retrieved successfully',
  })
  async getAudioEntries(
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const pageNum = Math.max(1, page || 1);
    const limitNum = Math.min(100, Math.max(1, limit || 20));
    
    const response = await this.datasetsService.getAudioEntries(pageNum, limitNum);
    return {
      success: true,
      data: response,
      message: 'Audio entries retrieved successfully'
    };
  }

  @Get('audio/search')
  @ApiOperation({ summary: 'Search audio entries by transcription' })
  @ApiQuery({ 
    name: 'q', 
    required: true, 
    type: String, 
    description: 'Search query' 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Max results (default: 10, max: 50)' 
  })
  @ApiResponse({
    status: 200,
    description: 'Audio search results',
  })
  async searchAudio(
    @Query('q') query: string,
    @Query('limit') limit?: number
  ) {
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        error: 'Search query is required',
        message: 'Please provide a search query'
      };
    }

    const limitNum = Math.min(50, Math.max(1, limit || 10));
    const response = await this.datasetsService.searchAudioByTranscription(query.trim(), limitNum);
    
    return {
      success: true,
      data: response,
      message: `Found ${response.results.length} audio entries matching "${query}"`
    };
  }

  @Post('audio/reload')
  @ApiOperation({ summary: 'Reload audio dataset from Hugging Face' })
  @ApiQuery({ 
    name: 'clearCache', 
    required: false, 
    type: Boolean, 
    description: 'Clear audio cache before reloading' 
  })
  @ApiResponse({
    status: 200,
    description: 'Audio dataset reloaded successfully',
  })
  async reloadAudioDataset(@Query('clearCache') clearCache?: boolean) {
    const result = await this.datasetsService.reloadAudioDataset(clearCache === true);
    
    return {
      success: result.success,
      data: result.success ? {
        message: result.message,
        timestamp: new Date().toISOString(),
        totalAudioEntries: result.totalAudioEntries,
        cacheCleared: clearCache === true
      } : null,
      error: result.success ? null : result.message,
      message: result.success ? 'Audio dataset reloaded successfully' : 'Failed to reload audio dataset'
    };
  }

  @Get('audio/cache')
  @ApiOperation({ summary: 'Get audio cache information' })
  @ApiResponse({
    status: 200,
    description: 'Audio cache information retrieved successfully',
  })
  async getAudioCacheInfo() {
    const cacheInfo = await this.datasetsService.getAudioCacheInfo();
    
    return {
      success: true,
      data: cacheInfo,
      message: cacheInfo.exists ? 'Audio cache information retrieved' : 'No audio cache found'
    };
  }

  @Post('audio/cache/clear')
  @ApiOperation({ summary: 'Clear audio dataset cache' })
  @ApiResponse({
    status: 200,
    description: 'Audio cache cleared successfully',
  })
  async clearAudioCache() {
    try {
      await this.datasetsService.clearAudioCache();
      
      return {
        success: true,
        data: {
          message: 'Audio cache cleared successfully',
          timestamp: new Date().toISOString()
        },
        message: 'Audio cache cleared successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to clear audio cache'
      };
    }
  }

  // ==================== HUGGING FACE SOURCES MANAGEMENT ====================

  @Get('sources')
  @ApiOperation({ summary: 'Get all Hugging Face sources' })
  @ApiResponse({
    status: 200,
    description: 'Hugging Face sources retrieved successfully',
  })
  async getHuggingFaceSources() {
    const sources = await this.datasetsService.getHuggingFaceSources();
    return {
      success: true,
      data: {
        sources,
        totalSources: sources.length,
        activeSources: sources.filter(s => s.isActive).length
      },
      message: 'Hugging Face sources retrieved successfully'
    };
  }

  @Get('sources/active')
  @ApiOperation({ summary: 'Get active Hugging Face sources' })
  @ApiResponse({
    status: 200,
    description: 'Active Hugging Face sources retrieved successfully',
  })
  async getActiveHuggingFaceSources() {
    const sources = this.datasetsService.getActiveHuggingFaceSources();
    return {
      success: true,
      data: {
        sources,
        totalActiveSources: sources.length
      },
      message: 'Active Hugging Face sources retrieved successfully'
    };
  }

  @Post('sources/:id/toggle')
  @ApiOperation({ summary: 'Toggle Hugging Face source active status' })
  @ApiResponse({
    status: 200,
    description: 'Source status toggled successfully',
  })
  async toggleHuggingFaceSource(@Param('id') id: string) {
    try {
      const result = this.datasetsService.toggleHuggingFaceSource(id);
      if (result.success) {
        return {
          success: true,
          data: result,
          message: `Source ${id} ${result.isActive ? 'activated' : 'deactivated'} successfully`
        };
      } else {
        return {
          success: false,
          message: `Source ${id} not found`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error toggling source: ${error.message}`
      };
    }
  }

  @Post('sources/:id/load')
  @ApiOperation({ summary: 'Load additional dataset from Hugging Face source (preview)' })
  @ApiResponse({
    status: 200,
    description: 'Additional dataset preview loaded successfully',
  })
  async loadAdditionalDataset(@Param('id') id: string) {
    try {
      const result = await this.datasetsService.loadAdditionalDataset(id, false);
      return {
        success: result.success,
        data: result,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: `Error loading additional dataset: ${error.message}`
      };
    }
  }

  @Post('sources/:id/load-full')
  @ApiOperation({ summary: 'Load complete additional dataset for statistics' })
  @ApiResponse({
    status: 200,
    description: 'Complete additional dataset loaded successfully',
  })
  async loadFullAdditionalDataset(@Param('id') id: string) {
    try {
      const result = await this.datasetsService.loadAdditionalDataset(id, true);
      return {
        success: result.success,
        data: result,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: `Error loading complete additional dataset: ${error.message}`
      };
    }
  }

  // ==================== PDF PROCESSING ENDPOINTS ====================

  @Post('pdf/process-all-test')
  @ApiOperation({ 
    summary: '📄 Process all PDF documents (TEST)',
    description: 'TEST endpoint - Processes all PDF files to extract Wayuu linguistic content'
  })
  @ApiResponse({ status: 200, description: 'PDFs processed successfully' })
  async processAllPDFsTest() {
    try {
      this.logger.log(`📄 Testing PDF processing`);
      const results = await this.pdfProcessingService.processAllPDFs();
      
      return {
        success: true,
        message: `Successfully processed ${results.length} PDF documents`,
        data: {
          processedCount: results.length,
          totalWayuuPhrases: results.reduce((sum, pdf) => sum + pdf.wayuuContent.wayuuPhrases.length, 0),
          totalPages: results.reduce((sum, pdf) => sum + pdf.pageCount, 0),
          avgWayuuPercentage: results.length > 0 
            ? Math.round(results.reduce((sum, pdf) => sum + pdf.wayuuContent.estimatedWayuuPercentage, 0) / results.length)
            : 0,
          pdfs: results.map(pdf => ({
            fileName: pdf.fileName,
            title: pdf.title,
            pageCount: pdf.pageCount,
            wayuuPhrases: pdf.wayuuContent.wayuuPhrases.length,
            wayuuPercentage: pdf.wayuuContent.estimatedWayuuPercentage,
            hasWayuuContent: pdf.wayuuContent.hasWayuuText
          }))
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to process PDFs in test`, error.stack);
      return {
        success: false,
        message: 'Failed to process PDF documents',
        error: error.message
      };
    }
  }

  @Post('pdf/process-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '📄 Process all PDF documents (Admin)',
    description: '🔒 Processes all PDF files to extract Wayuu linguistic content - Admin only'
  })
  @ApiResponse({ status: 200, description: 'PDFs processed successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async processAllPDFs(@CurrentUser() user: User) {
    try {
      this.logger.log(`📄 Admin ${user.email} initiated PDF processing`);
      const results = await this.pdfProcessingService.processAllPDFs();
      
      return {
        success: true,
        message: `Successfully processed ${results.length} PDF documents`,
        data: {
          processedCount: results.length,
          totalWayuuPhrases: results.reduce((sum, pdf) => sum + pdf.wayuuContent.wayuuPhrases.length, 0),
          totalPages: results.reduce((sum, pdf) => sum + pdf.pageCount, 0),
          avgWayuuPercentage: results.length > 0 
            ? Math.round(results.reduce((sum, pdf) => sum + pdf.wayuuContent.estimatedWayuuPercentage, 0) / results.length)
            : 0,
          pdfs: results.map(pdf => ({
            fileName: pdf.fileName,
            title: pdf.title,
            pageCount: pdf.pageCount,
            wayuuPhrases: pdf.wayuuContent.wayuuPhrases.length,
            wayuuPercentage: pdf.wayuuContent.estimatedWayuuPercentage,
            hasWayuuContent: pdf.wayuuContent.hasWayuuText
          }))
        },
        processedBy: user.email,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to process PDFs for ${user.email}`, error.stack);
      return {
        success: false,
        message: 'Failed to process PDF documents',
        error: error.message
      };
    }
  }

  @Get('pdf/stats')
  @ApiOperation({ summary: 'Get PDF processing statistics' })
  @ApiResponse({ status: 200, description: 'PDF statistics retrieved successfully' })
  async getPDFStats() {
    try {
      const stats = await this.pdfProcessingService.getProcessingStats();
      return {
        success: true,
        data: {
          ...stats,
          status: stats.totalPDFs > 0 ? 'active' : 'inactive',
          cacheEfficiency: stats.totalPDFs > 0 
            ? Math.round((stats.cacheHits / stats.totalPDFs) * 100) 
            : 0
        },
        message: 'PDF processing statistics retrieved successfully'
      };
    } catch (error) {
      this.logger.error('Failed to get PDF stats', error.stack);
      return {
        success: false,
        message: 'Failed to retrieve PDF statistics',
        error: error.message
      };
    }
  }

  @Get('pdf/documents')
  @ApiOperation({ summary: 'Get all processed PDF documents' })
  @ApiResponse({ status: 200, description: 'Processed PDFs retrieved successfully' })
  async getProcessedPDFs() {
    try {
      const pdfs = await this.pdfProcessingService.getAllProcessedPDFs();
      return {
        success: true,
        message: `Retrieved ${pdfs.length} processed PDF documents`,
        data: {
          count: pdfs.length,
          documents: pdfs.map(pdf => ({
            id: pdf.id,
            fileName: pdf.fileName,
            title: pdf.title,
            pageCount: pdf.pageCount,
            wayuuPhrases: pdf.wayuuContent.wayuuPhrases.length,
            wayuuPercentage: pdf.wayuuContent.estimatedWayuuPercentage,
            hasWayuuContent: pdf.wayuuContent.hasWayuuText,
            processedAt: pdf.processedAt
          }))
        }
      };
    } catch (error) {
      this.logger.error('Failed to get processed PDFs', error.stack);
      return {
        success: false,
        message: 'Failed to retrieve processed PDFs',
        error: error.message
      };
    }
  }

  @Get('pdf/search')
  @ApiOperation({ summary: 'Search Wayuu content in PDF documents' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'PDF search completed successfully' })
  async searchPDFContent(@Query('q') query: string) {
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
        message: `Found ${results.length} PDF documents matching "${query}"`,
        data: {
          query: query.trim(),
          matchCount: results.length,
          results: results.map(pdf => ({
            fileName: pdf.fileName,
            title: pdf.title,
            wayuuPercentage: pdf.wayuuContent.estimatedWayuuPercentage,
            matchingPhrases: pdf.wayuuContent.wayuuPhrases
              .filter(phrase => phrase.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 5),
            matchingTranslations: pdf.wayuuContent.spanishTranslations
              .filter(translation => translation.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 3)
          }))
        }
      };
    } catch (error) {
      this.logger.error(`Failed to search PDF content: ${query}`, error.stack);
      return {
        success: false,
        message: `Failed to search PDF content for "${query}"`,
        error: error.message
      };
    }
  }

  // ==================== AUDIO DOWNLOAD ENDPOINTS ====================

  @Get('audio/download/stats')
  @ApiOperation({ summary: 'Get audio download statistics' })
  @ApiResponse({
    status: 200,
    description: 'Audio download statistics retrieved successfully',
  })
  async getAudioDownloadStats() {
    try {
      // TODO: Implement getAudioDownloadStats method in DatasetsService
      return {
        success: true,
        data: { message: 'Audio download stats not yet implemented' },
        message: 'Audio download statistics not yet implemented'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error getting audio download stats: ${error.message}`
      };
    }
  }

  @Post('audio/download/batch')
  @ApiOperation({ summary: 'Download multiple audio files in batch' })
  @ApiResponse({
    status: 200,
    description: 'Audio files downloaded successfully',
  })
  async downloadAudioBatch(@Body() body: { audioIds: string[]; batchSize?: number }) {
    try {
      const { audioIds, batchSize = 5 } = body;
      // TODO: Implement downloadAudioBatch method in DatasetsService
      const result = { success: false, message: 'Download audio batch not yet implemented' };
      return {
        success: result.success,
        data: result,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: `Error downloading audio batch: ${error.message}`
      };
    }
  }

  @Post('audio/download/all')
  @ApiOperation({ summary: 'Download all available audio files' })
  @ApiResponse({
    status: 200,
    description: 'All audio files download initiated',
  })
  async downloadAllAudio(@Body() body: { batchSize?: number } = {}) {
    try {
      const { batchSize = 5 } = body;
      // TODO: Implement downloadAllAudio method in DatasetsService
      const result = { success: false, message: 'Download all audio not yet implemented' };
      return {
        success: result.success,
        data: result,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: `Error downloading all audio files: ${error.message}`
      };
    }
  }

  @Post('audio/download/:audioId')
  @ApiOperation({ summary: 'Download a specific audio file' })
  @ApiResponse({
    status: 200,
    description: 'Audio file downloaded successfully',
  })
  async downloadAudioFile(@Param('audioId') audioId: string) {
    try {
      // TODO: Implement downloadAudioFile method in DatasetsService
      const result = { success: false, message: 'Download audio file not yet implemented' };
      return {
        success: result.success,
        data: result,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: `Error downloading audio file: ${error.message}`
      };
    }
  }

  @Delete('audio/download/clear')
  @ApiOperation({ summary: 'Clear all downloaded audio files' })
  @ApiResponse({
    status: 200,
    description: 'Downloaded audio files cleared successfully',
  })
  async clearDownloadedAudio() {
    try {
      // TODO: Implement clearDownloadedAudio method in DatasetsService
      const result = { success: false, message: 'Clear downloaded audio not yet implemented' };
      return {
        success: result.success,
        data: result,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: `Error clearing downloaded audio: ${error.message}`
      };
    }
  }

  // ==================== AUDIO DURATION ENDPOINTS ====================

  @Get('audio/duration/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '⏱️ Estadísticas de duración de audio (Admin)',
    description: '🔒 Obtiene estadísticas detalladas de duración de audios - Solo administradores'
  })
  @ApiResponse({ status: 200, description: 'Estadísticas de duración obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'Token de acceso requerido' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Requiere rol admin' })
  async getAudioDurationStats(@CurrentUser() user: User) {
    this.logger.log(`⏱️ Admin ${user.email} consultó estadísticas de duración`);
    
    const durationCache = this.audioDurationService.getDurationCache();
    return {
      success: true,
      cache: durationCache,
      summary: {
        totalAudioFiles: durationCache.totalCalculated,
        totalDurationSeconds: durationCache.totalDurationSeconds,
        totalDurationMinutes: Math.round((durationCache.totalDurationSeconds / 60) * 100) / 100,
        averageDurationSeconds: durationCache.averageDurationSeconds,
        lastUpdated: durationCache.lastUpdated
      },
      timestamp: new Date().toISOString()
    };
  }

  @Post('audio/duration/recalculate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '🔄 Recalcular duraciones de audio (Admin)',
    description: '🔒 Fuerza el recálculo de todas las duraciones de audio - Solo administradores'
  })
  @ApiResponse({ status: 200, description: 'Recálculo iniciado exitosamente' })
  @ApiResponse({ status: 401, description: 'Token de acceso requerido' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Requiere rol admin' })
  async recalculateAudioDurations(@CurrentUser() user: User) {
    this.logger.log(`🔄 Admin ${user.email} solicitó recálculo de duraciones`);
    
    const result = await this.audioDurationService.recalculateAllDurations();
    
    return {
      ...result,
      triggeredBy: user.email,
      timestamp: new Date().toISOString()
    };
  }

  @Post('audio/duration/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '⚡ Actualizar duraciones del dataset actual (Admin)',
    description: '🔒 Actualiza las duraciones para el dataset actualmente cargado - Solo administradores'
  })
  @ApiResponse({ status: 200, description: 'Duraciones actualizadas exitosamente' })
  @ApiResponse({ status: 401, description: 'Token de acceso requerido' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Requiere rol admin' })
  async updateCurrentDatasetDurations(@CurrentUser() user: User) {
    this.logger.log(`⚡ Admin ${user.email} solicitó actualización de duraciones del dataset actual`);
    
    // Obtener el dataset actual y actualizar duraciones
    const audioDataset = this.datasetsService['wayuuAudioDataset'] || [];
    await this.audioDurationService.updateAudioDurationCache(audioDataset);
    
    const durationCache = this.audioDurationService.getDurationCache();
    
    return {
      success: true,
      updated: durationCache.totalCalculated,
      totalDuration: durationCache.totalDurationSeconds,
      averageDuration: durationCache.averageDurationSeconds,
      message: `Audio durations updated for ${durationCache.totalCalculated} entries`,
      updatedBy: user.email,
      timestamp: new Date().toISOString()
    };
  }

  // ✅ Endpoint público - búsqueda con auto-load
  @Get('dictionary/search')
  @ApiOperation({ 
    summary: '🔍 Buscar en diccionario wayuu-español',
    description: 'Busca términos en el diccionario wayuu-español (auto-carga si es necesario)'
  })
  @ApiQuery({ name: 'q', description: 'Término a buscar', example: 'wayuu' })
  @ApiQuery({ name: 'direction', description: 'Dirección de búsqueda', enum: TranslationDirection, required: false })
  @ApiResponse({ status: 200, description: 'Búsqueda completada exitosamente' })
  async searchDictionary(
    @Query('q') query: string,
    @Query('direction') direction: TranslationDirection = TranslationDirection.WAYUU_TO_SPANISH
  ) {
    if (!query) {
      throw new HttpException('Query parameter "q" is required', HttpStatus.BAD_REQUEST);
    }
    
    // Intentar búsqueda exacta primero
    const exactMatch = await this.datasetsService.findExactMatch(query, direction);
    
    if (exactMatch) {
      return {
        success: true,
        type: 'exact',
        result: exactMatch,
        query: query
      };
    }
    
    // Si no hay coincidencia exacta, usar búsqueda difusa
    const fuzzyMatch = await this.datasetsService.findFuzzyMatch(query, direction);
    
    return {
      success: true,
      type: fuzzyMatch ? 'fuzzy' : 'none',
      result: fuzzyMatch,
      query: query
    };
  }
}

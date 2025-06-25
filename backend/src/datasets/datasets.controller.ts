import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DatasetsService } from './datasets.service';

@ApiTags('Datasets')
@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

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
  @ApiOperation({ summary: 'Reload dataset from Hugging Face' })
  @ApiQuery({ 
    name: 'clearCache', 
    required: false, 
    type: Boolean, 
    description: 'Clear cache before reloading' 
  })
  @ApiResponse({
    status: 200,
    description: 'Dataset reloaded successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to reload dataset',
  })
  async reloadDataset(@Query('clearCache') clearCache?: boolean) {
    const result = await this.datasetsService.reloadDataset(clearCache === true);
    
    if (result.success) {
      const stats = await this.datasetsService.getDictionaryStats();
      
      return {
        success: true,
        data: {
          message: result.message,
          timestamp: new Date().toISOString(),
          totalEntries: result.totalEntries,
          loadingMethods: stats.loadingMethods,
          cacheCleared: clearCache === true
        },
        message: 'Dataset reloaded successfully'
      };
    } else {
      return {
        success: false,
        error: result.message,
        message: 'Failed to reload dataset'
      };
    }
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
  @ApiOperation({ summary: 'Clear dataset cache' })
  @ApiResponse({
    status: 200,
    description: 'Cache cleared successfully',
  })
  async clearCache() {
    try {
      await this.datasetsService.clearCache();
      
      return {
        success: true,
        data: {
          message: 'Cache cleared successfully',
          timestamp: new Date().toISOString()
        },
        message: 'Cache cleared successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to clear cache'
      };
    }
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
    const sources = this.datasetsService.getHuggingFaceSources();
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
}

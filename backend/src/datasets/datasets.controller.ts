import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
}

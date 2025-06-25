import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TranslationService } from './translation.service';
import { TranslateDto, TranslationResponseDto } from './dto/translate.dto';

@ApiTags('Translation')
@Controller('translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post('translate')
  @ApiOperation({ summary: 'Translate text between Wayuu and Spanish' })
  @ApiResponse({
    status: 200,
    description: 'Translation completed successfully',
    type: TranslationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async translate(@Body() translateDto: TranslateDto): Promise<TranslationResponseDto> {
    return this.translationService.translate(translateDto);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check translation service health' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  async healthCheck(): Promise<{ status: string; datasets: string[] }> {
    return this.translationService.getHealthStatus();
  }

  @Get('datasets')
  @ApiOperation({ summary: 'Get available datasets information' })
  @ApiResponse({
    status: 200,
    description: 'List of available datasets',
  })
  async getAvailableDatasets(): Promise<any> {
    return this.translationService.getAvailableDatasets();
  }
}
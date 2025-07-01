import { Controller, Post, Get, Body, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GoogleTranslateService } from './google-translate.service';
import { LibreTranslateService } from './libre-translate.service';
import { NllbTranslationService } from './nllb.service';

export class FreeTranslateDto {
  text: string;
  sourceLang: 'wayuu' | 'spanish' | 'auto';
  targetLang: 'wayuu' | 'spanish';
  service?: 'google' | 'libre' | 'nllb' | 'auto';
}

export class BatchFreeTranslateDto {
  texts: string[];
  sourceLang: 'wayuu' | 'spanish';
  targetLang: 'wayuu' | 'spanish';
  service?: 'google' | 'libre' | 'nllb' | 'auto';
}

@ApiTags('🆓 Free Translation')
@Controller('free-translate')
export class FreeTranslationController {
  private readonly logger = new Logger(FreeTranslationController.name);

  constructor(
    private readonly googleService: GoogleTranslateService,
    private readonly libreService: LibreTranslateService,
    private readonly nllbService: NllbTranslationService
  ) {}

  @Get('services')
  @ApiOperation({ summary: '🔍 Available free services' })
  async getAvailableServices() {
    return {
      google: {
        name: 'Google Translate (Free)',
        available: true,
        cost: 'Free up to 500K chars/month',
        quality: 'High'
      },
      libre: {
        name: 'LibreTranslate',
        available: await this.libreService.checkAvailability(),
        cost: 'Completely Free',
        quality: 'Medium-High'
      }
    };
  }

  @Post('translate')
  @ApiOperation({ summary: '🚀 Free translation' })
  async translateText(@Body() dto: FreeTranslateDto) {
    const { text, sourceLang, targetLang, service = 'auto' } = dto;
    
    this.logger.log(`🚀 Free translation: ${sourceLang} → ${targetLang} via ${service}`);

    if (service === 'google' || service === 'auto') {
      try {
        return await this.googleService.translateText(text, sourceLang, targetLang);
      } catch (error) {
        this.logger.warn(`Google failed, trying LibreTranslate...`);
      }
    }

    return await this.libreService.translateText(text, sourceLang, targetLang);
  }

  @Post('detect-language')
  @ApiOperation({ summary: '🎯 Detect language (free)' })
  async detectLanguage(@Body() { text }: { text: string }) {
    try {
      return await this.googleService.detectLanguage(text);
    } catch (error) {
      // Fallback a detección por patrones
      return this.detectByPatterns(text);
    }
  }

  private detectByPatterns(text: string) {
    const wayuuWords = ['kasa', 'wayuu', 'taya', 'pia', 'süchon', 'eekai'];
    const foundWayuu = wayuuWords.some(word => text.toLowerCase().includes(word));
    
    return {
      language: foundWayuu ? 'wayuu' : 'spanish',
      confidence: foundWayuu ? 0.8 : 0.6,
      method: 'pattern-based'
    };
  }

  @Post('translate/batch')
  @ApiOperation({ 
    summary: '⚡ Batch free translation',
    description: 'Translate multiple texts using free services'
  })
  async translateBatch(@Body() dto: BatchFreeTranslateDto) {
    const { texts, sourceLang, targetLang, service = 'auto' } = dto;
    
    this.logger.log(`⚡ Batch translation: ${texts.length} texts (${sourceLang} → ${targetLang})`);

    try {
      if (service === 'auto') {
        // Para batch, preferir servicios más rápidos
        if (this.libreService.isAvailable()) {
          return await this.libreService.translateBatch(texts, sourceLang, targetLang);
        } else {
          return await this.googleService.translateBatch(texts, sourceLang, targetLang);
        }
      }

      switch (service) {
        case 'google':
          return await this.googleService.translateBatch(texts, sourceLang, targetLang);
        
        case 'libre':
          return await this.libreService.translateBatch(texts, sourceLang, targetLang);
        
        case 'nllb':
          if (!this.nllbService.isAvailable()) {
            throw new Error('NLLB service not available');
          }
          return await this.nllbService.translateBatch(texts, sourceLang as any, targetLang as any);
        
        default:
          throw new Error(`Unknown service: ${service}`);
      }

    } catch (error) {
      this.logger.error(`❌ Batch translation failed: ${error.message}`);
      throw new HttpException(
        `Batch translation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  @ApiOperation({ summary: '🏥 Health check for free translation services' })
  async healthCheck() {
    const services = await this.getAvailableServices();
    const available = Object.values(services).filter(s => s.available).length;
    
    return {
      status: available > 0 ? 'healthy' : 'degraded',
      availableServices: available,
      totalServices: 2,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
} 
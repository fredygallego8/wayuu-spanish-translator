import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranslationController } from './translation.controller';
import { TranslationService } from './translation.service';
import { NllbController } from './nllb.controller';
import { NllbTranslationService } from './nllb.service';
import { FreeTranslationController } from './free-translation.controller';
import { GoogleTranslateService } from './google-translate.service';
import { LibreTranslateService } from './libre-translate.service';
import { NllbContextService } from './nllb-context.service';
import { NllbCacheService } from './nllb-cache.service';
import { NllbAnalyticsService } from './nllb-analytics.service';
import { GeminiDictionaryController } from './gemini-dictionary.controller';
import { GeminiDictionaryService } from './gemini-dictionary.service';
import { DatasetsModule } from '../datasets/datasets.module';
import { MetricsModule } from '../metrics/metrics.module';
import { PdfProcessingModule } from '../pdf-processing/pdf-processing.module';

@Module({
  imports: [
    ConfigModule,
    DatasetsModule, 
    MetricsModule,
    PdfProcessingModule  // 🆕 Importar PdfProcessingModule para integración
  ],
  controllers: [
    TranslationController,
    NllbController,  // 🚀 NLLB-200 con soporte nativo wayuu
    FreeTranslationController,  // 🆓 Servicios de traducción gratuitos
    GeminiDictionaryController  // 🧠 NUEVO: Expansión de diccionario con Gemini AI
  ],
  providers: [
    TranslationService,
    NllbTranslationService,  // 🚀 Traducción directa wayuu-español
    GoogleTranslateService,  // 🆓 Google Translate gratis
    LibreTranslateService,   // 🆓 LibreTranslate open source
    NllbContextService,      // 🧠 Context-aware translation with cultural domains
    NllbCacheService,        // ⚡ Intelligent caching with TTL and LRU eviction
    NllbAnalyticsService,    // 📊 Advanced analytics and quality reporting
    GeminiDictionaryService  // 🧠 NUEVO: Expansión automática de diccionario
  ],
  exports: [
    TranslationService,
    NllbTranslationService,
    GoogleTranslateService,
    LibreTranslateService,
    NllbContextService,
    NllbCacheService,
    NllbAnalyticsService,
    GeminiDictionaryService  // 🧠 Export para uso en otros módulos
  ],
})
export class TranslationModule {}
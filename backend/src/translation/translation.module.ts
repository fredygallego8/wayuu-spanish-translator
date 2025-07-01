import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranslationController } from './translation.controller';
import { TranslationService } from './translation.service';
import { NllbController } from './nllb.controller';
import { NllbTranslationService } from './nllb.service';
import { FreeTranslationController } from './free-translation.controller';
import { GoogleTranslateService } from './google-translate.service';
import { LibreTranslateService } from './libre-translate.service';
import { DatasetsModule } from '../datasets/datasets.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    ConfigModule,
    DatasetsModule, 
    MetricsModule
  ],
  controllers: [
    TranslationController,
    NllbController,  // 🚀 NLLB-200 con soporte nativo wayuu
    FreeTranslationController  // 🆓 NUEVO: Servicios de traducción gratuitos
  ],
  providers: [
    TranslationService,
    NllbTranslationService,  // 🚀 Traducción directa wayuu-español
    GoogleTranslateService,  // 🆓 Google Translate gratis
    LibreTranslateService    // 🆓 LibreTranslate open source
  ],
  exports: [
    TranslationService,
    NllbTranslationService,
    GoogleTranslateService,
    LibreTranslateService
  ],
})
export class TranslationModule {}
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranslationController } from './translation.controller';
import { TranslationService } from './translation.service';
import { NllbController } from './nllb.controller';
import { NllbTranslationService } from './nllb.service';
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
    NllbController  // 🚀 NUEVO: Controlador NLLB-200 con soporte nativo wayuu
  ],
  providers: [
    TranslationService,
    NllbTranslationService  // 🚀 NUEVO: Servicio de traducción directa wayuu-español
  ],
  exports: [
    TranslationService,
    NllbTranslationService  // Exportar para uso en otros módulos
  ],
})
export class TranslationModule {}
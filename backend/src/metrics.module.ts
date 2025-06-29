import { Module, Global, forwardRef } from '@nestjs/common';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';
import { DatasetsModule } from './datasets/datasets.module';

@Global() // Hacer el módulo global para que el servicio esté disponible en toda la app
@Module({
  imports: [forwardRef(() => DatasetsModule)],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService], // Exportar el servicio para que otros módulos puedan usarlo
})
export class MetricsModule {}

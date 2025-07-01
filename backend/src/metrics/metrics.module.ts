import { Module, forwardRef } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
// import { ScheduledTasksService } from './scheduled-tasks.service'; // Temporalmente comentado para NLLB
import { DatasetsModule } from '../datasets/datasets.module';

@Module({
  imports: [forwardRef(() => DatasetsModule)],
  controllers: [MetricsController],
  providers: [MetricsService /* , ScheduledTasksService */], // Temporalmente comentado para NLLB
  exports: [MetricsService],
})
export class MetricsModule { } 
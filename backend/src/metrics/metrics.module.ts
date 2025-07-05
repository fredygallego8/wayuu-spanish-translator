import { Module, forwardRef } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { DatasetsModule } from '../datasets/datasets.module';
import { TranslationModule } from '../translation/translation.module';

@Module({
  imports: [
    forwardRef(() => DatasetsModule),
    forwardRef(() => TranslationModule)
  ],
  controllers: [MetricsController],
  providers: [MetricsService, ScheduledTasksService],
  exports: [MetricsService],
})
export class MetricsModule { } 
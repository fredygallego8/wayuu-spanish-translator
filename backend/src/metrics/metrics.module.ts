import { Module, forwardRef } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { DatasetsModule } from '../datasets/datasets.module';

@Module({
  imports: [forwardRef(() => DatasetsModule)],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule { } 
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatasetsService } from './datasets.service';
import { DatasetsController } from './datasets.controller';
import { AudioDurationService } from './audio-duration.service';
import { MetricsModule } from '../metrics.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [ConfigModule, forwardRef(() => MetricsModule)],
  controllers: [DatasetsController],
  providers: [DatasetsService, AudioDurationService],
  exports: [DatasetsService, AudioDurationService],
})
export class DatasetsModule {}
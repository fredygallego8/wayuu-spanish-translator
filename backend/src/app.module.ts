import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TranslationModule } from './translation/translation.module';
import { DatasetsModule } from './datasets/datasets.module';
import { YoutubeIngestionModule } from './youtube-ingestion/youtube-ingestion.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    AuthModule,
    TranslationModule,
    DatasetsModule,
    YoutubeIngestionModule,
    MetricsModule,
  ],
})
export class AppModule {}
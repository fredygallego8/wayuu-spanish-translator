import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TranslationModule } from './translation/translation.module';
import { DatasetsModule } from './datasets/datasets.module';
import { YoutubeIngestionModule } from './youtube-ingestion/youtube-ingestion.module';
import { HuggingfaceModule } from './huggingface.module';
import { MetricsModule } from './metrics.module';
import { AuthModule } from './auth/auth.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';

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
    HuggingfaceModule,
    MetricsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}
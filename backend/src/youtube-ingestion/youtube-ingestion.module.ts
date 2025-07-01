import { Module } from '@nestjs/common';
import { YoutubeIngestionController } from './youtube-ingestion.controller';
import { YoutubeIngestionService } from './youtube-ingestion.service';
import { StubAsrStrategy } from './asr-strategies/stub-asr.strategy';
import { OpenAIWhisperApiStrategy } from './asr-strategies/openai-whisper-api.strategy';
import { WhisperAsrStrategy } from './asr-strategies/whisper-asr.strategy';
import { WayuuOptimizedAsrStrategy } from './asr-strategies/wayuu-optimized-asr.strategy';
import { TranslationModule } from '../translation/translation.module';
// Pipeline Optimization Services
import { ProcessingQueueService } from './queue/processing-queue.service';
import { PipelineHealthService } from './health/pipeline-health.service';
import { FileValidatorService } from './validation/file-validator.service';

@Module({
  imports: [TranslationModule],
  controllers: [YoutubeIngestionController],
  providers: [
    YoutubeIngestionService,
    // Pipeline Optimization Services
    ProcessingQueueService,
    PipelineHealthService,
    FileValidatorService,
    {
      provide: 'AsrStrategy',
      useFactory: () => {
        const asrProvider = process.env.ASR_PROVIDER || 'stub';
        
        switch (asrProvider.toLowerCase()) {
          case 'wayuu':
          case 'wayuu-optimized':
            const wayuuApiKey = process.env.OPENAI_API_KEY;
            if (!wayuuApiKey) {
              console.warn('⚠️ OPENAI_API_KEY not found for Wayuu optimization, falling back to stub ASR');
              return new StubAsrStrategy();
            }
            return new WayuuOptimizedAsrStrategy({
              primaryModel: 'whisper-multilingual',
              enablePhoneticCorrection: process.env.ASR_ENABLE_PHONETIC_CORRECTION !== 'false',
              enableWayuuDictionary: process.env.ASR_ENABLE_WAYUU_DICTIONARY !== 'false',
              enableMultipleAttempts: process.env.ASR_ENABLE_MULTIPLE_ATTEMPTS !== 'false',
              confidenceThreshold: parseFloat(process.env.ASR_CONFIDENCE_THRESHOLD || '0.6'),
              openaiApiKey: wayuuApiKey,
              whisperModel: (process.env.WHISPER_MODEL as any) || 'small',
            });
            
          case 'openai':
          case 'openai-api':
            const openaiApiKey = process.env.OPENAI_API_KEY;
            if (!openaiApiKey) {
              console.warn('⚠️ OPENAI_API_KEY not found, falling back to stub ASR');
              return new StubAsrStrategy();
            }
            return new OpenAIWhisperApiStrategy({
              apiKey: openaiApiKey,
              language: process.env.ASR_LANGUAGE || 'es',
              responseFormat: (process.env.ASR_RESPONSE_FORMAT as any) || 'text',
              temperature: parseFloat(process.env.ASR_TEMPERATURE || '0'),
            });
            
          case 'whisper':
          case 'whisper-local':
            return new WhisperAsrStrategy({
              model: (process.env.WHISPER_MODEL as any) || 'small',
              language: process.env.ASR_LANGUAGE || 'es',
              enableFallback: false, // Sin fallback a OpenAI
              fallbackApiKey: undefined, // No OpenAI API key
              fallbackProvider: undefined, // Sin proveedor de fallback
            });
            
          case 'stub':
          default:
            console.log('🔧 Using stub ASR strategy for development');
            return new StubAsrStrategy();
        }
      },
    },
  ],
})
export class YoutubeIngestionModule {}

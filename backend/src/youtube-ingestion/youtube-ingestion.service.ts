import { Injectable, Logger, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AsrStrategy } from './asr-strategies/asr.strategy';
import { TranslationService } from '../translation/translation.service';

// Use require for youtube-dl-exec to avoid TypeScript issues
const youtubedl = require('youtube-dl-exec');

interface IngestionRecord {
  videoId: string;
  title: string;
  url: string;
  status: 'pending_transcription' | 'pending_translation' | 'completed' | 'failed' | 'downloading';
  audioPath: string;
  transcription?: string;
  translation?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class YoutubeIngestionService {
  private readonly logger = new Logger(YoutubeIngestionService.name);
  private readonly audioPath = path.join(__dirname, '..', '..', 'data', 'youtube-audio');
  private readonly dbPath = path.join(this.audioPath, 'ingestion-db.json');
  private db: Record<string, IngestionRecord> = {};

  constructor(
    @Inject('AsrStrategy') private readonly asrStrategy: AsrStrategy,
    private readonly translationService: TranslationService,
  ) {
    this.loadDb();
    if (!fs.existsSync(this.audioPath)) {
      this.logger.log(`Creating YouTube audio directory at: ${this.audioPath}`);
      fs.mkdirSync(this.audioPath, { recursive: true });
    }
  }

  private loadDb() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf-8');
        this.db = JSON.parse(data);
        this.logger.log('Ingestion database loaded.');
      }
    } catch (error) {
      this.logger.error('Failed to load ingestion database.', error.stack);
    }
  }

  private saveDb() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2));
    } catch (error) {
      this.logger.error('Failed to save ingestion database.', error.stack);
    }
  }

  private createOrUpdateRecord(videoId: string, data: Partial<IngestionRecord>): IngestionRecord {
    const now = new Date().toISOString();
    const existingRecord = this.db[videoId] || { createdAt: now };
    const updatedRecord = { ...existingRecord, ...data, videoId, updatedAt: now };
    this.db[videoId] = updatedRecord as IngestionRecord;
    this.saveDb();
    return this.db[videoId];
  }

  async processVideo(url: string): Promise<void> {
    this.logger.log(`Processing video with youtube-dl-exec: ${url}`);
    let videoId: string;

    try {
      const metadata = await youtubedl(url, { dumpSingleJson: true });
      
      if (typeof metadata !== 'object' || metadata === null) {
        throw new Error('Invalid metadata received from youtube-dl-exec');
      }

      videoId = (metadata as any).id;
      const title = (metadata as any).title;

      this.createOrUpdateRecord(videoId, {
        title: title,
        url,
        status: 'downloading',
        videoId: videoId,
      });

      const outputPath = path.join(this.audioPath, `${videoId}.mp3`);
      
      await youtubedl.exec(url, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: 0,
        output: outputPath,
      });

      this.logger.log(`Successfully downloaded audio to ${outputPath}`);
      this.createOrUpdateRecord(videoId, { audioPath: outputPath, status: 'pending_transcription' });

      const transcription = await this.asrStrategy.transcribe(outputPath);
      this.logger.log(`Transcription for ${videoId}: "${transcription.substring(0, 50)}..."`);
      this.createOrUpdateRecord(videoId, {
        transcription,
        status: 'pending_translation',
      });

    } catch (error) {
      this.logger.error(`[youtube-dl-exec] Failed to process video ${url}: ${error.message}`, error.stack);
      if (videoId) {
        this.createOrUpdateRecord(videoId, { status: 'failed', title: 'Unknown - youtube-dl-exec Error' });
      }
    }
  }

  async processPendingTranslations(): Promise<{
    message: string;
    processed: number;
    successful: number;
    failed: number;
    results: Array<{
      videoId: string;
      title: string;
      status: string;
      translation?: string;
      error?: string;
    }>;
  }> {
    this.logger.log('Processing pending translations...');
    
    const pendingVideos = Object.values(this.db).filter(
      record => record.status === 'pending_translation'
    );

    if (pendingVideos.length === 0) {
      return {
        message: 'No videos pending translation.',
        processed: 0,
        successful: 0,
        failed: 0,
        results: [],
      };
    }

    this.logger.log(`Found ${pendingVideos.length} videos pending translation.`);
    
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const video of pendingVideos) {
      try {
        this.logger.log(`Translating video: ${video.videoId} - "${video.title}"`);
        
        // Translate from wayuunaiki to Spanish
        const translationResult = await this.translationService.translate({
          text: video.transcription || '',
          direction: 'wayuu-to-spanish' as any, // TranslationDirection.WAYUU_TO_SPANISH
        });

        const translation = translationResult.translatedText;
        
        // Update record with translation
        this.createOrUpdateRecord(video.videoId, {
          translation,
          status: 'completed',
        });

        results.push({
          videoId: video.videoId,
          title: video.title,
          status: 'completed',
          translation,
        });

        successful++;
        this.logger.log(`Successfully translated video ${video.videoId}`);

      } catch (error) {
        this.logger.error(`Failed to translate video ${video.videoId}: ${error.message}`, error.stack);
        
        this.createOrUpdateRecord(video.videoId, {
          status: 'failed',
        });

        results.push({
          videoId: video.videoId,
          title: video.title,
          status: 'failed',
          error: error.message,
        });

        failed++;
      }
    }

    const message = `Processed ${pendingVideos.length} videos: ${successful} successful, ${failed} failed.`;
    this.logger.log(message);

    return {
      message,
      processed: pendingVideos.length,
      successful,
      failed,
      results,
    };
  }

  getDatabaseStatus(): {
    total: number;
    byStatus: Record<string, number>;
    videos: Array<{
      videoId: string;
      title: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    }>;
  } {
    const videos = Object.values(this.db);
    const total = videos.length;
    
    const byStatus = videos.reduce((acc, video) => {
      acc[video.status] = (acc[video.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const videoSummaries = videos.map(video => ({
      videoId: video.videoId,
      title: video.title,
      status: video.status,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    }));

    this.logger.log(`Database status: ${total} total videos, distributed across statuses: ${JSON.stringify(byStatus)}`);

    return {
      total,
      byStatus,
      videos: videoSummaries,
    };
  }

  async getAsrConfiguration(): Promise<{
    provider: string;
    configuration: any;
    capabilities: {
      maxFileSize: string;
      supportedFormats: string[];
      estimatedCostPerMinute: string;
    };
    status: {
      available: boolean;
      lastCheck: string;
      message: string;
    };
  }> {
    const provider = process.env.ASR_PROVIDER || 'stub';
    const lastCheck = new Date().toISOString();
    
    let configuration: any = {};
    let capabilities = {
      maxFileSize: 'Unlimited',
      supportedFormats: ['mp3', 'wav', 'mp4', 'm4a', 'ogg'],
      estimatedCostPerMinute: '$0.00',
    };
    let status = {
      available: true,
      lastCheck,
      message: 'ASR service is operational',
    };

    try {
      switch (provider.toLowerCase()) {
        case 'openai':
        case 'openai-api':
          // Check if we have OpenAI API strategy
          if (this.asrStrategy.constructor.name === 'OpenAIWhisperApiStrategy') {
            const openaiStrategy = this.asrStrategy as any;
            configuration = {
              model: 'whisper-1',
              language: process.env.ASR_LANGUAGE || 'es',
              responseFormat: process.env.ASR_RESPONSE_FORMAT || 'text',
              temperature: parseFloat(process.env.ASR_TEMPERATURE || '0'),
              fallbackEnabled: false,
            };
            
            if (openaiStrategy.getMaxFileSize) {
              capabilities.maxFileSize = openaiStrategy.getMaxFileSize();
            }
            if (openaiStrategy.getSupportedFormats) {
              capabilities.supportedFormats = openaiStrategy.getSupportedFormats();
            }
            if (openaiStrategy.getEstimatedCost) {
              capabilities.estimatedCostPerMinute = openaiStrategy.getEstimatedCost(1);
            }
            
            status.message = 'OpenAI Whisper API configured and ready';
          } else {
            status.available = false;
            status.message = 'OpenAI API key not configured, using fallback';
          }
          break;

        case 'whisper':
        case 'whisper-local':
          // Check if we have Whisper local strategy
          if (this.asrStrategy.constructor.name === 'WhisperAsrStrategy') {
            const whisperStrategy = this.asrStrategy as any;
            configuration = {
              model: process.env.WHISPER_MODEL || 'small',
              language: process.env.ASR_LANGUAGE || 'es',
              fallbackEnabled: process.env.ASR_ENABLE_FALLBACK === 'true',
              fallbackProvider: 'openai',
            };
            
            if (whisperStrategy.getModelInfo) {
              const modelInfo = whisperStrategy.getModelInfo();
              configuration.modelSize = modelInfo.size;
              configuration.ramRequired = modelInfo.ramRequired;
            }
            
            if (whisperStrategy.isLocalAvailable) {
              status.available = whisperStrategy.isLocalAvailable();
              status.message = status.available 
                ? 'Local Whisper installation detected and ready'
                : 'Local Whisper not found, install with: pip install openai-whisper';
            }
            
            capabilities.maxFileSize = 'Unlimited (local processing)';
            capabilities.estimatedCostPerMinute = '$0.00 (local processing)';
          } else {
            status.available = false;
            status.message = 'Whisper not properly configured, using fallback';
          }
          break;

        case 'stub':
        default:
          configuration = {
            mode: 'development',
            mockResponse: true,
          };
          status.message = 'Using stub ASR for development - no real transcription';
          capabilities.estimatedCostPerMinute = '$0.00 (development mode)';
          break;
      }
    } catch (error) {
      this.logger.error(`Error getting ASR configuration: ${error.message}`);
      status.available = false;
      status.message = `Configuration error: ${error.message}`;
    }

    this.logger.log(`ASR Configuration - Provider: ${provider}, Available: ${status.available}`);

    return {
      provider,
      configuration,
      capabilities,
      status,
    };
  }
}

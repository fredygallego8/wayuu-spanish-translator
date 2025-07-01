import { Injectable, Logger, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { AsrStrategy } from './asr-strategies/asr.strategy';
import { TranslationService } from '../translation/translation.service';
import { UploadAudioDto } from './dto/upload-audio.dto';

// Use promisified exec for direct yt-dlp commands
const execAsync = promisify(exec);

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
  
  // Rate limiting and bot detection avoidance
  private lastRequestTime: number = 0;
  private readonly minDelayBetweenRequests = 30000; // 30 seconds minimum
  private readonly maxDelayBetweenRequests = 90000; // 90 seconds maximum
  private requestCount = 0;

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

  // Rate limiting methods to avoid bot detection
  private getRandomDelay(): number {
    const min = this.minDelayBetweenRequests;
    const max = this.maxDelayBetweenRequests;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (this.lastRequestTime > 0 && timeSinceLastRequest < this.minDelayBetweenRequests) {
      const delay = this.getRandomDelay();
      this.logger.log(`🕐 Rate limiting: Waiting ${Math.round(delay/1000)}s to avoid bot detection (request #${this.requestCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private logRateLimitStatus(): void {
    const timeSinceLastRequest = this.lastRequestTime > 0 ? Date.now() - this.lastRequestTime : 0;
    this.logger.log(`🔍 Rate limit status: Last request ${Math.round(timeSinceLastRequest/1000)}s ago, Total requests: ${this.requestCount}`);
  }

  async processVideo(url: string): Promise<void> {
    this.logger.log(`Processing video with yt-dlp: ${url}`);
    let videoId: string;

    try {
      // Apply rate limiting to avoid bot detection
      this.logRateLimitStatus();
      await this.waitForRateLimit();
      
      // Get metadata using yt-dlp directly with additional options to avoid blocking
      const metadataCmd = `yt-dlp --dump-json --no-warnings --user-agent "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" --referer "https://www.youtube.com/" --sleep-interval 5 --max-sleep-interval 15 "${url}"`;
      const { stdout: metadataOutput } = await execAsync(metadataCmd);
      
      const metadata = JSON.parse(metadataOutput.trim());
      
      if (!metadata || typeof metadata !== 'object') {
        throw new Error('Invalid metadata received from yt-dlp');
      }

      videoId = metadata.id;
      const title = metadata.title;

      this.createOrUpdateRecord(videoId, {
        title: title,
        url,
        status: 'downloading',
        videoId: videoId,
      });

      const outputPath = path.join(this.audioPath, `${videoId}.mp3`);
      
      // Apply another rate limit pause before audio download
      this.logger.log(`⏳ Adding pause before audio download for ${videoId}`);
      await this.waitForRateLimit();
      
      // Download audio using yt-dlp directly with additional options to avoid blocking
      const downloadCmd = `yt-dlp --extract-audio --audio-format mp3 --audio-quality 0 --no-warnings --user-agent "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" --referer "https://www.youtube.com/" --sleep-interval 10 --max-sleep-interval 30 -o "${outputPath}" "${url}"`;
      await execAsync(downloadCmd);

      this.logger.log(`Successfully downloaded audio to ${outputPath}`);
      this.createOrUpdateRecord(videoId, { audioPath: outputPath, status: 'pending_transcription' });

      const transcription = await this.asrStrategy.transcribe(outputPath);
      this.logger.log(`Transcription for ${videoId}: "${transcription.substring(0, 50)}..."`);
      this.createOrUpdateRecord(videoId, {
        transcription,
        status: 'pending_translation',
      });

    } catch (error) {
      this.logger.error(`[yt-dlp] Failed to process video ${url}: ${error.message}`, error.stack);
      if (videoId) {
        this.createOrUpdateRecord(videoId, { status: 'failed', title: 'Unknown - yt-dlp Error' });
      }
    }
  }

  async processPendingTranscriptions(): Promise<{
    message: string;
    processed: number;
    successful: number;
    failed: number;
    results: Array<{
      videoId: string;
      title: string;
      status: string;
      transcription?: string;
      error?: string;
    }>;
  }> {
    this.logger.log('Processing pending transcriptions...');
    
    const pendingVideos = Object.values(this.db).filter(record => record.status === 'pending_transcription');
    
    if (pendingVideos.length === 0) {
      return {
        message: 'No videos pending transcription.',
        processed: 0,
        successful: 0,
        failed: 0,
        results: [],
      };
    }

    this.logger.log(`Found ${pendingVideos.length} videos pending transcription.`);
    
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const video of pendingVideos) {
      try {
        this.logger.log(`Transcribing video: ${video.videoId} - "${video.title}"`);
        
        // Check if audio file exists
        if (!fs.existsSync(video.audioPath)) {
          throw new Error(`Audio file not found: ${video.audioPath}`);
        }
        
        // Transcribe using ASR strategy
        const transcription = await this.asrStrategy.transcribe(video.audioPath);
        this.logger.log(`Transcription for ${video.videoId}: "${transcription.substring(0, 50)}..."`);
        
        // Update record with transcription and move to next stage
        this.createOrUpdateRecord(video.videoId, {
          transcription,
          status: 'pending_translation',
        });

        results.push({
          videoId: video.videoId,
          title: video.title,
          status: 'pending_translation',
          transcription,
        });

        successful++;
        this.logger.log(`Successfully transcribed video ${video.videoId}`);

      } catch (error) {
        this.logger.error(`Failed to transcribe video ${video.videoId}: ${error.message}`, error.stack);
        
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

  async processUploadedFile(file: any, uploadDto: UploadAudioDto): Promise<void> {
    this.logger.log(`Processing uploaded file: ${file.originalname} (${file.size} bytes)`);
    
    const fileId = file.filename.split('.')[0]; // Remove extension for ID
    const title = uploadDto.title || `Uploaded: ${file.originalname}`;
    const source = uploadDto.source || 'Direct upload';
    
    try {
      // Create database record
      this.createOrUpdateRecord(fileId, {
        title: title,
        url: `upload://${file.originalname}`,
        status: 'pending_transcription',
        audioPath: file.path,
        videoId: fileId,
      });

      this.logger.log(`File stored at: ${file.path}`);
      
      // Start transcription immediately (no download needed)
      const transcription = await this.asrStrategy.transcribe(file.path);
      this.logger.log(`Transcription for ${fileId}: "${transcription.substring(0, 50)}..."`);
      
      this.createOrUpdateRecord(fileId, {
        transcription,
        status: 'pending_translation',
      });

      this.logger.log(`Upload processing completed for: ${fileId}`);
      
    } catch (error) {
      this.logger.error(`Failed to process uploaded file ${file.originalname}: ${error.message}`, error.stack);
      this.createOrUpdateRecord(fileId, { 
        status: 'failed', 
        title: title,
      });
      throw error;
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

  async processAllPendingVideos(): Promise<{
    message: string;
    processed: number;
    successful: number;
    failed: number;
    transcriptionsProcessed: number;
    translationsProcessed: number;
    results: Array<{
      videoId: string;
      title: string;
      status: string;
      action: 'transcription' | 'translation';
      result?: string;
      error?: string;
    }>;
  }> {
    this.logger.log('🎬 Processing ALL pending videos (transcriptions + translations)...');
    
    // Get all pending videos
    const pendingTranscriptions = Object.values(this.db).filter(
      record => record.status === 'pending_transcription'
    );
    const pendingTranslations = Object.values(this.db).filter(
      record => record.status === 'pending_translation'
    );

    const totalPending = pendingTranscriptions.length + pendingTranslations.length;
    
    if (totalPending === 0) {
      return {
        message: 'No videos pending processing.',
        processed: 0,
        successful: 0,
        failed: 0,
        transcriptionsProcessed: 0,
        translationsProcessed: 0,
        results: [],
      };
    }

    this.logger.log(`Found ${pendingTranscriptions.length} videos pending transcription and ${pendingTranslations.length} videos pending translation.`);
    
    const results = [];
    let successful = 0;
    let failed = 0;
    let transcriptionsProcessed = 0;
    let translationsProcessed = 0;

    // Process transcriptions first
    for (const video of pendingTranscriptions) {
      try {
        this.logger.log(`🎤 Transcribing video: ${video.videoId} - "${video.title}"`);
        
        if (!video.audioPath || !fs.existsSync(video.audioPath)) {
          throw new Error(`Audio file not found: ${video.audioPath}`);
        }
        
        const transcription = await this.asrStrategy.transcribe(video.audioPath);
        this.logger.log(`Transcription for ${video.videoId}: "${transcription.substring(0, 50)}..."`);
        
        // Update record with transcription
        this.createOrUpdateRecord(video.videoId, {
          transcription,
          status: 'pending_translation',
        });

        results.push({
          videoId: video.videoId,
          title: video.title,
          status: 'pending_translation',
          action: 'transcription',
          result: transcription.substring(0, 100) + '...',
        });

        successful++;
        transcriptionsProcessed++;
        this.logger.log(`✅ Successfully transcribed video ${video.videoId}`);

      } catch (error) {
        this.logger.error(`❌ Failed to transcribe video ${video.videoId}: ${error.message}`, error.stack);
        
        this.createOrUpdateRecord(video.videoId, {
          status: 'failed',
        });

        results.push({
          videoId: video.videoId,
          title: video.title,
          status: 'failed',
          action: 'transcription',
          error: error.message,
        });

        failed++;
      }
    }

    // Re-get pending translations (includes newly transcribed videos)
    const allPendingTranslations = Object.values(this.db).filter(
      record => record.status === 'pending_translation'
    );

    // Process translations
    for (const video of allPendingTranslations) {
      try {
        this.logger.log(`🌐 Translating video: ${video.videoId} - "${video.title}"`);
        
        // Translate from wayuunaiki to Spanish
        const translationResult = await this.translationService.translate({
          text: video.transcription || '',
          direction: 'wayuu-to-spanish' as any,
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
          action: 'translation',
          result: translation.substring(0, 100) + '...',
        });

        successful++;
        translationsProcessed++;
        this.logger.log(`✅ Successfully translated video ${video.videoId}`);

      } catch (error) {
        this.logger.error(`❌ Failed to translate video ${video.videoId}: ${error.message}`, error.stack);
        
        this.createOrUpdateRecord(video.videoId, {
          status: 'failed',
        });

        results.push({
          videoId: video.videoId,
          title: video.title,
          status: 'failed',
          action: 'translation',
          error: error.message,
        });

        failed++;
      }
    }

    const message = `🎬 Processed ${totalPending} videos: ${successful} successful, ${failed} failed. (${transcriptionsProcessed} transcriptions + ${translationsProcessed} translations)`;
    this.logger.log(message);

    return {
      message,
      processed: totalPending,
      successful,
      failed,
      transcriptionsProcessed,
      translationsProcessed,
      results,
    };
  }

  private extractWayuuTextFromTranscription(transcription: string): string {
    // Remove timestamp markers like [00:00.000 --> 00:16.000]
    const lines = transcription.split('\n');
    const textLines = lines.map(line => {
      // Remove timestamp pattern [HH:MM.SSS --> HH:MM.SSS]
      return line.replace(/\[[\d:.\s\->]+\]/g, '').trim();
    }).filter(line => line.length > 0);
    
    return textLines.join(' ');
  }

  private async translateWayuuText(text: string): Promise<string> {
    try {
      // Split text into words and translate each
      const words = text.split(/\s+/).filter(word => word.length > 0);
      const translations = [];
      
      for (const word of words) {
        try {
          // Clean word (remove punctuation)
          const cleanWord = word.replace(/[.,;:!?()"\-]/g, '').toLowerCase();
          if (cleanWord.length === 0) continue;
          
          const result = await this.translationService.translate({
            text: cleanWord,
            direction: 'wayuu-to-spanish' as any,
          });
          
          if (result.translatedText && result.translatedText !== cleanWord) {
            translations.push(result.translatedText);
          } else {
            // Keep original word if no translation found
            translations.push(word);
          }
        } catch (error) {
          // Keep original word if translation fails
          translations.push(word);
        }
      }
      
      return translations.join(' ');
    } catch (error) {
      this.logger.error(`Failed to translate wayuu text: ${error.message}`);
      return `[Translation failed: ${error.message}]`;
    }
  }

  async reprocessTranslationsWithImprovedLogic(): Promise<{
    message: string;
    processed: number;
    successful: number;
    failed: number;
    results: Array<{
      videoId: string;
      title: string;
      status: string;
      originalTranslation: string;
      newTranslation: string;
      error?: string;
    }>;
  }> {
    this.logger.log('🔄 Reprocessing translations with improved logic...');
    
    const completedVideos = Object.values(this.db).filter(
      record => record.status === 'completed' && record.transcription
    );

    if (completedVideos.length === 0) {
      return {
        message: 'No completed videos found for reprocessing.',
        processed: 0,
        successful: 0,
        failed: 0,
        results: [],
      };
    }

    this.logger.log(`Found ${completedVideos.length} completed videos for reprocessing.`);
    
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const video of completedVideos) {
      try {
        this.logger.log(`🔄 Reprocessing video: ${video.videoId} - "${video.title}"`);
        
        // Extract clean wayuu text from transcription
        const cleanWayuuText = this.extractWayuuTextFromTranscription(video.transcription);
        this.logger.log(`Extracted text: "${cleanWayuuText.substring(0, 100)}..."`);
        
        // Translate the cleaned text
        const newTranslation = await this.translateWayuuText(cleanWayuuText);
        
        // Update record with new translation
        this.createOrUpdateRecord(video.videoId, {
          translation: newTranslation,
          status: 'completed',
        });

        results.push({
          videoId: video.videoId,
          title: video.title,
          status: 'completed',
          originalTranslation: video.translation || '[No translation]',
          newTranslation: newTranslation,
        });

        successful++;
        this.logger.log(`✅ Successfully reprocessed video ${video.videoId}`);

      } catch (error) {
        this.logger.error(`❌ Failed to reprocess video ${video.videoId}: ${error.message}`, error.stack);
        
        results.push({
          videoId: video.videoId,
          title: video.title,
          status: 'failed',
          originalTranslation: video.translation || '[No translation]',
          newTranslation: '[Failed]',
          error: error.message,
        });

        failed++;
      }
    }

    const message = `Reprocessed ${completedVideos.length} videos: ${successful} successful, ${failed} failed.`;
    this.logger.log(message);

    return {
      message,
      processed: completedVideos.length,
      successful,
      failed,
      results,
    };
  }

  async resetCompletedVideosForTranslation(): Promise<{
    message: string;
    resetCount: number;
    resetVideos: Array<{
      videoId: string;
      title: string;
      previousStatus: string;
      newStatus: string;
    }>;
  }> {
    this.logger.log('🔄 Resetting completed videos without translations...');
    
    const completedVideos = Object.values(this.db).filter(
      record => record.status === 'completed' && record.transcription && !record.translation
    );

    if (completedVideos.length === 0) {
      return {
        message: 'No completed videos without translations found.',
        resetCount: 0,
        resetVideos: [],
      };
    }

    this.logger.log(`Found ${completedVideos.length} completed videos without translations.`);
    
    const resetVideos = [];

    for (const video of completedVideos) {
      this.logger.log(`🔄 Resetting video: ${video.videoId} - "${video.title}"`);
      
      this.createOrUpdateRecord(video.videoId, {
        status: 'pending_translation',
      });

      resetVideos.push({
        videoId: video.videoId,
        title: video.title,
        previousStatus: 'completed',
        newStatus: 'pending_translation',
      });
    }

    const message = `Reset ${completedVideos.length} videos to pending_translation status.`;
    this.logger.log(message);

    return {
      message,
      resetCount: completedVideos.length,
      resetVideos,
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
      transcription?: string;
      translation?: string;
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
      transcription: video.transcription,
      translation: video.translation,
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

  async deleteVideo(videoId: string): Promise<{
    videoId: string;
    title: string;
    filesDeleted: string[];
    deletedAt: string;
  }> {
    this.logger.log(`Attempting to delete video: ${videoId}`);
    
    // Check if video exists in database
    const video = this.db[videoId];
    if (!video) {
      throw new Error(`Video with ID ${videoId} does not exist`);
    }
    
    const filesDeleted: string[] = [];
    const deletedAt = new Date().toISOString();
    
    try {
      // Delete audio/video file if it exists
      if (video.audioPath && fs.existsSync(video.audioPath)) {
        await fs.promises.unlink(video.audioPath);
        filesDeleted.push(path.basename(video.audioPath));
        this.logger.log(`Deleted audio file: ${video.audioPath}`);
      }
      
      // Delete transcription file if it exists (Whisper creates .txt files)
      const transcriptionPath = video.audioPath ? video.audioPath.replace(/\.[^/.]+$/, '.txt') : null;
      if (transcriptionPath && fs.existsSync(transcriptionPath)) {
        await fs.promises.unlink(transcriptionPath);
        filesDeleted.push(path.basename(transcriptionPath));
        this.logger.log(`Deleted transcription file: ${transcriptionPath}`);
      }
      
      // For uploaded files, try to delete using the video ID pattern
      const extensions = ['.mp4', '.mp3', '.wav', '.m4a', '.ogg', '.avi', '.mov', '.mkv', '.webm'];
      for (const ext of extensions) {
        const filePath = path.join(this.audioPath, `${videoId}${ext}`);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          filesDeleted.push(path.basename(filePath));
          this.logger.log(`Deleted file: ${filePath}`);
        }
        
        // Also check for transcription file with same base name
        const txtPath = path.join(this.audioPath, `${videoId}.txt`);
        if (fs.existsSync(txtPath) && !filesDeleted.includes(path.basename(txtPath))) {
          await fs.promises.unlink(txtPath);
          filesDeleted.push(path.basename(txtPath));
          this.logger.log(`Deleted transcription file: ${txtPath}`);
        }
      }
      
      // Remove from database
      const videoTitle = video.title;
      delete this.db[videoId];
      this.saveDb();
      
      this.logger.log(`Successfully deleted video ${videoId}: ${filesDeleted.length} files removed`);
      
      return {
        videoId,
        title: videoTitle,
        filesDeleted,
        deletedAt,
      };
      
    } catch (error) {
      this.logger.error(`Error deleting video ${videoId}: ${error.message}`, error.stack);
      throw new Error(`Failed to delete video files: ${error.message}`);
    }
  }
}

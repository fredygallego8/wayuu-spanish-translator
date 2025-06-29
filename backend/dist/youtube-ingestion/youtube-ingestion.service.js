"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var YoutubeIngestionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeIngestionService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const translation_service_1 = require("../translation/translation.service");
const youtubedl = require('youtube-dl-exec');
let YoutubeIngestionService = YoutubeIngestionService_1 = class YoutubeIngestionService {
    constructor(asrStrategy, translationService) {
        this.asrStrategy = asrStrategy;
        this.translationService = translationService;
        this.logger = new common_1.Logger(YoutubeIngestionService_1.name);
        this.audioPath = path.join(__dirname, '..', '..', 'data', 'youtube-audio');
        this.dbPath = path.join(this.audioPath, 'ingestion-db.json');
        this.db = {};
        this.loadDb();
        if (!fs.existsSync(this.audioPath)) {
            this.logger.log(`Creating YouTube audio directory at: ${this.audioPath}`);
            fs.mkdirSync(this.audioPath, { recursive: true });
        }
    }
    loadDb() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const data = fs.readFileSync(this.dbPath, 'utf-8');
                this.db = JSON.parse(data);
                this.logger.log('Ingestion database loaded.');
            }
        }
        catch (error) {
            this.logger.error('Failed to load ingestion database.', error.stack);
        }
    }
    saveDb() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2));
        }
        catch (error) {
            this.logger.error('Failed to save ingestion database.', error.stack);
        }
    }
    createOrUpdateRecord(videoId, data) {
        const now = new Date().toISOString();
        const existingRecord = this.db[videoId] || { createdAt: now };
        const updatedRecord = { ...existingRecord, ...data, videoId, updatedAt: now };
        this.db[videoId] = updatedRecord;
        this.saveDb();
        return this.db[videoId];
    }
    async processVideo(url) {
        this.logger.log(`Processing video with youtube-dl-exec: ${url}`);
        let videoId;
        try {
            const metadata = await youtubedl(url, { dumpSingleJson: true });
            if (typeof metadata !== 'object' || metadata === null) {
                throw new Error('Invalid metadata received from youtube-dl-exec');
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
        }
        catch (error) {
            this.logger.error(`[youtube-dl-exec] Failed to process video ${url}: ${error.message}`, error.stack);
            if (videoId) {
                this.createOrUpdateRecord(videoId, { status: 'failed', title: 'Unknown - youtube-dl-exec Error' });
            }
        }
    }
    async processPendingTranslations() {
        this.logger.log('Processing pending translations...');
        const pendingVideos = Object.values(this.db).filter(record => record.status === 'pending_translation');
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
                const translationResult = await this.translationService.translate({
                    text: video.transcription || '',
                    direction: 'wayuu-to-spanish',
                });
                const translation = translationResult.translatedText;
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
            }
            catch (error) {
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
    getDatabaseStatus() {
        const videos = Object.values(this.db);
        const total = videos.length;
        const byStatus = videos.reduce((acc, video) => {
            acc[video.status] = (acc[video.status] || 0) + 1;
            return acc;
        }, {});
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
    async getAsrConfiguration() {
        const provider = process.env.ASR_PROVIDER || 'stub';
        const lastCheck = new Date().toISOString();
        let configuration = {};
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
                    if (this.asrStrategy.constructor.name === 'OpenAIWhisperApiStrategy') {
                        const openaiStrategy = this.asrStrategy;
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
                    }
                    else {
                        status.available = false;
                        status.message = 'OpenAI API key not configured, using fallback';
                    }
                    break;
                case 'whisper':
                case 'whisper-local':
                    if (this.asrStrategy.constructor.name === 'WhisperAsrStrategy') {
                        const whisperStrategy = this.asrStrategy;
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
                    }
                    else {
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
        }
        catch (error) {
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
};
exports.YoutubeIngestionService = YoutubeIngestionService;
exports.YoutubeIngestionService = YoutubeIngestionService = YoutubeIngestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('AsrStrategy')),
    __metadata("design:paramtypes", [Object, translation_service_1.TranslationService])
], YoutubeIngestionService);
//# sourceMappingURL=youtube-ingestion.service.js.map
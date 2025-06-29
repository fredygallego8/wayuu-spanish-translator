"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeIngestionModule = void 0;
const common_1 = require("@nestjs/common");
const youtube_ingestion_controller_1 = require("./youtube-ingestion.controller");
const youtube_ingestion_service_1 = require("./youtube-ingestion.service");
const stub_asr_strategy_1 = require("./asr-strategies/stub-asr.strategy");
const openai_whisper_api_strategy_1 = require("./asr-strategies/openai-whisper-api.strategy");
const whisper_asr_strategy_1 = require("./asr-strategies/whisper-asr.strategy");
const wayuu_optimized_asr_strategy_1 = require("./asr-strategies/wayuu-optimized-asr.strategy");
const translation_module_1 = require("../translation/translation.module");
let YoutubeIngestionModule = class YoutubeIngestionModule {
};
exports.YoutubeIngestionModule = YoutubeIngestionModule;
exports.YoutubeIngestionModule = YoutubeIngestionModule = __decorate([
    (0, common_1.Module)({
        imports: [translation_module_1.TranslationModule],
        controllers: [youtube_ingestion_controller_1.YoutubeIngestionController],
        providers: [
            youtube_ingestion_service_1.YoutubeIngestionService,
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
                                return new stub_asr_strategy_1.StubAsrStrategy();
                            }
                            return new wayuu_optimized_asr_strategy_1.WayuuOptimizedAsrStrategy({
                                primaryModel: 'whisper-multilingual',
                                enablePhoneticCorrection: process.env.ASR_ENABLE_PHONETIC_CORRECTION !== 'false',
                                enableWayuuDictionary: process.env.ASR_ENABLE_WAYUU_DICTIONARY !== 'false',
                                enableMultipleAttempts: process.env.ASR_ENABLE_MULTIPLE_ATTEMPTS !== 'false',
                                confidenceThreshold: parseFloat(process.env.ASR_CONFIDENCE_THRESHOLD || '0.6'),
                                openaiApiKey: wayuuApiKey,
                                whisperModel: process.env.WHISPER_MODEL || 'small',
                            });
                        case 'openai':
                        case 'openai-api':
                            const openaiApiKey = process.env.OPENAI_API_KEY;
                            if (!openaiApiKey) {
                                console.warn('⚠️ OPENAI_API_KEY not found, falling back to stub ASR');
                                return new stub_asr_strategy_1.StubAsrStrategy();
                            }
                            return new openai_whisper_api_strategy_1.OpenAIWhisperApiStrategy({
                                apiKey: openaiApiKey,
                                language: process.env.ASR_LANGUAGE || 'es',
                                responseFormat: process.env.ASR_RESPONSE_FORMAT || 'text',
                                temperature: parseFloat(process.env.ASR_TEMPERATURE || '0'),
                            });
                        case 'whisper':
                        case 'whisper-local':
                            return new whisper_asr_strategy_1.WhisperAsrStrategy({
                                model: process.env.WHISPER_MODEL || 'small',
                                language: process.env.ASR_LANGUAGE || 'es',
                                enableFallback: false,
                                fallbackApiKey: undefined,
                                fallbackProvider: undefined,
                            });
                        case 'stub':
                        default:
                            console.log('🔧 Using stub ASR strategy for development');
                            return new stub_asr_strategy_1.StubAsrStrategy();
                    }
                },
            },
        ],
    })
], YoutubeIngestionModule);
//# sourceMappingURL=youtube-ingestion.module.js.map
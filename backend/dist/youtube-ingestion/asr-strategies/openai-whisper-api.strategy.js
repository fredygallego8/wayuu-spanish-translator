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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OpenAIWhisperApiStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIWhisperApiStrategy = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const axios_1 = __importDefault(require("axios"));
const FormData = require('form-data');
let OpenAIWhisperApiStrategy = OpenAIWhisperApiStrategy_1 = class OpenAIWhisperApiStrategy {
    constructor(config) {
        this.logger = new common_1.Logger(OpenAIWhisperApiStrategy_1.name);
        if (!config.apiKey) {
            throw new Error('OpenAI API key is required for Whisper API strategy');
        }
        this.config = {
            model: 'whisper-1',
            language: 'es',
            responseFormat: 'text',
            temperature: 0,
            maxRetries: 3,
            timeout: 60000,
            ...config,
        };
        this.logger.log('✅ OpenAI Whisper API strategy initialized');
    }
    async transcribe(audioPath) {
        this.logger.log(`Starting OpenAI Whisper API transcription for: ${audioPath}`);
        if (!fs.existsSync(audioPath)) {
            throw new Error(`Audio file not found: ${audioPath}`);
        }
        const stats = fs.statSync(audioPath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        if (fileSizeInMB > 25) {
            throw new Error(`File too large: ${fileSizeInMB.toFixed(2)}MB. OpenAI Whisper API has a 25MB limit.`);
        }
        this.logger.log(`File size: ${fileSizeInMB.toFixed(2)}MB - within limits`);
        let attempt = 0;
        let lastError;
        while (attempt < this.config.maxRetries) {
            attempt++;
            try {
                this.logger.log(`Transcription attempt ${attempt}/${this.config.maxRetries}`);
                const transcription = await this.makeTranscriptionRequest(audioPath);
                this.logger.log(`✅ Transcription successful: "${transcription.substring(0, 100)}..."`);
                return transcription;
            }
            catch (error) {
                lastError = error;
                this.logger.warn(`Attempt ${attempt} failed: ${error.message}`);
                if (attempt < this.config.maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    this.logger.log(`Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }
        throw new Error(`OpenAI Whisper API failed after ${this.config.maxRetries} attempts. Last error: ${lastError.message}`);
    }
    async makeTranscriptionRequest(audioPath) {
        const form = new FormData();
        form.append('file', fs.createReadStream(audioPath));
        form.append('model', this.config.model);
        if (this.config.language) {
            form.append('language', this.config.language);
        }
        if (this.config.prompt) {
            form.append('prompt', this.config.prompt);
        }
        if (this.config.responseFormat) {
            form.append('response_format', this.config.responseFormat);
        }
        if (this.config.temperature !== undefined) {
            form.append('temperature', this.config.temperature.toString());
        }
        try {
            const response = await axios_1.default.post('https://api.openai.com/v1/audio/transcriptions', form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
                timeout: this.config.timeout,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            });
            if (this.config.responseFormat === 'json' || this.config.responseFormat === 'verbose_json') {
                return response.data.text || '';
            }
            else {
                return response.data || '';
            }
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response) {
                    const status = error.response.status;
                    const message = error.response.data?.error?.message || error.message;
                    if (status === 429) {
                        throw new Error(`Rate limit exceeded: ${message}`);
                    }
                    else if (status === 413) {
                        throw new Error(`File too large: ${message}`);
                    }
                    else if (status === 400) {
                        throw new Error(`Bad request: ${message}`);
                    }
                    else if (status === 401) {
                        throw new Error(`Invalid API key: ${message}`);
                    }
                    else {
                        throw new Error(`API error (${status}): ${message}`);
                    }
                }
                else if (error.code === 'ECONNABORTED') {
                    throw new Error(`Request timeout after ${this.config.timeout}ms`);
                }
                else {
                    throw new Error(`Network error: ${error.message}`);
                }
            }
            else {
                throw new Error(`Unexpected error: ${error.message}`);
            }
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getConfig() {
        const { apiKey, ...configWithoutKey } = this.config;
        return configWithoutKey;
    }
    async getAccountUsage() {
        return {
            hasApiKey: !!this.config.apiKey,
            model: this.config.model,
        };
    }
    getSupportedFormats() {
        return [
            'flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga',
            'oga', 'ogg', 'wav', 'webm'
        ];
    }
    getMaxFileSize() {
        return '25 MB';
    }
    getEstimatedCost(durationMinutes) {
        const costPerMinute = 0.006;
        const totalCost = durationMinutes * costPerMinute;
        return `$${totalCost.toFixed(4)}`;
    }
};
exports.OpenAIWhisperApiStrategy = OpenAIWhisperApiStrategy;
exports.OpenAIWhisperApiStrategy = OpenAIWhisperApiStrategy = OpenAIWhisperApiStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], OpenAIWhisperApiStrategy);
//# sourceMappingURL=openai-whisper-api.strategy.js.map
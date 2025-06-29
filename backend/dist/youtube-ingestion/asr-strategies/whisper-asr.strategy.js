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
var WhisperAsrStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhisperAsrStrategy = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let WhisperAsrStrategy = WhisperAsrStrategy_1 = class WhisperAsrStrategy {
    constructor(config) {
        this.logger = new common_1.Logger(WhisperAsrStrategy_1.name);
        this.whisperInstalled = false;
        this.config = {
            model: 'small',
            language: 'es',
            task: 'transcribe',
            outputFormat: 'txt',
            enableFallback: true,
            ...config,
        };
        this.checkWhisperInstallation();
    }
    async transcribe(audioPath) {
        this.logger.log(`Starting transcription for: ${audioPath}`);
        if (!fs.existsSync(audioPath)) {
            throw new Error(`Audio file not found: ${audioPath}`);
        }
        try {
            if (this.whisperInstalled) {
                this.logger.log(`Using local Whisper model: ${this.config.model}`);
                return await this.transcribeWithWhisper(audioPath);
            }
            if (this.config.enableFallback) {
                this.logger.warn('Local Whisper not available, using cloud fallback');
                return await this.transcribeWithCloudApi(audioPath);
            }
            throw new Error('No ASR method available');
        }
        catch (error) {
            this.logger.error(`Transcription failed: ${error.message}`);
            if (this.whisperInstalled && this.config.enableFallback) {
                this.logger.log('Retrying with cloud API fallback');
                try {
                    return await this.transcribeWithCloudApi(audioPath);
                }
                catch (fallbackError) {
                    this.logger.error(`Fallback also failed: ${fallbackError.message}`);
                }
            }
            throw error;
        }
    }
    async transcribeWithWhisper(audioPath) {
        return new Promise((resolve, reject) => {
            const outputDir = path.dirname(audioPath);
            const outputFile = path.join(outputDir, `${path.basename(audioPath, path.extname(audioPath))}_transcription.txt`);
            const args = [
                audioPath,
                '--model', this.config.model,
                '--output_dir', outputDir,
                '--output_format', this.config.outputFormat,
            ];
            if (this.config.language) {
                args.push('--language', this.config.language);
            }
            if (this.config.task) {
                args.push('--task', this.config.task);
            }
            this.logger.log(`Executing whisper with args: ${args.join(' ')}`);
            const whisperProcess = (0, child_process_1.spawn)('whisper', args, {
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            let stdout = '';
            let stderr = '';
            whisperProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            whisperProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                this.logger.debug(`Whisper stderr: ${data.toString().trim()}`);
            });
            whisperProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        if (fs.existsSync(outputFile)) {
                            const transcription = fs.readFileSync(outputFile, 'utf-8').trim();
                            fs.unlinkSync(outputFile);
                            this.logger.log(`Whisper transcription completed: "${transcription.substring(0, 100)}..."`);
                            resolve(transcription);
                        }
                        else {
                            const transcription = stdout.trim() || 'No transcription generated';
                            resolve(transcription);
                        }
                    }
                    catch (error) {
                        reject(new Error(`Failed to read transcription: ${error.message}`));
                    }
                }
                else {
                    reject(new Error(`Whisper process failed with code ${code}: ${stderr}`));
                }
            });
            whisperProcess.on('error', (error) => {
                reject(new Error(`Failed to start whisper process: ${error.message}`));
            });
        });
    }
    async transcribeWithCloudApi(audioPath) {
        switch (this.config.fallbackProvider) {
            case 'openai':
                return this.transcribeWithOpenAI(audioPath);
            case 'google':
                return this.transcribeWithGoogle(audioPath);
            case 'azure':
                return this.transcribeWithAzure(audioPath);
            default:
                return this.transcribeWithOpenAI(audioPath);
        }
    }
    async transcribeWithOpenAI(audioPath) {
        if (!this.config.fallbackApiKey) {
            throw new Error('OpenAI API key not configured for fallback');
        }
        const FormData = require('form-data');
        const axios = require('axios');
        const form = new FormData();
        form.append('file', fs.createReadStream(audioPath));
        form.append('model', 'whisper-1');
        form.append('language', this.config.language || 'es');
        try {
            const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${this.config.fallbackApiKey}`,
                },
            });
            return response.data.text;
        }
        catch (error) {
            throw new Error(`OpenAI API transcription failed: ${error.message}`);
        }
    }
    async transcribeWithGoogle(audioPath) {
        throw new Error('Google Speech-to-Text not implemented yet');
    }
    async transcribeWithAzure(audioPath) {
        throw new Error('Azure Speech not implemented yet');
    }
    async checkWhisperInstallation() {
        try {
            const { spawn } = require('child_process');
            const whisperCheck = spawn('whisper', ['--help'], { stdio: 'pipe' });
            whisperCheck.on('close', (code) => {
                this.whisperInstalled = code === 0;
                if (this.whisperInstalled) {
                    this.logger.log(`✅ Whisper is installed and available`);
                }
                else {
                    this.logger.warn(`⚠️ Whisper not found. Install with: pip install openai-whisper`);
                }
            });
            whisperCheck.on('error', () => {
                this.whisperInstalled = false;
                this.logger.warn(`⚠️ Whisper not found. Install with: pip install openai-whisper`);
            });
        }
        catch (error) {
            this.whisperInstalled = false;
            this.logger.error(`Error checking Whisper installation: ${error.message}`);
        }
    }
    getModelInfo() {
        const modelInfo = {
            tiny: { size: '39 MB', ramRequired: '1 GB' },
            base: { size: '74 MB', ramRequired: '1 GB' },
            small: { size: '244 MB', ramRequired: '2 GB' },
            medium: { size: '769 MB', ramRequired: '5 GB' },
            large: { size: '1550 MB', ramRequired: '10 GB' },
        };
        return {
            model: this.config.model,
            ...modelInfo[this.config.model],
        };
    }
    isLocalAvailable() {
        return this.whisperInstalled;
    }
    isFallbackEnabled() {
        return this.config.enableFallback || false;
    }
};
exports.WhisperAsrStrategy = WhisperAsrStrategy;
exports.WhisperAsrStrategy = WhisperAsrStrategy = WhisperAsrStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], WhisperAsrStrategy);
//# sourceMappingURL=whisper-asr.strategy.js.map
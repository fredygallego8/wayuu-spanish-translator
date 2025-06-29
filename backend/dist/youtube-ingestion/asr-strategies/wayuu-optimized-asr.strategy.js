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
var WayuuOptimizedAsrStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WayuuOptimizedAsrStrategy = void 0;
const common_1 = require("@nestjs/common");
const openai_whisper_api_strategy_1 = require("./openai-whisper-api.strategy");
const whisper_asr_strategy_1 = require("./whisper-asr.strategy");
const fs = __importStar(require("fs"));
let WayuuOptimizedAsrStrategy = WayuuOptimizedAsrStrategy_1 = class WayuuOptimizedAsrStrategy {
    constructor(config) {
        this.logger = new common_1.Logger(WayuuOptimizedAsrStrategy_1.name);
        this.strategies = [];
        this.wayuuCommonWords = [
            'wayuu', 'anaa', 'pia', 'taya', 'wane', 'chi', 'sulu', 'eekai', 'kasain',
            'maiki', 'süka', 'jia', 'süpüla', 'achukua', 'anain', 'eere', 'jintü',
            'kasachon', 'süchukua', 'watta', 'yaa', 'antüshi', 'süpüshi', 'juyakai',
            'akumajaa', 'süpüla', 'ekirajaa', 'joolu', 'süka', 'wanee', 'achiki',
            'süpüleerua', 'jintüin', 'anasü', 'süchon', 'ekirajüin', 'wattapia'
        ];
        this.phoneticMappings = new Map([
            ['ch', 'ch'], ['sh', 'sh'], ['ü', 'u'], ['j', 'h'],
            ['rr', 'r'], ['ll', 'y'], ['ñ', 'n'], ['c', 'k'],
            ['qu', 'k'], ['gue', 'we'], ['gui', 'wi']
        ]);
        this.config = {
            primaryModel: 'whisper-multilingual',
            enablePhoneticCorrection: true,
            enableWayuuDictionary: true,
            enableMultipleAttempts: true,
            confidenceThreshold: 0.6,
            ...config,
        };
        this.initializeStrategies();
        this.logger.log('✅ Wayuu-optimized ASR strategy initialized');
    }
    initializeStrategies() {
        try {
            if (this.config.openaiApiKey) {
                this.strategies.push(new openai_whisper_api_strategy_1.OpenAIWhisperApiStrategy({
                    apiKey: this.config.openaiApiKey,
                    language: undefined,
                    responseFormat: 'verbose_json',
                    temperature: 0.3,
                    prompt: this.getWayuuPrompt(),
                }));
                this.logger.log('✅ OpenAI Whisper API strategy added (multilingual mode)');
            }
            if (this.config.whisperModel) {
                this.strategies.push(new whisper_asr_strategy_1.WhisperAsrStrategy({
                    model: this.config.whisperModel,
                    language: undefined,
                    task: 'transcribe',
                    enableFallback: false,
                }));
                this.logger.log('✅ Local Whisper strategy added');
            }
            if (this.config.openaiApiKey && this.strategies.length < 2) {
                this.strategies.push(new openai_whisper_api_strategy_1.OpenAIWhisperApiStrategy({
                    apiKey: this.config.openaiApiKey,
                    language: 'es',
                    responseFormat: 'text',
                    temperature: 0,
                    prompt: 'Audio en idioma wayuunaiki (guajiro), idioma indígena de Colombia y Venezuela.',
                }));
                this.logger.log('✅ Spanish fallback strategy added');
            }
        }
        catch (error) {
            this.logger.error(`Error initializing ASR strategies: ${error.message}`);
        }
    }
    async transcribe(audioPath) {
        this.logger.log(`Starting Wayuu-optimized transcription for: ${audioPath}`);
        if (!fs.existsSync(audioPath)) {
            throw new Error(`Audio file not found: ${audioPath}`);
        }
        const results = [];
        for (let i = 0; i < this.strategies.length; i++) {
            const strategy = this.strategies[i];
            const strategyName = strategy.constructor.name;
            try {
                this.logger.log(`Attempt ${i + 1}/${this.strategies.length} with ${strategyName}`);
                const rawTranscription = await strategy.transcribe(audioPath);
                const processedTranscription = await this.postProcessWayuuText(rawTranscription);
                const confidence = this.estimateWayuuConfidence(processedTranscription, rawTranscription);
                results.push({
                    transcription: processedTranscription,
                    confidence,
                    strategy: strategyName,
                });
                this.logger.log(`${strategyName} result: "${processedTranscription.substring(0, 50)}..." (confidence: ${confidence.toFixed(2)})`);
                if (confidence >= this.config.confidenceThreshold) {
                    this.logger.log(`✅ High confidence result from ${strategyName}, using it`);
                    return processedTranscription;
                }
            }
            catch (error) {
                this.logger.warn(`${strategyName} failed: ${error.message}`);
            }
        }
        if (results.length > 0) {
            const bestResult = results.reduce((best, current) => current.confidence > best.confidence ? current : best);
            this.logger.log(`Using best result from ${bestResult.strategy} (confidence: ${bestResult.confidence.toFixed(2)})`);
            return bestResult.transcription;
        }
        throw new Error('All ASR strategies failed for wayuunaiki audio');
    }
    getWayuuPrompt() {
        return `Audio en idioma wayuunaiki (también conocido como guajiro), idioma indígena de la familia arawak hablado por el pueblo wayuu en Colombia y Venezuela. Palabras comunes incluyen: ${this.wayuuCommonWords.slice(0, 10).join(', ')}.`;
    }
    async postProcessWayuuText(text) {
        if (!this.config.enablePhoneticCorrection && !this.config.enableWayuuDictionary) {
            return text;
        }
        let processedText = text.toLowerCase().trim();
        if (this.config.enablePhoneticCorrection) {
            for (const [spanish, wayuu] of this.phoneticMappings) {
                const regex = new RegExp(spanish, 'gi');
                processedText = processedText.replace(regex, wayuu);
            }
        }
        if (this.config.enableWayuuDictionary) {
            processedText = this.correctWithWayuuDictionary(processedText);
        }
        processedText = this.cleanTranscription(processedText);
        return processedText;
    }
    correctWithWayuuDictionary(text) {
        let correctedText = text;
        const words = text.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
            const word = words[i].toLowerCase().replace(/[^\w]/g, '');
            const bestMatch = this.findBestWayuuMatch(word);
            if (bestMatch && this.calculateSimilarity(word, bestMatch) > 0.7) {
                correctedText = correctedText.replace(new RegExp(`\\b${words[i]}\\b`, 'gi'), bestMatch);
            }
        }
        return correctedText;
    }
    findBestWayuuMatch(word) {
        let bestMatch = null;
        let bestSimilarity = 0;
        for (const wayuuWord of this.wayuuCommonWords) {
            const similarity = this.calculateSimilarity(word, wayuuWord);
            if (similarity > bestSimilarity && similarity > 0.6) {
                bestSimilarity = similarity;
                bestMatch = wayuuWord;
            }
        }
        return bestMatch;
    }
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1.0;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i++)
            matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++)
            matrix[j][0] = j;
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
            }
        }
        return matrix[str2.length][str1.length];
    }
    estimateWayuuConfidence(processedText, originalText) {
        let confidence = 0.5;
        const wayuuWordCount = this.wayuuCommonWords.filter(word => processedText.toLowerCase().includes(word.toLowerCase())).length;
        confidence += Math.min(wayuuWordCount * 0.1, 0.3);
        if (processedText.length > 10)
            confidence += 0.1;
        if (processedText.split(' ').length > 3)
            confidence += 0.1;
        const changeRatio = this.calculateSimilarity(originalText, processedText);
        confidence += changeRatio * 0.2;
        return Math.min(confidence, 1.0);
    }
    cleanTranscription(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\-']/g, '')
            .trim();
    }
    getConfiguration() {
        return { ...this.config };
    }
    getAvailableStrategies() {
        return this.strategies.map(s => s.constructor.name);
    }
    getWayuuVocabularySize() {
        return this.wayuuCommonWords.length;
    }
    addWayuuWords(words) {
        this.wayuuCommonWords.push(...words);
        this.logger.log(`Added ${words.length} words to Wayuu vocabulary`);
    }
};
exports.WayuuOptimizedAsrStrategy = WayuuOptimizedAsrStrategy;
exports.WayuuOptimizedAsrStrategy = WayuuOptimizedAsrStrategy = WayuuOptimizedAsrStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], WayuuOptimizedAsrStrategy);
//# sourceMappingURL=wayuu-optimized-asr.strategy.js.map
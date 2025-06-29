"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TranslationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const translation_service_1 = require("./translation.service");
const translate_dto_1 = require("./dto/translate.dto");
let TranslationController = TranslationController_1 = class TranslationController {
    constructor(translationService) {
        this.translationService = translationService;
        this.logger = new common_1.Logger(TranslationController_1.name);
    }
    async translate(translateDto) {
        this.logger.log(`Translation request: ${translateDto.text} (${translateDto.direction})`);
        return this.translationService.translate(translateDto);
    }
    async analyzePhonetics(phoneticDto) {
        this.logger.log(`Phonetic analysis request: ${phoneticDto.text}`);
        try {
            const analysis = await this.translationService.analyzePhonetics(phoneticDto);
            return {
                success: true,
                data: analysis,
                message: `Phonetic analysis completed for "${phoneticDto.text}"`
            };
        }
        catch (error) {
            this.logger.error(`Phonetic analysis error: ${error.message}`);
            return {
                success: false,
                data: null,
                message: `Error in phonetic analysis: ${error.message}`
            };
        }
    }
    async generateExercises(exerciseDto) {
        this.logger.log(`Learning exercise request: ${exerciseDto.exerciseType} (${exerciseDto.difficulty})`);
        try {
            const exercises = await this.translationService.generateLearningExercise(exerciseDto);
            return {
                success: true,
                data: exercises,
                message: `Generated ${exercises.length} ${exerciseDto.exerciseType} exercises`
            };
        }
        catch (error) {
            this.logger.error(`Exercise generation error: ${error.message}`);
            return {
                success: false,
                data: [],
                message: `Error generating exercises: ${error.message}`
            };
        }
    }
    async getPhoneticPatterns(difficulty) {
        this.logger.log(`Phonetic patterns request: difficulty=${difficulty || 'all'}`);
        try {
            const patterns = {
                vowels: ['a', 'e', 'i', 'o', 'u', 'ü'],
                consonants: ['ch', 'j', 'k', 'l', 'm', 'n', 'ñ', 'p', 'r', 's', 'sh', 't', 'w', 'y'],
                specialChars: ['ꞌ'],
                commonCombinations: [
                    { pattern: 'ch-a', frequency: 'high', difficulty: 'medium' },
                    { pattern: 'ü-n', frequency: 'medium', difficulty: 'hard' },
                    { pattern: 'sh-i', frequency: 'medium', difficulty: 'medium' },
                    { pattern: 'ꞌ-a', frequency: 'high', difficulty: 'hard' }
                ],
                stressPatterns: [
                    { type: 'penultimate', description: 'Acento en penúltima sílaba', frequency: 'high' },
                    { type: 'ultimate', description: 'Acento en última sílaba', frequency: 'medium' }
                ]
            };
            let filteredPatterns = patterns;
            if (difficulty) {
                filteredPatterns = {
                    ...patterns,
                    commonCombinations: patterns.commonCombinations.filter(p => p.difficulty === difficulty)
                };
            }
            return {
                success: true,
                data: filteredPatterns,
                message: `Retrieved phonetic patterns${difficulty ? ` for ${difficulty} level` : ''}`
            };
        }
        catch (error) {
            this.logger.error(`Error getting phonetic patterns: ${error.message}`);
            return {
                success: false,
                data: null,
                message: `Error retrieving phonetic patterns: ${error.message}`
            };
        }
    }
    async getLearningProgress(userId) {
        this.logger.log(`Learning progress request for user: ${userId || 'anonymous'}`);
        try {
            const progress = {
                userId: userId || 'anonymous',
                completedExercises: {
                    pronunciation: 0,
                    listening: 0,
                    vocabulary: 0,
                    patternRecognition: 0
                },
                currentLevel: 'beginner',
                strengths: ['vocabulary', 'basic pronunciation'],
                weaknesses: ['complex phonemes', 'stress patterns'],
                recommendations: [
                    'Practice words with oclusión glotal (ꞌ)',
                    'Focus on distinguishing ü from other vowels',
                    'Work on penultimate stress patterns'
                ],
                nextExercises: [
                    { type: 'pronunciation', difficulty: 'beginner', focus: 'basic vowels' },
                    { type: 'listening', difficulty: 'beginner', focus: 'short phrases' }
                ]
            };
            return {
                success: true,
                data: progress,
                message: `Learning progress retrieved for ${userId || 'anonymous user'}`
            };
        }
        catch (error) {
            this.logger.error(`Error getting learning progress: ${error.message}`);
            return {
                success: false,
                data: null,
                message: `Error retrieving learning progress: ${error.message}`
            };
        }
    }
    async getHealth() {
        return this.translationService.getHealthStatus();
    }
    async getDatasets() {
        return this.translationService.getAvailableDatasets();
    }
};
exports.TranslationController = TranslationController;
__decorate([
    (0, common_1.Post)('translate'),
    (0, swagger_1.ApiOperation)({ summary: 'Translate text between Wayuu and Spanish' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Translation successful',
        type: translate_dto_1.TranslationResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad request - invalid input',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [translate_dto_1.TranslateDto]),
    __metadata("design:returntype", Promise)
], TranslationController.prototype, "translate", null);
__decorate([
    (0, common_1.Post)('phonetic-analysis'),
    (0, swagger_1.ApiOperation)({ summary: 'Analyze phonetic patterns of Wayuu text' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Phonetic analysis completed successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [translate_dto_1.PhoneticAnalysisDto]),
    __metadata("design:returntype", Promise)
], TranslationController.prototype, "analyzePhonetics", null);
__decorate([
    (0, common_1.Post)('learning-exercises'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate learning exercises for Wayuu language' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Learning exercises generated successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [translate_dto_1.LearningExerciseDto]),
    __metadata("design:returntype", Promise)
], TranslationController.prototype, "generateExercises", null);
__decorate([
    (0, common_1.Get)('phonetic-patterns'),
    (0, swagger_1.ApiOperation)({ summary: 'Get common Wayuu phonetic patterns' }),
    (0, swagger_1.ApiQuery)({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard'] }),
    __param(0, (0, common_1.Query)('difficulty')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TranslationController.prototype, "getPhoneticPatterns", null);
__decorate([
    (0, common_1.Get)('learning-progress'),
    (0, swagger_1.ApiOperation)({ summary: 'Get learning progress and recommendations' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TranslationController.prototype, "getLearningProgress", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Health check for translation service' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TranslationController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('datasets'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available datasets information' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TranslationController.prototype, "getDatasets", null);
exports.TranslationController = TranslationController = TranslationController_1 = __decorate([
    (0, swagger_1.ApiTags)('translation'),
    (0, common_1.Controller)('translation'),
    __metadata("design:paramtypes", [translation_service_1.TranslationService])
], TranslationController);
//# sourceMappingURL=translation.controller.js.map
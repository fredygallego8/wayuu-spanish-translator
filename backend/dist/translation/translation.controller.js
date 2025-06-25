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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const translation_service_1 = require("./translation.service");
const translate_dto_1 = require("./dto/translate.dto");
let TranslationController = class TranslationController {
    constructor(translationService) {
        this.translationService = translationService;
    }
    async translate(translateDto) {
        return this.translationService.translate(translateDto);
    }
    async healthCheck() {
        return this.translationService.getHealthStatus();
    }
    async getAvailableDatasets() {
        return this.translationService.getAvailableDatasets();
    }
};
exports.TranslationController = TranslationController;
__decorate([
    (0, common_1.Post)('translate'),
    (0, swagger_1.ApiOperation)({ summary: 'Translate text between Wayuu and Spanish' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Translation completed successfully',
        type: translate_dto_1.TranslationResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid input data',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [translate_dto_1.TranslateDto]),
    __metadata("design:returntype", Promise)
], TranslationController.prototype, "translate", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Check translation service health' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Service is healthy',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TranslationController.prototype, "healthCheck", null);
__decorate([
    (0, common_1.Get)('datasets'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available datasets information' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of available datasets',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TranslationController.prototype, "getAvailableDatasets", null);
exports.TranslationController = TranslationController = __decorate([
    (0, swagger_1.ApiTags)('Translation'),
    (0, common_1.Controller)('translation'),
    __metadata("design:paramtypes", [translation_service_1.TranslationService])
], TranslationController);
//# sourceMappingURL=translation.controller.js.map
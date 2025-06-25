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
var TranslationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationService = void 0;
const common_1 = require("@nestjs/common");
const translate_dto_1 = require("./dto/translate.dto");
const datasets_service_1 = require("../datasets/datasets.service");
let TranslationService = TranslationService_1 = class TranslationService {
    constructor(datasetsService) {
        this.datasetsService = datasetsService;
        this.logger = new common_1.Logger(TranslationService_1.name);
    }
    async translate(translateDto) {
        const { text, direction, preferredDataset } = translateDto;
        this.logger.log(`Translating text: "${text}" - Direction: ${direction}`);
        try {
            const translation = await this.findTranslation(text, direction, preferredDataset);
            if (!translation) {
                return this.generateFallbackTranslation(text, direction);
            }
            return {
                originalText: text,
                translatedText: translation.translatedText,
                direction,
                confidence: translation.confidence,
                sourceDataset: translation.sourceDataset,
                alternatives: translation.alternatives,
                contextInfo: translation.contextInfo,
            };
        }
        catch (error) {
            this.logger.error(`Translation error: ${error.message}`);
            throw new common_1.BadRequestException('Translation failed');
        }
    }
    async findTranslation(text, direction, preferredDataset) {
        const exactMatch = await this.datasetsService.findExactMatch(text, direction, preferredDataset);
        if (exactMatch) {
            return exactMatch;
        }
        const fuzzyMatch = await this.datasetsService.findFuzzyMatch(text, direction, preferredDataset);
        if (fuzzyMatch) {
            return fuzzyMatch;
        }
        return null;
    }
    generateFallbackTranslation(text, direction) {
        return {
            originalText: text,
            translatedText: direction === translate_dto_1.TranslationDirection.WAYUU_TO_SPANISH
                ? `[Translation not found for: ${text}]`
                : `[Traducción no encontrada para: ${text}]`,
            direction,
            confidence: 0.1,
            sourceDataset: 'fallback',
            contextInfo: 'Translation not found in available datasets. Consider adding this phrase to improve the translator.',
        };
    }
    async getHealthStatus() {
        const datasets = await this.datasetsService.getLoadedDatasets();
        return {
            status: 'healthy',
            datasets,
        };
    }
    async getAvailableDatasets() {
        return this.datasetsService.getDatasetInfo();
    }
};
exports.TranslationService = TranslationService;
exports.TranslationService = TranslationService = TranslationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [datasets_service_1.DatasetsService])
], TranslationService);
//# sourceMappingURL=translation.service.js.map
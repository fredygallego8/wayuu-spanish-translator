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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningExerciseDto = exports.PhoneticAnalysisDto = exports.TranslationResponseDto = exports.TranslateDto = exports.TranslationDirection = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var TranslationDirection;
(function (TranslationDirection) {
    TranslationDirection["WAYUU_TO_SPANISH"] = "wayuu-to-spanish";
    TranslationDirection["SPANISH_TO_WAYUU"] = "spanish-to-wayuu";
})(TranslationDirection || (exports.TranslationDirection = TranslationDirection = {}));
class TranslateDto {
}
exports.TranslateDto = TranslateDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Text to translate',
        example: 'wayuu',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TranslateDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Translation direction',
        enum: TranslationDirection,
        example: TranslationDirection.WAYUU_TO_SPANISH,
    }),
    (0, class_validator_1.IsEnum)(TranslationDirection),
    __metadata("design:type", String)
], TranslateDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Preferred dataset to use for translation',
        required: false,
        example: 'main',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranslateDto.prototype, "preferredDataset", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], TranslateDto.prototype, "includePhoneticAnalysis", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], TranslateDto.prototype, "includeLearningHints", void 0);
class TranslationResponseDto {
}
exports.TranslationResponseDto = TranslationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Original text provided for translation',
        example: 'wayuu',
    }),
    __metadata("design:type", String)
], TranslationResponseDto.prototype, "originalText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Translated text',
        example: 'persona',
    }),
    __metadata("design:type", String)
], TranslationResponseDto.prototype, "translatedText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Translation direction used',
        enum: TranslationDirection,
    }),
    __metadata("design:type", String)
], TranslationResponseDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Confidence score of the translation (0-1)',
        example: 0.95,
    }),
    __metadata("design:type", Number)
], TranslationResponseDto.prototype, "confidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Source dataset used for translation',
        example: 'main',
    }),
    __metadata("design:type", String)
], TranslationResponseDto.prototype, "sourceDataset", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Alternative translations',
        type: [String],
        required: false,
    }),
    __metadata("design:type", Array)
], TranslationResponseDto.prototype, "alternatives", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional context information',
        required: false,
    }),
    __metadata("design:type", String)
], TranslationResponseDto.prototype, "contextInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Phonetic analysis of the translation',
        required: false,
    }),
    __metadata("design:type", Object)
], TranslationResponseDto.prototype, "phoneticAnalysis", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Learning hints for the translation',
        type: [String],
        required: false,
    }),
    __metadata("design:type", Array)
], TranslationResponseDto.prototype, "learningHints", void 0);
class PhoneticAnalysisDto {
}
exports.PhoneticAnalysisDto = PhoneticAnalysisDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PhoneticAnalysisDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PhoneticAnalysisDto.prototype, "includeStressPatterns", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PhoneticAnalysisDto.prototype, "includeSyllableBreakdown", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PhoneticAnalysisDto.prototype, "includePhonemeMapping", void 0);
class LearningExerciseDto {
}
exports.LearningExerciseDto = LearningExerciseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LearningExerciseDto.prototype, "exerciseType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LearningExerciseDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LearningExerciseDto.prototype, "count", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], LearningExerciseDto.prototype, "focusWords", void 0);
//# sourceMappingURL=translate.dto.js.map
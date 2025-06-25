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
exports.TranslationResponseDto = exports.TranslateDto = exports.TranslationDirection = void 0;
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
        example: 'Tü süchukua wayuu',
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
        description: 'Source dataset to prioritize for translation',
        example: 'orkidea/wayuu_CO_test',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranslateDto.prototype, "preferredDataset", void 0);
class TranslationResponseDto {
}
exports.TranslationResponseDto = TranslationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Original text',
        example: 'Tü süchukua wayuu',
    }),
    __metadata("design:type", String)
], TranslationResponseDto.prototype, "originalText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Translated text',
        example: 'Tú eres una persona wayuu',
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
        example: 0.85,
    }),
    __metadata("design:type", Number)
], TranslationResponseDto.prototype, "confidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Dataset used for translation',
        example: 'orkidea/wayuu_CO_test',
    }),
    __metadata("design:type", String)
], TranslationResponseDto.prototype, "sourceDataset", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Alternative translations if available',
        type: [String],
        required: false,
    }),
    __metadata("design:type", Array)
], TranslationResponseDto.prototype, "alternatives", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cultural or linguistic context information',
        required: false,
    }),
    __metadata("design:type", String)
], TranslationResponseDto.prototype, "contextInfo", void 0);
//# sourceMappingURL=translate.dto.js.map
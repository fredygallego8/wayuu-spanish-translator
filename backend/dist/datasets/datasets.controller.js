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
exports.DatasetsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const datasets_service_1 = require("./datasets.service");
let DatasetsController = class DatasetsController {
    constructor(datasetsService) {
        this.datasetsService = datasetsService;
    }
    async getDatasetInfo() {
        const response = await this.datasetsService.getDatasetInfo();
        return {
            success: true,
            data: response,
            message: 'Datasets information retrieved successfully'
        };
    }
    async getDictionaryStats() {
        const response = await this.datasetsService.getDictionaryStats();
        return {
            success: true,
            data: response,
            message: 'Dictionary statistics retrieved successfully'
        };
    }
    async reloadDataset() {
        try {
            await this.datasetsService.reloadDataset();
            const stats = await this.datasetsService.getDictionaryStats();
            return {
                success: true,
                data: {
                    message: 'Dataset reload completed',
                    timestamp: new Date().toISOString(),
                    totalEntries: stats.totalEntries,
                    loadingMethods: stats.loadingMethods
                },
                message: 'Dataset reloaded successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Failed to reload dataset'
            };
        }
    }
};
exports.DatasetsController = DatasetsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get available datasets information' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of available datasets',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "getDatasetInfo", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dictionary statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dictionary statistics',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "getDictionaryStats", null);
__decorate([
    (0, common_1.Post)('reload'),
    (0, swagger_1.ApiOperation)({ summary: 'Reload dataset from Hugging Face' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dataset reloaded successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Failed to reload dataset',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "reloadDataset", null);
exports.DatasetsController = DatasetsController = __decorate([
    (0, swagger_1.ApiTags)('Datasets'),
    (0, common_1.Controller)('datasets'),
    __metadata("design:paramtypes", [datasets_service_1.DatasetsService])
], DatasetsController);
//# sourceMappingURL=datasets.controller.js.map
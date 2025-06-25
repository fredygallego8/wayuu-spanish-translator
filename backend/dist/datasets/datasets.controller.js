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
    async reloadDataset(clearCache) {
        const result = await this.datasetsService.reloadDataset(clearCache === true);
        if (result.success) {
            const stats = await this.datasetsService.getDictionaryStats();
            return {
                success: true,
                data: {
                    message: result.message,
                    timestamp: new Date().toISOString(),
                    totalEntries: result.totalEntries,
                    loadingMethods: stats.loadingMethods,
                    cacheCleared: clearCache === true
                },
                message: 'Dataset reloaded successfully'
            };
        }
        else {
            return {
                success: false,
                error: result.message,
                message: 'Failed to reload dataset'
            };
        }
    }
    async getCacheInfo() {
        const cacheInfo = await this.datasetsService.getCacheInfo();
        return {
            success: true,
            data: cacheInfo,
            message: cacheInfo.exists ? 'Cache information retrieved' : 'No cache found'
        };
    }
    async clearCache() {
        try {
            await this.datasetsService.clearCache();
            return {
                success: true,
                data: {
                    message: 'Cache cleared successfully',
                    timestamp: new Date().toISOString()
                },
                message: 'Cache cleared successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Failed to clear cache'
            };
        }
    }
    async getAudioInfo() {
        const response = await this.datasetsService.getAudioDatasetInfo();
        return {
            success: true,
            data: response,
            message: 'Audio dataset information retrieved successfully'
        };
    }
    async getAudioStats() {
        const response = await this.datasetsService.getAudioStats();
        return {
            success: true,
            data: response,
            message: 'Audio statistics retrieved successfully'
        };
    }
    async getAudioEntries(page, limit) {
        const pageNum = Math.max(1, page || 1);
        const limitNum = Math.min(100, Math.max(1, limit || 20));
        const response = await this.datasetsService.getAudioEntries(pageNum, limitNum);
        return {
            success: true,
            data: response,
            message: 'Audio entries retrieved successfully'
        };
    }
    async searchAudio(query, limit) {
        if (!query || query.trim().length === 0) {
            return {
                success: false,
                error: 'Search query is required',
                message: 'Please provide a search query'
            };
        }
        const limitNum = Math.min(50, Math.max(1, limit || 10));
        const response = await this.datasetsService.searchAudioByTranscription(query.trim(), limitNum);
        return {
            success: true,
            data: response,
            message: `Found ${response.results.length} audio entries matching "${query}"`
        };
    }
    async reloadAudioDataset(clearCache) {
        const result = await this.datasetsService.reloadAudioDataset(clearCache === true);
        return {
            success: result.success,
            data: result.success ? {
                message: result.message,
                timestamp: new Date().toISOString(),
                totalAudioEntries: result.totalAudioEntries,
                cacheCleared: clearCache === true
            } : null,
            error: result.success ? null : result.message,
            message: result.success ? 'Audio dataset reloaded successfully' : 'Failed to reload audio dataset'
        };
    }
    async getAudioCacheInfo() {
        const cacheInfo = await this.datasetsService.getAudioCacheInfo();
        return {
            success: true,
            data: cacheInfo,
            message: cacheInfo.exists ? 'Audio cache information retrieved' : 'No audio cache found'
        };
    }
    async clearAudioCache() {
        try {
            await this.datasetsService.clearAudioCache();
            return {
                success: true,
                data: {
                    message: 'Audio cache cleared successfully',
                    timestamp: new Date().toISOString()
                },
                message: 'Audio cache cleared successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Failed to clear audio cache'
            };
        }
    }
    async getHuggingFaceSources() {
        const sources = this.datasetsService.getHuggingFaceSources();
        return {
            success: true,
            data: {
                sources,
                totalSources: sources.length,
                activeSources: sources.filter(s => s.isActive).length
            },
            message: 'Hugging Face sources retrieved successfully'
        };
    }
    async getActiveHuggingFaceSources() {
        const sources = this.datasetsService.getActiveHuggingFaceSources();
        return {
            success: true,
            data: {
                sources,
                totalActiveSources: sources.length
            },
            message: 'Active Hugging Face sources retrieved successfully'
        };
    }
    async toggleHuggingFaceSource(id) {
        try {
            const result = this.datasetsService.toggleHuggingFaceSource(id);
            if (result.success) {
                return {
                    success: true,
                    data: result,
                    message: `Source ${id} ${result.isActive ? 'activated' : 'deactivated'} successfully`
                };
            }
            else {
                return {
                    success: false,
                    message: `Source ${id} not found`
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Error toggling source: ${error.message}`
            };
        }
    }
    async loadAdditionalDataset(id) {
        try {
            const result = await this.datasetsService.loadAdditionalDataset(id);
            return {
                success: result.success,
                data: result,
                message: result.message
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Error loading additional dataset: ${error.message}`
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
    (0, swagger_1.ApiQuery)({
        name: 'clearCache',
        required: false,
        type: Boolean,
        description: 'Clear cache before reloading'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dataset reloaded successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Failed to reload dataset',
    }),
    __param(0, (0, common_1.Query)('clearCache')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "reloadDataset", null);
__decorate([
    (0, common_1.Get)('cache'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cache information' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cache information retrieved successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "getCacheInfo", null);
__decorate([
    (0, common_1.Post)('cache/clear'),
    (0, swagger_1.ApiOperation)({ summary: 'Clear dataset cache' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cache cleared successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "clearCache", null);
__decorate([
    (0, common_1.Get)('audio'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audio dataset information' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audio dataset information retrieved successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "getAudioInfo", null);
__decorate([
    (0, common_1.Get)('audio/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audio dataset statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audio dataset statistics',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "getAudioStats", null);
__decorate([
    (0, common_1.Get)('audio/entries'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audio entries with pagination' }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        type: Number,
        description: 'Page number (default: 1)'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Items per page (default: 20, max: 100)'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audio entries retrieved successfully',
    }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "getAudioEntries", null);
__decorate([
    (0, common_1.Get)('audio/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search audio entries by transcription' }),
    (0, swagger_1.ApiQuery)({
        name: 'q',
        required: true,
        type: String,
        description: 'Search query'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Max results (default: 10, max: 50)'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audio search results',
    }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "searchAudio", null);
__decorate([
    (0, common_1.Post)('audio/reload'),
    (0, swagger_1.ApiOperation)({ summary: 'Reload audio dataset from Hugging Face' }),
    (0, swagger_1.ApiQuery)({
        name: 'clearCache',
        required: false,
        type: Boolean,
        description: 'Clear audio cache before reloading'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audio dataset reloaded successfully',
    }),
    __param(0, (0, common_1.Query)('clearCache')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "reloadAudioDataset", null);
__decorate([
    (0, common_1.Get)('audio/cache'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audio cache information' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audio cache information retrieved successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "getAudioCacheInfo", null);
__decorate([
    (0, common_1.Post)('audio/cache/clear'),
    (0, swagger_1.ApiOperation)({ summary: 'Clear audio dataset cache' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audio cache cleared successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "clearAudioCache", null);
__decorate([
    (0, common_1.Get)('sources'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all Hugging Face sources' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Hugging Face sources retrieved successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "getHuggingFaceSources", null);
__decorate([
    (0, common_1.Get)('sources/active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active Hugging Face sources' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Active Hugging Face sources retrieved successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "getActiveHuggingFaceSources", null);
__decorate([
    (0, common_1.Post)('sources/:id/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle Hugging Face source active status' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Source status toggled successfully',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "toggleHuggingFaceSource", null);
__decorate([
    (0, common_1.Post)('sources/:id/load'),
    (0, swagger_1.ApiOperation)({ summary: 'Load additional dataset from Hugging Face source' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Additional dataset loaded successfully',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "loadAdditionalDataset", null);
exports.DatasetsController = DatasetsController = __decorate([
    (0, swagger_1.ApiTags)('Datasets'),
    (0, common_1.Controller)('datasets'),
    __metadata("design:paramtypes", [datasets_service_1.DatasetsService])
], DatasetsController);
//# sourceMappingURL=datasets.controller.js.map
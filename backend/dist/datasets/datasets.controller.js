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
var DatasetsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const datasets_service_1 = require("./datasets.service");
const audio_duration_service_1 = require("./audio-duration.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const translate_dto_1 = require("../translation/dto/translate.dto");
let DatasetsController = DatasetsController_1 = class DatasetsController {
    constructor(datasetsService, audioDurationService) {
        this.datasetsService = datasetsService;
        this.audioDurationService = audioDurationService;
        this.logger = new common_1.Logger(DatasetsController_1.name);
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
    async reloadDataset(body, user) {
        this.logger.log(`🔄 Admin ${user.email} solicitó recarga del dataset (clearCache: ${body.clearCache || false})`);
        const result = await this.datasetsService.reloadDataset(body.clearCache || false);
        return {
            ...result,
            reloadedBy: user.email,
            timestamp: new Date().toISOString()
        };
    }
    async getCacheInfo() {
        const cacheInfo = await this.datasetsService.getCacheInfo();
        return {
            success: true,
            data: cacheInfo,
            message: cacheInfo.exists ? 'Cache information retrieved' : 'No cache found'
        };
    }
    async clearCache(user) {
        this.logger.log(`🗑️ Admin ${user.email} solicitó limpieza del cache`);
        await this.datasetsService.clearCache();
        return {
            success: true,
            message: 'Cache limpiado exitosamente',
            clearedBy: user.email,
            timestamp: new Date().toISOString()
        };
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
        const sources = await this.datasetsService.getHuggingFaceSources();
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
            const result = await this.datasetsService.loadAdditionalDataset(id, false);
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
    async loadFullAdditionalDataset(id) {
        try {
            const result = await this.datasetsService.loadAdditionalDataset(id, true);
            return {
                success: result.success,
                data: result,
                message: result.message
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Error loading complete additional dataset: ${error.message}`
            };
        }
    }
    async getAudioDownloadStats() {
        try {
            const stats = await this.datasetsService.getAudioDownloadStats();
            return {
                success: true,
                data: stats,
                message: 'Audio download statistics retrieved successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Error getting audio download stats: ${error.message}`
            };
        }
    }
    async downloadAudioBatch(body) {
        try {
            const { audioIds, batchSize = 5 } = body;
            const result = await this.datasetsService.downloadAudioBatch(audioIds, batchSize);
            return {
                success: result.success,
                data: result,
                message: result.message
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Error downloading audio batch: ${error.message}`
            };
        }
    }
    async downloadAllAudio(body = {}) {
        try {
            const { batchSize = 5 } = body;
            const result = await this.datasetsService.downloadAllAudio(batchSize);
            return {
                success: result.success,
                data: result,
                message: result.message
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Error downloading all audio files: ${error.message}`
            };
        }
    }
    async downloadAudioFile(audioId) {
        try {
            const result = await this.datasetsService.downloadAudioFile(audioId);
            return {
                success: result.success,
                data: result,
                message: result.message
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Error downloading audio file: ${error.message}`
            };
        }
    }
    async clearDownloadedAudio() {
        try {
            const result = await this.datasetsService.clearDownloadedAudio();
            return {
                success: result.success,
                data: result,
                message: result.message
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Error clearing downloaded audio: ${error.message}`
            };
        }
    }
    async getAudioDurationStats(user) {
        this.logger.log(`⏱️ Admin ${user.email} consultó estadísticas de duración`);
        const durationCache = this.audioDurationService.getDurationCache();
        return {
            success: true,
            cache: durationCache,
            summary: {
                totalAudioFiles: durationCache.totalCalculated,
                totalDurationSeconds: durationCache.totalDurationSeconds,
                totalDurationMinutes: Math.round((durationCache.totalDurationSeconds / 60) * 100) / 100,
                averageDurationSeconds: durationCache.averageDurationSeconds,
                lastUpdated: durationCache.lastUpdated
            },
            timestamp: new Date().toISOString()
        };
    }
    async recalculateAudioDurations(user) {
        this.logger.log(`🔄 Admin ${user.email} solicitó recálculo de duraciones`);
        const result = await this.audioDurationService.recalculateAllDurations();
        return {
            ...result,
            triggeredBy: user.email,
            timestamp: new Date().toISOString()
        };
    }
    async updateCurrentDatasetDurations(user) {
        this.logger.log(`⚡ Admin ${user.email} solicitó actualización de duraciones del dataset actual`);
        const audioDataset = this.datasetsService['wayuuAudioDataset'] || [];
        await this.audioDurationService.updateAudioDurationCache(audioDataset);
        const durationCache = this.audioDurationService.getDurationCache();
        return {
            success: true,
            updated: durationCache.totalCalculated,
            totalDuration: durationCache.totalDurationSeconds,
            averageDuration: durationCache.averageDurationSeconds,
            message: `Audio durations updated for ${durationCache.totalCalculated} entries`,
            updatedBy: user.email,
            timestamp: new Date().toISOString()
        };
    }
    async searchDictionary(query, direction = translate_dto_1.TranslationDirection.WAYUU_TO_SPANISH) {
        if (!query) {
            throw new common_1.HttpException('Query parameter "q" is required', common_1.HttpStatus.BAD_REQUEST);
        }
        const exactMatch = await this.datasetsService.findExactMatch(query, direction);
        if (exactMatch) {
            return {
                success: true,
                type: 'exact',
                result: exactMatch,
                query: query
            };
        }
        const fuzzyMatch = await this.datasetsService.findFuzzyMatch(query, direction);
        return {
            success: true,
            type: fuzzyMatch ? 'fuzzy' : 'none',
            result: fuzzyMatch,
            query: query
        };
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
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: '🔄 Recargar dataset completo (Admin)',
        description: '🔒 Recarga completamente el dataset, limpiando cache - Solo administradores'
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                clearCache: {
                    type: 'boolean',
                    description: 'Si debe limpiar el cache antes de recargar',
                    default: false
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dataset recargado exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Token de acceso requerido' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Acceso denegado - Requiere rol admin' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
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
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: '🗑️ Limpiar cache de datasets (Admin)',
        description: '🔒 Limpia completamente el cache de datasets - Solo administradores'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cache limpiado exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Token de acceso requerido' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Acceso denegado - Requiere rol admin' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
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
    (0, swagger_1.ApiOperation)({ summary: 'Load additional dataset from Hugging Face source (preview)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Additional dataset preview loaded successfully',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "loadAdditionalDataset", null);
__decorate([
    (0, common_1.Post)('sources/:id/load-full'),
    (0, swagger_1.ApiOperation)({ summary: 'Load complete additional dataset for statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Complete additional dataset loaded successfully',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "loadFullAdditionalDataset", null);
__decorate([
    (0, common_1.Get)('audio/download/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audio download statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audio download statistics retrieved successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "getAudioDownloadStats", null);
__decorate([
    (0, common_1.Post)('audio/download/batch'),
    (0, swagger_1.ApiOperation)({ summary: 'Download multiple audio files in batch' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audio files downloaded successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "downloadAudioBatch", null);
__decorate([
    (0, common_1.Post)('audio/download/all'),
    (0, swagger_1.ApiOperation)({ summary: 'Download all available audio files' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All audio files download initiated',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "downloadAllAudio", null);
__decorate([
    (0, common_1.Post)('audio/download/:audioId'),
    (0, swagger_1.ApiOperation)({ summary: 'Download a specific audio file' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audio file downloaded successfully',
    }),
    __param(0, (0, common_1.Param)('audioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "downloadAudioFile", null);
__decorate([
    (0, common_1.Delete)('audio/download/clear'),
    (0, swagger_1.ApiOperation)({ summary: 'Clear all downloaded audio files' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Downloaded audio files cleared successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "clearDownloadedAudio", null);
__decorate([
    (0, common_1.Get)('audio/duration/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: '⏱️ Estadísticas de duración de audio (Admin)',
        description: '🔒 Obtiene estadísticas detalladas de duración de audios - Solo administradores'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estadísticas de duración obtenidas exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Token de acceso requerido' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Acceso denegado - Requiere rol admin' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "getAudioDurationStats", null);
__decorate([
    (0, common_1.Post)('audio/duration/recalculate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: '🔄 Recalcular duraciones de audio (Admin)',
        description: '🔒 Fuerza el recálculo de todas las duraciones de audio - Solo administradores'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recálculo iniciado exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Token de acceso requerido' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Acceso denegado - Requiere rol admin' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "recalculateAudioDurations", null);
__decorate([
    (0, common_1.Post)('audio/duration/update'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: '⚡ Actualizar duraciones del dataset actual (Admin)',
        description: '🔒 Actualiza las duraciones para el dataset actualmente cargado - Solo administradores'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Duraciones actualizadas exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Token de acceso requerido' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Acceso denegado - Requiere rol admin' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "updateCurrentDatasetDurations", null);
__decorate([
    (0, common_1.Get)('dictionary/search'),
    (0, swagger_1.ApiOperation)({
        summary: '🔍 Buscar en diccionario wayuu-español',
        description: 'Busca términos en el diccionario wayuu-español (auto-carga si es necesario)'
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', description: 'Término a buscar', example: 'wayuu' }),
    (0, swagger_1.ApiQuery)({ name: 'direction', description: 'Dirección de búsqueda', enum: translate_dto_1.TranslationDirection, required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Búsqueda completada exitosamente' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('direction')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DatasetsController.prototype, "searchDictionary", null);
exports.DatasetsController = DatasetsController = DatasetsController_1 = __decorate([
    (0, swagger_1.ApiTags)('📚 Datasets'),
    (0, common_1.Controller)('datasets'),
    __metadata("design:paramtypes", [datasets_service_1.DatasetsService,
        audio_duration_service_1.AudioDurationService])
], DatasetsController);
//# sourceMappingURL=datasets.controller.js.map
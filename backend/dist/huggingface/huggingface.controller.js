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
exports.HuggingfaceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const common_2 = require("@nestjs/common");
const huggingface_service_1 = require("./huggingface.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let HuggingfaceController = class HuggingfaceController {
    constructor(huggingfaceService) {
        this.huggingfaceService = huggingfaceService;
    }
    getStatus() {
        return {
            status: 'active',
            service: this.huggingfaceService.getServiceStatus(),
            timestamp: new Date().toISOString()
        };
    }
    async getCachedFiles() {
        const cachedFiles = await this.huggingfaceService.getCachedFiles();
        return {
            ...cachedFiles,
            location: this.huggingfaceService.getServiceStatus().sourcesDirectory
        };
    }
    async fetchSources(user) {
        const result = await this.huggingfaceService.fetchAndCacheSources();
        return {
            ...result,
            downloadedBy: user.email,
            timestamp: new Date().toISOString()
        };
    }
    async fetchOrkideaDataset(user) {
        const result = await this.huggingfaceService.fetchOrkideaDataset();
        return {
            ...result,
            downloadedBy: user.email,
            timestamp: new Date().toISOString()
        };
    }
};
exports.HuggingfaceController = HuggingfaceController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({
        summary: '📊 Estado del servicio Hugging Face',
        description: 'Obtiene el estado actual del servicio y configuración'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Estado del servicio',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string' },
                service: {
                    type: 'object',
                    properties: {
                        configured: { type: 'boolean' },
                        mode: { type: 'string' },
                        onDemandLoading: { type: 'boolean' }
                    }
                },
                timestamp: { type: 'string' }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HuggingfaceController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('cached-files'),
    (0, swagger_1.ApiOperation)({
        summary: '📄 Archivos en caché',
        description: 'Lista los archivos PDF ya descargados en caché local'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de archivos en caché',
        schema: {
            type: 'object',
            properties: {
                files: { type: 'array', items: { type: 'string' } },
                count: { type: 'number' },
                location: { type: 'string' }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HuggingfaceController.prototype, "getCachedFiles", null);
__decorate([
    (0, common_1.Post)('fetch-sources'),
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: '⬇️ Descargar fuentes principales (Admin)',
        description: '🔒 Descarga y almacena en caché las fuentes del repositorio principal - Solo administradores'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Fuentes descargadas exitosamente',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                files: { type: 'number' },
                location: { type: 'string' },
                downloadedBy: { type: 'string' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Token de acceso requerido' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Acceso denegado - Requiere rol admin' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Error en la configuración' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HuggingfaceController.prototype, "fetchSources", null);
__decorate([
    (0, common_1.Post)('fetch-orkidea-dataset'),
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: '🎵 Descargar dataset Orkidea Wayuu (Admin)',
        description: '🔒 Descarga el dataset orkidea/palabrero-guc-draft con audio wayuu - Solo administradores'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dataset Orkidea descargado exitosamente',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                files: { type: 'number' },
                location: { type: 'string' },
                downloadedBy: { type: 'string' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Token de acceso requerido' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Acceso denegado - Requiere rol admin' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Error al descargar el dataset' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HuggingfaceController.prototype, "fetchOrkideaDataset", null);
exports.HuggingfaceController = HuggingfaceController = __decorate([
    (0, swagger_1.ApiTags)('📚 Datasets'),
    (0, common_1.Controller)('huggingface'),
    __metadata("design:paramtypes", [huggingface_service_1.HuggingfaceService])
], HuggingfaceController);
//# sourceMappingURL=huggingface.controller.js.map
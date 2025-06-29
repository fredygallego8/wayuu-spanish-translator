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
exports.MetricsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const metrics_service_1 = require("./metrics.service");
const datasets_service_1 = require("../datasets/datasets.service");
let MetricsController = class MetricsController {
    constructor(metricsService, datasetsService) {
        this.metricsService = metricsService;
        this.datasetsService = datasetsService;
    }
    async getMetrics() {
        try {
            return await this.metricsService.getMetrics();
        }
        catch (error) {
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Error al obtener métricas',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    getHealth() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            metrics_count: Object.keys(this.metricsService).filter(key => key.includes('Counter') || key.includes('Histogram') || key.includes('Gauge')).length,
            uptime: process.uptime(),
        };
    }
    async updateDatasetMetrics() {
        try {
            await this.datasetsService.updateDatasetMetrics();
            const sources = await this.datasetsService.getHuggingFaceSources();
            const activeSources = sources.filter(s => s.isActive);
            return {
                success: true,
                message: 'Dataset metrics updated successfully',
                timestamp: new Date().toISOString(),
                metrics_updated: {
                    sources: sources.length,
                    active_sources: activeSources.length,
                    dictionary_sources: sources.filter(s => s.type === 'dictionary').length,
                    audio_sources: sources.filter(s => s.type === 'audio').length,
                }
            };
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to update dataset metrics: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.MetricsController = MetricsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Header)('Content-Type', 'text/plain; version=0.0.4; charset=utf-8'),
    (0, swagger_1.ApiOperation)({
        summary: '📊 Obtener métricas de Prometheus',
        description: `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; color: white; margin: 10px 0;">
        <h4>🎯 Endpoint de Métricas para Prometheus</h4>
        <p>Este endpoint expone todas las métricas de la aplicación en formato Prometheus.</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <h4>📈 Métricas Disponibles:</h4>
        <ul>
          <li><strong>wayuu_translations_total:</strong> Total de traducciones realizadas</li>
          <li><strong>wayuu_translation_duration_seconds:</strong> Tiempo de respuesta de traducciones</li>
          <li><strong>wayuu_translation_errors_total:</strong> Errores de traducción</li>
          <li><strong>wayuu_audio_requests_total:</strong> Solicitudes de audio</li>
          <li><strong>wayuu_dictionary_lookups_total:</strong> Búsquedas en diccionario</li>
          <li><strong>wayuu_http_requests_total:</strong> Todas las peticiones HTTP</li>
          <li><strong>wayuu_cache_operations_total:</strong> Operaciones de caché</li>
          <li><strong>wayuu_active_users:</strong> Usuarios activos</li>
          <li><strong>wayuu_huggingface_operations_total:</strong> Operaciones con Hugging Face</li>
          <li>Y muchas más métricas del sistema...</li>
        </ul>
      </div>

      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <h4>🔧 Configuración de Prometheus:</h4>
        <pre style="background: #263238; color: #ffffff; padding: 10px; border-radius: 4px; overflow-x: auto;">
scrape_configs:
  - job_name: 'wayuu-translator'
    static_configs:
      - targets: ['localhost:3002']
    metrics_path: '/api/metrics'
    scrape_interval: 15s</pre>
      </div>
    `,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Métricas en formato Prometheus',
        content: {
            'text/plain': {
                example: `# HELP wayuu_translations_total Total number of translations performed
# TYPE wayuu_translations_total counter
wayuu_translations_total{direction="wayuu_to_spanish",source_lang="wayuu",target_lang="spanish",status="success"} 142

# HELP wayuu_translation_duration_seconds Duration of translation requests in seconds
# TYPE wayuu_translation_duration_seconds histogram
wayuu_translation_duration_seconds_bucket{direction="wayuu_to_spanish",source_lang="wayuu",target_lang="spanish",le="0.1"} 45
wayuu_translation_duration_seconds_bucket{direction="wayuu_to_spanish",source_lang="wayuu",target_lang="spanish",le="0.5"} 120
wayuu_translation_duration_seconds_bucket{direction="wayuu_to_spanish",source_lang="wayuu",target_lang="spanish",le="+Inf"} 142

# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 0.123456

# HELP nodejs_heap_size_used_bytes Process heap space used in bytes.
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes 12345678`,
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Error interno del servidor al obtener métricas',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({
        summary: '🏥 Estado de salud del sistema de métricas',
        description: 'Endpoint simple para verificar que el sistema de métricas está funcionando correctamente.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sistema de métricas funcionando correctamente',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'healthy' },
                timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
                metrics_count: { type: 'number', example: 15 },
                uptime: { type: 'number', example: 3600.5 },
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Post)('datasets/update'),
    (0, swagger_1.ApiOperation)({
        summary: '🔄 Update Dataset Metrics',
        description: `
      Actualiza todas las métricas relacionadas con datasets en Prometheus.
      Incluye métricas de:
      - Fuentes de Hugging Face
      - Estadísticas de diccionario y audio
      - Estado de cache
      - Progreso de descargas
    `,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Métricas de datasets actualizadas exitosamente',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Dataset metrics updated successfully' },
                timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
                metrics_updated: {
                    type: 'object',
                    properties: {
                        sources: { type: 'number', example: 5 },
                        active_sources: { type: 'number', example: 4 },
                        dictionary_entries: { type: 'number', example: 2150 },
                        audio_entries: { type: 'number', example: 827 },
                    }
                }
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "updateDatasetMetrics", null);
exports.MetricsController = MetricsController = __decorate([
    (0, swagger_1.ApiTags)('📊 Metrics'),
    (0, common_1.Controller)('metrics'),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService,
        datasets_service_1.DatasetsService])
], MetricsController);
//# sourceMappingURL=metrics.controller.js.map
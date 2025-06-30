import { Controller, Get, Header, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { DatasetsService } from '../datasets/datasets.service';

@ApiTags('📊 Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly datasetsService: DatasetsService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({
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
  })
  @ApiResponse({
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
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor al obtener métricas',
  })
  async getMetrics(): Promise<string> {
    try {
      return await this.metricsService.getMetrics();
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error al obtener métricas',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @ApiOperation({
    summary: '🏥 Estado de salud del sistema de métricas',
    description: 'Endpoint simple para verificar que el sistema de métricas está funcionando correctamente.',
  })
  @ApiResponse({
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
  })
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics_count: Object.keys(this.metricsService).filter(key =>
        key.includes('Counter') || key.includes('Histogram') || key.includes('Gauge')
      ).length,
      uptime: process.uptime(),
    };
  }
  
  @Post('datasets/update')
  @ApiOperation({
    summary: '🔄 Update Dataset Metrics',
    description: `
      Actualiza todas las métricas relacionadas con datasets en Prometheus.
      Incluye métricas de:
      - Fuentes de Hugging Face
      - Estadísticas de diccionario y audio
      - Estado de cache
      - Progreso de descargas
    `,
  })
  @ApiResponse({
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
  })
  async updateDatasetMetrics(): Promise<any> {
    try {
      await this.datasetsService.updateDatasetMetrics();
      
      // Obtener stats para la respuesta
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
    } catch (error) {
      throw new HttpException(
        `Failed to update dataset metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('growth/update')
  @ApiOperation({
    summary: '📈 Update Growth Metrics',
    description: `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; color: white; margin: 10px 0;">
        <h4>🚀 Dashboard de Crecimiento del Proyecto Wayuu</h4>
        <p>Actualiza todas las métricas de crecimiento para el dashboard de Grafana.</p>
      </div>
      
      Calcula y actualiza métricas de:
      - Total de palabras únicas en Wayuu
      - Total de palabras únicas en Español
      - Duración total de audio en minutos
      - Total de frases/transcripciones
      - Total de archivos de audio transcritos
      - Total de entradas de diccionario
      - Total de archivos de audio
      - Timestamp de última actualización
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de crecimiento actualizadas exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Growth metrics updated successfully' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        metrics: {
          type: 'object',
          properties: {
            total_wayuu_words: { type: 'number', example: 1250 },
            total_spanish_words: { type: 'number', example: 1180 },
            total_audio_minutes: { type: 'number', example: 36.5 },
            total_phrases: { type: 'number', example: 2993 },
            total_transcribed: { type: 'number', example: 827 },
            total_dictionary_entries: { type: 'number', example: 91697 },
            total_audio_files: { type: 'number', example: 827 },
          }
        }
      },
    },
  })
  async updateGrowthMetrics(): Promise<any> {
    try {
      // Obtener fuentes activas
      const activeSources = await this.datasetsService.getActiveHuggingFaceSources();
      
      let totalWayuuWords = 0;
      let totalSpanishWords = 0;
      let totalAudioMinutes = 0;
      let totalPhrases = 0;
      let totalTranscribed = 0;
      let totalDictionaryEntries = 0;
      let totalAudioFiles = 0;

      // Calcular métricas agregadas de todas las fuentes activas
      for (const source of activeSources) {
        try {
          const stats = await this.datasetsService.getDatasetStats(source.name);
          
          if (source.type === 'dictionary') {
            totalDictionaryEntries += stats.dictionary_entries || 0;
            totalWayuuWords += stats.wayuu_words || 0;
            totalSpanishWords += stats.spanish_words || 0;
            totalPhrases += stats.phrases || 0;
          } else if (source.type === 'audio') {
            totalAudioFiles += stats.audio_files || 0;
            totalAudioMinutes += stats.audio_minutes || 0;
            totalTranscribed += stats.transcribed || 0;
            // Para audio, también añadir palabras Wayuu de las transcripciones
            totalWayuuWords += stats.wayuu_words || 0;
            // Y frases de las transcripciones
            totalPhrases += stats.phrases || 0;
          }
        } catch (error) {
          console.warn(`Error getting stats for ${source.name}:`, error.message);
        }
      }

      // Actualizar métricas de Prometheus
      this.metricsService.updateGrowthMetric('wayuu_total_words_wayuu', totalWayuuWords);
      this.metricsService.updateGrowthMetric('wayuu_total_words_spanish', totalSpanishWords);
      this.metricsService.updateGrowthMetric('wayuu_total_audio_minutes', totalAudioMinutes);
      this.metricsService.updateGrowthMetric('wayuu_total_phrases', totalPhrases);
      this.metricsService.updateGrowthMetric('wayuu_total_transcribed', totalTranscribed);
      this.metricsService.updateGrowthMetric('wayuu_total_dictionary_entries', totalDictionaryEntries);
      this.metricsService.updateGrowthMetric('wayuu_total_audio_files', totalAudioFiles);
      this.metricsService.updateGrowthMetric('wayuu_growth_last_update_timestamp', Date.now());

      return {
        success: true,
        message: 'Growth metrics updated successfully',
        timestamp: new Date().toISOString(),
        metrics: {
          total_wayuu_words: totalWayuuWords,
          total_spanish_words: totalSpanishWords,
          total_audio_minutes: Math.round(totalAudioMinutes * 100) / 100,
          total_phrases: totalPhrases,
          total_transcribed: totalTranscribed,
          total_dictionary_entries: totalDictionaryEntries,
          total_audio_files: totalAudioFiles,
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update growth metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('growth')
  @ApiOperation({
    summary: '📊 Get Growth Dashboard Data',
    description: `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; color: white; margin: 10px 0;">
        <h4>📈 Dashboard de Crecimiento del Proyecto Wayuu</h4>
        <p>Obtiene datos actuales para el dashboard de crecimiento de Grafana.</p>
      </div>
      
      Retorna métricas actuales de:
      - Palabras únicas en Wayuu y Español
      - Duración total de audio
      - Frases y transcripciones
      - Archivos de audio y entradas de diccionario
      - Información de fuentes de datos
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Datos del dashboard de crecimiento',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            current_metrics: {
              type: 'object',
              properties: {
                total_wayuu_words: { type: 'number', example: 1250 },
                total_spanish_words: { type: 'number', example: 1180 },
                total_audio_minutes: { type: 'number', example: 36.5 },
                total_phrases: { type: 'number', example: 2993 },
                total_transcribed: { type: 'number', example: 827 },
                total_dictionary_entries: { type: 'number', example: 91697 },
                total_audio_files: { type: 'number', example: 827 },
              }
            },
            sources_info: {
              type: 'object',
              properties: {
                total_sources: { type: 'number', example: 5 },
                active_sources: { type: 'number', example: 5 },
                dictionary_sources: { type: 'number', example: 3 },
                audio_sources: { type: 'number', example: 2 },
              }
            },
            last_updated: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
          }
        }
      },
    },
  })
  async getGrowthDashboard(): Promise<any> {
    try {
      // Obtener fuentes activas
      const activeSources = await this.datasetsService.getActiveHuggingFaceSources();
      const allSources = await this.datasetsService.getHuggingFaceSources();
      
      let totalWayuuWords = 0;
      let totalSpanishWords = 0;
      let totalAudioMinutes = 0;
      let totalPhrases = 0;
      let totalTranscribed = 0;
      let totalDictionaryEntries = 0;
      let totalAudioFiles = 0;

      // Calcular métricas agregadas
      for (const source of activeSources) {
        try {
          const stats = await this.datasetsService.getDatasetStats(source.name);
          
          if (source.type === 'dictionary') {
            totalDictionaryEntries += stats.dictionary_entries || 0;
            totalWayuuWords += stats.wayuu_words || 0;
            totalSpanishWords += stats.spanish_words || 0;
            totalPhrases += stats.phrases || 0;
          } else if (source.type === 'audio') {
            totalAudioFiles += stats.audio_files || 0;
            totalAudioMinutes += stats.audio_minutes || 0;
            totalTranscribed += stats.transcribed || 0;
            totalWayuuWords += stats.wayuu_words || 0;
            totalPhrases += stats.phrases || 0;
          }
        } catch (error) {
          console.warn(`Error getting stats for ${source.name}:`, error.message);
        }
      }

      return {
        success: true,
        data: {
          current_metrics: {
            total_wayuu_words: totalWayuuWords,
            total_spanish_words: totalSpanishWords,
            total_audio_minutes: Math.round(totalAudioMinutes * 100) / 100,
            total_phrases: totalPhrases,
            total_transcribed: totalTranscribed,
            total_dictionary_entries: totalDictionaryEntries,
            total_audio_files: totalAudioFiles,
          },
          sources_info: {
            total_sources: allSources.length,
            active_sources: activeSources.length,
            dictionary_sources: allSources.filter(s => s.type === 'dictionary').length,
            audio_sources: allSources.filter(s => s.type === 'audio').length,
          },
          last_updated: new Date().toISOString(),
        },
        message: 'Growth dashboard data retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get growth dashboard data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

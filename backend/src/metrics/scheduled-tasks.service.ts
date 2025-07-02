import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MetricsService } from './metrics.service';
import { DatasetsService } from '../datasets/datasets.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private readonly metricsService: MetricsService,
    private readonly datasetsService: DatasetsService,
  ) {}

  // Nueva tarea: Actualizar métricas cada hora para mayor frecuencia de datos
  @Cron(CronExpression.EVERY_HOUR)
  async updateGrowthMetricsHourly() {
    this.logger.log('🔄 Ejecutando actualización horaria de métricas de crecimiento...');
    
    try {
      const result = await this.updateGrowthMetrics();
      this.logger.log(`✅ Métricas de crecimiento actualizadas (horario): ${JSON.stringify(result.metrics)}`);
    } catch (error) {
      this.logger.error(`❌ Error actualizando métricas de crecimiento (horario): ${error.message}`, error.stack);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async updateGrowthMetricsDaily() {
    this.logger.log('🔄 Ejecutando actualización diaria de métricas de crecimiento...');
    
    try {
      const result = await this.updateGrowthMetrics();
      this.logger.log(`✅ Métricas de crecimiento actualizadas exitosamente: ${JSON.stringify(result.metrics)}`);
    } catch (error) {
      this.logger.error(`❌ Error actualizando métricas de crecimiento: ${error.message}`, error.stack);
    }
  }

  // Opcional: También ejecutar al mediodía para tener datos más frecuentes
  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async updateGrowthMetricsNoon() {
    this.logger.log('🔄 Ejecutando actualización del mediodía de métricas de crecimiento...');
    
    try {
      const result = await this.updateGrowthMetrics();
      this.logger.log(`✅ Métricas de crecimiento actualizadas al mediodía: ${JSON.stringify(result.metrics)}`);
    } catch (error) {
      this.logger.error(`❌ Error actualizando métricas de crecimiento al mediodía: ${error.message}`, error.stack);
    }
  }

  private async updateGrowthMetrics() {
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
        this.logger.warn(`Error getting stats for ${source.name}:`, error.message);
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
  }
} 
import { Injectable, OnModuleInit } from '@nestjs/common';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge, Summary } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  // Métricas de Traducción
  public readonly translationCounter = new Counter({
    name: 'wayuu_translations_total',
    help: 'Total number of translations performed',
    labelNames: ['direction', 'source_lang', 'target_lang', 'status'],
  });

  public readonly translationDuration = new Histogram({
    name: 'wayuu_translation_duration_seconds',
    help: 'Duration of translation requests in seconds',
    labelNames: ['direction', 'source_lang', 'target_lang'],
    buckets: [0.1, 0.5, 1, 2, 5, 10], // Buckets en segundos
  });

  public readonly translationErrors = new Counter({
    name: 'wayuu_translation_errors_total',
    help: 'Total number of translation errors',
    labelNames: ['error_type', 'direction'],
  });

  // Métricas de Audio
  public readonly audioRequestsCounter = new Counter({
    name: 'wayuu_audio_requests_total',
    help: 'Total number of audio requests',
    labelNames: ['audio_type', 'status'],
  });

  public readonly audioFilesServed = new Counter({
    name: 'wayuu_audio_files_served_total',
    help: 'Total number of audio files served',
    labelNames: ['file_type'],
  });

  // Métricas de Datasets
  public readonly datasetOperations = new Counter({
    name: 'wayuu_dataset_operations_total',
    help: 'Total number of dataset operations',
    labelNames: ['operation', 'dataset_type', 'status'],
  });

  public readonly dictionaryLookups = new Counter({
    name: 'wayuu_dictionary_lookups_total',
    help: 'Total number of dictionary lookups',
    labelNames: ['lookup_type', 'found'],
  });

  // Métricas de Sistema
  public readonly httpRequestDuration = new Histogram({
    name: 'wayuu_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  });

  public readonly httpRequestsTotal = new Counter({
    name: 'wayuu_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  // Métricas de Cache
  public readonly cacheOperations = new Counter({
    name: 'wayuu_cache_operations_total',
    help: 'Total number of cache operations',
    labelNames: ['operation', 'cache_type', 'result'],
  });

  public readonly cacheHitRatio = new Gauge({
    name: 'wayuu_cache_hit_ratio',
    help: 'Cache hit ratio percentage',
    labelNames: ['cache_type'],
  });

  // Métricas de Calidad
  public readonly translationQualityScore = new Summary({
    name: 'wayuu_translation_quality_score',
    help: 'Translation quality scores',
    labelNames: ['direction', 'evaluation_method'],
    percentiles: [0.5, 0.9, 0.95, 0.99],
  });

  // Métricas de Uso
  public readonly activeUsers = new Gauge({
    name: 'wayuu_active_users',
    help: 'Number of active users',
  });

  public readonly sessionsTotal = new Counter({
    name: 'wayuu_sessions_total',
    help: 'Total number of user sessions',
    labelNames: ['session_type'],
  });

  // Métricas de Hugging Face
  public readonly huggingfaceOperations = new Counter({
    name: 'wayuu_huggingface_operations_total',
    help: 'Total number of Hugging Face operations',
    labelNames: ['operation', 'status'],
  });

  public readonly huggingfaceResponseTime = new Histogram({
    name: 'wayuu_huggingface_response_time_seconds',
    help: 'Hugging Face API response time in seconds',
    labelNames: ['operation'],
    buckets: [0.5, 1, 2, 5, 10, 30],
  });

  // Métricas de Estadísticas de Datasets
  public readonly datasetTotalEntries = new Gauge({
    name: 'wayuu_dataset_total_entries',
    help: 'Total number of entries in each dataset',
    labelNames: ['dataset_name', 'dataset_type'],
  });

  public readonly datasetUniqueWords = new Gauge({
    name: 'wayuu_dataset_unique_words',
    help: 'Number of unique words in each dataset',
    labelNames: ['dataset_name', 'language', 'dataset_type'],
  });

  public readonly datasetAverageWordsPerEntry = new Gauge({
    name: 'wayuu_dataset_average_words_per_entry',
    help: 'Average number of words per entry in each dataset',
    labelNames: ['dataset_name', 'language', 'dataset_type'],
  });

  public readonly datasetCacheStatus = new Gauge({
    name: 'wayuu_dataset_cache_status',
    help: 'Cache status for each dataset (1 = available, 0 = not available)',
    labelNames: ['dataset_name', 'dataset_type'],
  });

  public readonly datasetCacheSize = new Gauge({
    name: 'wayuu_dataset_cache_size_bytes',
    help: 'Cache size in bytes for each dataset',
    labelNames: ['dataset_name', 'dataset_type'],
  });

  public readonly datasetLoadStatus = new Gauge({
    name: 'wayuu_dataset_load_status',
    help: 'Load status for each dataset (1 = loaded, 0 = not loaded)',
    labelNames: ['dataset_name', 'dataset_type', 'is_active'],
  });

  public readonly datasetLastUpdateTime = new Gauge({
    name: 'wayuu_dataset_last_update_timestamp',
    help: 'Timestamp of last dataset update',
    labelNames: ['dataset_name', 'dataset_type'],
  });

  // Métricas específicas de Audio
  public readonly audioDatasetTotalDuration = new Gauge({
    name: 'wayuu_audio_dataset_total_duration_seconds',
    help: 'Total duration of audio in seconds for each audio dataset',
    labelNames: ['dataset_name'],
  });

  public readonly audioDatasetAverageDuration = new Gauge({
    name: 'wayuu_audio_dataset_average_duration_seconds',
    help: 'Average duration per audio entry in seconds',
    labelNames: ['dataset_name'],
  });

  public readonly audioFilesDownloaded = new Gauge({
    name: 'wayuu_audio_files_downloaded',
    help: 'Number of audio files downloaded locally',
    labelNames: ['dataset_name'],
  });

  public readonly audioFilesDownloadProgress = new Gauge({
    name: 'wayuu_audio_download_progress_percent',
    help: 'Download progress percentage for audio files',
    labelNames: ['dataset_name'],
  });

  // Métricas de Procesamiento de PDFs
  public readonly pdfProcessingTotalPdfs = new Gauge({
    name: 'wayuu_pdf_processing_total_pdfs',
    help: 'Total number of PDF documents available for processing',
  });

  public readonly pdfProcessingProcessedPdfs = new Gauge({
    name: 'wayuu_pdf_processing_processed_pdfs',
    help: 'Number of PDF documents that have been processed',
  });

  public readonly pdfProcessingTotalPages = new Gauge({
    name: 'wayuu_pdf_processing_total_pages',
    help: 'Total number of pages processed across all PDFs',
  });

  public readonly pdfProcessingWayuuPhrases = new Gauge({
    name: 'wayuu_pdf_processing_wayuu_phrases',
    help: 'Total number of Wayuu phrases extracted from PDFs',
  });

  public readonly pdfProcessingWayuuPercentage = new Gauge({
    name: 'wayuu_pdf_processing_wayuu_percentage',
    help: 'Average percentage of Wayuu content across processed PDFs',
  });

  public readonly pdfProcessingTimeSeconds = new Gauge({
    name: 'wayuu_pdf_processing_time_seconds',
    help: 'Total time spent processing PDFs in seconds',
  });

  public readonly pdfProcessingOperations = new Counter({
    name: 'wayuu_pdf_processing_operations_total',
    help: 'Total number of PDF processing operations',
    labelNames: ['operation', 'status'],
  });

  // Métricas de Fuentes HuggingFace
  public readonly huggingfaceSourcesTotal = new Gauge({
    name: 'wayuu_huggingface_sources_total',
    help: 'Total number of configured Hugging Face sources',
    labelNames: ['source_type'],
  });

  public readonly huggingfaceSourcesActive = new Gauge({
    name: 'wayuu_huggingface_sources_active',
    help: 'Number of active Hugging Face sources',
    labelNames: ['source_type'],
  });

  // Métricas de Crecimiento para Dashboard
  public readonly totalWayuuWords = new Gauge({
    name: 'wayuu_total_words_wayuu',
    help: 'Total unique Wayuu words across all active sources',
  });

  public readonly totalSpanishWords = new Gauge({
    name: 'wayuu_total_words_spanish',
    help: 'Total unique Spanish words across all active sources',
  });

  public readonly totalAudioMinutes = new Gauge({
    name: 'wayuu_total_audio_minutes',
    help: 'Total audio duration in minutes across all active sources',
  });

  public readonly totalPhrases = new Gauge({
    name: 'wayuu_total_phrases',
    help: 'Total phrases/sentences across all active sources',
  });

  public readonly totalTranscribed = new Gauge({
    name: 'wayuu_total_transcribed',
    help: 'Total transcribed audio files across all active sources',
  });

  public readonly totalDictionaryEntries = new Gauge({
    name: 'wayuu_total_dictionary_entries',
    help: 'Total dictionary entries across all active sources',
  });

  public readonly totalAudioFiles = new Gauge({
    name: 'wayuu_total_audio_files',
    help: 'Total audio files across all active sources',
  });

  public readonly growthLastUpdateTimestamp = new Gauge({
    name: 'wayuu_growth_last_update_timestamp',
    help: 'Timestamp of last growth metrics update',
  });

  onModuleInit() {
    // Registrar métricas por defecto del sistema (CPU, memoria, etc.)
    collectDefaultMetrics({ register });
    
    // Registrar nuestras métricas personalizadas
    register.registerMetric(this.translationCounter);
    register.registerMetric(this.translationDuration);
    register.registerMetric(this.translationErrors);
    register.registerMetric(this.audioRequestsCounter);
    register.registerMetric(this.audioFilesServed);
    register.registerMetric(this.datasetOperations);
    register.registerMetric(this.dictionaryLookups);
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.httpRequestsTotal);
    register.registerMetric(this.cacheOperations);
    register.registerMetric(this.cacheHitRatio);
    register.registerMetric(this.translationQualityScore);
    register.registerMetric(this.activeUsers);
    register.registerMetric(this.sessionsTotal);
    register.registerMetric(this.huggingfaceOperations);
    register.registerMetric(this.huggingfaceResponseTime);
    
    // Registrar nuevas métricas de datasets
    register.registerMetric(this.datasetTotalEntries);
    register.registerMetric(this.datasetUniqueWords);
    register.registerMetric(this.datasetAverageWordsPerEntry);
    register.registerMetric(this.datasetCacheStatus);
    register.registerMetric(this.datasetCacheSize);
    register.registerMetric(this.datasetLoadStatus);
    register.registerMetric(this.datasetLastUpdateTime);
    register.registerMetric(this.audioDatasetTotalDuration);
    register.registerMetric(this.audioDatasetAverageDuration);
    register.registerMetric(this.audioFilesDownloaded);
    register.registerMetric(this.audioFilesDownloadProgress);
    
    // Registrar métricas de procesamiento de PDFs
    register.registerMetric(this.pdfProcessingTotalPdfs);
    register.registerMetric(this.pdfProcessingProcessedPdfs);
    register.registerMetric(this.pdfProcessingTotalPages);
    register.registerMetric(this.pdfProcessingWayuuPhrases);
    register.registerMetric(this.pdfProcessingWayuuPercentage);
    register.registerMetric(this.pdfProcessingTimeSeconds);
    register.registerMetric(this.pdfProcessingOperations);
    
    register.registerMetric(this.huggingfaceSourcesTotal);
    register.registerMetric(this.huggingfaceSourcesActive);

    // Registrar métricas de crecimiento
    register.registerMetric(this.totalWayuuWords);
    register.registerMetric(this.totalSpanishWords);
    register.registerMetric(this.totalAudioMinutes);
    register.registerMetric(this.totalPhrases);
    register.registerMetric(this.totalTranscribed);
    register.registerMetric(this.totalDictionaryEntries);
    register.registerMetric(this.totalAudioFiles);
    register.registerMetric(this.growthLastUpdateTimestamp);
  }

  // Método para obtener todas las métricas en formato Prometheus
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Métodos de conveniencia para incrementar métricas comunes
  incrementTranslation(direction: string, sourceLang: string, targetLang: string, status: string) {
    this.translationCounter.inc({ direction, source_lang: sourceLang, target_lang: targetLang, status });
  }

  recordTranslationDuration(direction: string, sourceLang: string, targetLang: string, duration: number) {
    this.translationDuration.observe({ direction, source_lang: sourceLang, target_lang: targetLang }, duration);
  }

  incrementTranslationError(errorType: string, direction: string) {
    this.translationErrors.inc({ error_type: errorType, direction });
  }

  incrementAudioRequest(audioType: string, status: string) {
    this.audioRequestsCounter.inc({ audio_type: audioType, status });
  }

  incrementDictionaryLookup(lookupType: string, found: boolean) {
    this.dictionaryLookups.inc({ lookup_type: lookupType, found: found.toString() });
  }

  recordHttpRequest(method: string, route: string, statusCode: string, duration: number) {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
    this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  }

  incrementCacheOperation(operation: string, cacheType: string, result: string) {
    this.cacheOperations.inc({ operation, cache_type: cacheType, result });
  }

  updateCacheHitRatio(cacheType: string, ratio: number) {
    this.cacheHitRatio.set({ cache_type: cacheType }, ratio);
  }

  setActiveUsers(count: number) {
    this.activeUsers.set(count);
  }

  incrementHuggingfaceOperation(operation: string, status: string) {
    this.huggingfaceOperations.inc({ operation, status });
  }

  recordHuggingfaceResponseTime(operation: string, duration: number) {
    this.huggingfaceResponseTime.observe({ operation }, duration);
  }

  // Métodos de conveniencia para métricas de datasets
  updateDatasetTotalEntries(datasetName: string, datasetType: string, entries: number) {
    // Validar que entries sea un número válido
    if (typeof entries === 'number' && !isNaN(entries) && isFinite(entries)) {
      this.datasetTotalEntries.set({ dataset_name: datasetName, dataset_type: datasetType }, entries);
    } else {
      console.warn(`⚠️ Invalid entries value for dataset ${datasetName}: ${entries}, setting to 0`);
      this.datasetTotalEntries.set({ dataset_name: datasetName, dataset_type: datasetType }, 0);
    }
  }

  updateDatasetUniqueWords(datasetName: string, language: string, datasetType: string, words: number) {
    if (typeof words === 'number' && !isNaN(words) && isFinite(words)) {
      this.datasetUniqueWords.set({ dataset_name: datasetName, language, dataset_type: datasetType }, words);
    } else {
      console.warn(`⚠️ Invalid words value for dataset ${datasetName}: ${words}, setting to 0`);
      this.datasetUniqueWords.set({ dataset_name: datasetName, language, dataset_type: datasetType }, 0);
    }
  }

  updateDatasetAverageWordsPerEntry(datasetName: string, language: string, datasetType: string, average: number) {
    if (typeof average === 'number' && !isNaN(average) && isFinite(average)) {
      this.datasetAverageWordsPerEntry.set({ dataset_name: datasetName, language, dataset_type: datasetType }, average);
    } else {
      console.warn(`⚠️ Invalid average value for dataset ${datasetName}: ${average}, setting to 0`);
      this.datasetAverageWordsPerEntry.set({ dataset_name: datasetName, language, dataset_type: datasetType }, 0);
    }
  }

  updateDatasetCacheStatus(datasetName: string, datasetType: string, isAvailable: boolean) {
    this.datasetCacheStatus.set({ dataset_name: datasetName, dataset_type: datasetType }, isAvailable ? 1 : 0);
  }

  updateDatasetCacheSize(datasetName: string, datasetType: string, sizeBytes: number) {
    if (typeof sizeBytes === 'number' && !isNaN(sizeBytes) && isFinite(sizeBytes)) {
      this.datasetCacheSize.set({ dataset_name: datasetName, dataset_type: datasetType }, sizeBytes);
    } else {
      console.warn(`⚠️ Invalid sizeBytes value for dataset ${datasetName}: ${sizeBytes}, setting to 0`);
      this.datasetCacheSize.set({ dataset_name: datasetName, dataset_type: datasetType }, 0);
    }
  }

  updateDatasetLoadStatus(datasetName: string, datasetType: string, isActive: boolean, isLoaded: boolean) {
    this.datasetLoadStatus.set({ dataset_name: datasetName, dataset_type: datasetType, is_active: isActive.toString() }, isLoaded ? 1 : 0);
  }

  updateDatasetLastUpdateTime(datasetName: string, datasetType: string, timestamp: number) {
    if (typeof timestamp === 'number' && !isNaN(timestamp) && isFinite(timestamp)) {
      this.datasetLastUpdateTime.set({ dataset_name: datasetName, dataset_type: datasetType }, timestamp);
    } else {
      console.warn(`⚠️ Invalid timestamp value for dataset ${datasetName}: ${timestamp}, setting to 0`);
      this.datasetLastUpdateTime.set({ dataset_name: datasetName, dataset_type: datasetType }, 0);
    }
  }

  updateAudioDatasetTotalDuration(datasetName: string, totalDurationSeconds: number) {
    this.audioDatasetTotalDuration.set({ dataset_name: datasetName }, totalDurationSeconds);
  }

  updateAudioDatasetAverageDuration(datasetName: string, averageDurationSeconds: number) {
    this.audioDatasetAverageDuration.set({ dataset_name: datasetName }, averageDurationSeconds);
  }

  updateAudioFilesDownloaded(datasetName: string, downloadedCount: number) {
    this.audioFilesDownloaded.set({ dataset_name: datasetName }, downloadedCount);
  }

  updateAudioDownloadProgress(datasetName: string, progressPercent: number) {
    this.audioFilesDownloadProgress.set({ dataset_name: datasetName }, progressPercent);
  }

  // Métodos para actualizar métricas de PDFs
  updatePdfProcessingTotalPdfs(total: number) {
    this.pdfProcessingTotalPdfs.set(total);
  }

  updatePdfProcessingProcessedPdfs(processed: number) {
    this.pdfProcessingProcessedPdfs.set(processed);
  }

  updatePdfProcessingTotalPages(pages: number) {
    this.pdfProcessingTotalPages.set(pages);
  }

  updatePdfProcessingWayuuPhrases(phrases: number) {
    this.pdfProcessingWayuuPhrases.set(phrases);
  }

  updatePdfProcessingWayuuPercentage(percentage: number) {
    this.pdfProcessingWayuuPercentage.set(percentage);
  }

  updatePdfProcessingTimeSeconds(timeSeconds: number) {
    this.pdfProcessingTimeSeconds.set(timeSeconds);
  }

  incrementPdfProcessingOperation(operation: string, status: string) {
    this.pdfProcessingOperations.inc({ operation, status });
  }

  updateHuggingfaceSourcesTotal(sourceType: string, total: number) {
    this.huggingfaceSourcesTotal.set({ source_type: sourceType }, total);
  }

  updateHuggingfaceSourcesActive(sourceType: string, active: number) {
    this.huggingfaceSourcesActive.set({ source_type: sourceType }, active);
  }

  updateTotalWayuuWords(totalWords: number) {
    this.totalWayuuWords.set(totalWords);
  }

  updateTotalSpanishWords(totalWords: number) {
    this.totalSpanishWords.set(totalWords);
  }

  updateTotalAudioMinutes(totalMinutes: number) {
    this.totalAudioMinutes.set(totalMinutes);
  }

  updateTotalPhrases(totalPhrases: number) {
    this.totalPhrases.set(totalPhrases);
  }

  updateTotalTranscribed(totalTranscribed: number) {
    this.totalTranscribed.set(totalTranscribed);
  }

  updateTotalDictionaryEntries(totalEntries: number) {
    this.totalDictionaryEntries.set(totalEntries);
  }

  updateTotalAudioFiles(totalFiles: number) {
    this.totalAudioFiles.set(totalFiles);
  }

  updateGrowthLastUpdateTimestamp(timestamp: number) {
    this.growthLastUpdateTimestamp.set(timestamp);
  }

  // Método de conveniencia para actualizar métricas de crecimiento
  updateGrowthMetric(metricName: string, value: number) {
    switch (metricName) {
      case 'wayuu_total_words_wayuu':
        this.updateTotalWayuuWords(value);
        break;
      case 'wayuu_total_words_spanish':
        this.updateTotalSpanishWords(value);
        break;
      case 'wayuu_total_audio_minutes':
        this.updateTotalAudioMinutes(value);
        break;
      case 'wayuu_total_phrases':
        this.updateTotalPhrases(value);
        break;
      case 'wayuu_total_transcribed':
        this.updateTotalTranscribed(value);
        break;
      case 'wayuu_total_dictionary_entries':
        this.updateTotalDictionaryEntries(value);
        break;
      case 'wayuu_total_audio_files':
        this.updateTotalAudioFiles(value);
        break;
      case 'wayuu_growth_last_update_timestamp':
        this.updateGrowthLastUpdateTimestamp(value);
        break;
      default:
        console.warn(`Unknown growth metric: ${metricName}`);
    }
  }
}

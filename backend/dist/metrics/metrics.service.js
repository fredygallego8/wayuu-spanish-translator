"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
let MetricsService = class MetricsService {
    constructor() {
        this.translationCounter = new prom_client_1.Counter({
            name: 'wayuu_translations_total',
            help: 'Total number of translations performed',
            labelNames: ['direction', 'source_lang', 'target_lang', 'status'],
        });
        this.translationDuration = new prom_client_1.Histogram({
            name: 'wayuu_translation_duration_seconds',
            help: 'Duration of translation requests in seconds',
            labelNames: ['direction', 'source_lang', 'target_lang'],
            buckets: [0.1, 0.5, 1, 2, 5, 10],
        });
        this.translationErrors = new prom_client_1.Counter({
            name: 'wayuu_translation_errors_total',
            help: 'Total number of translation errors',
            labelNames: ['error_type', 'direction'],
        });
        this.audioRequestsCounter = new prom_client_1.Counter({
            name: 'wayuu_audio_requests_total',
            help: 'Total number of audio requests',
            labelNames: ['audio_type', 'status'],
        });
        this.audioFilesServed = new prom_client_1.Counter({
            name: 'wayuu_audio_files_served_total',
            help: 'Total number of audio files served',
            labelNames: ['file_type'],
        });
        this.datasetOperations = new prom_client_1.Counter({
            name: 'wayuu_dataset_operations_total',
            help: 'Total number of dataset operations',
            labelNames: ['operation', 'dataset_type', 'status'],
        });
        this.dictionaryLookups = new prom_client_1.Counter({
            name: 'wayuu_dictionary_lookups_total',
            help: 'Total number of dictionary lookups',
            labelNames: ['lookup_type', 'found'],
        });
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: 'wayuu_http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
        });
        this.httpRequestsTotal = new prom_client_1.Counter({
            name: 'wayuu_http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
        });
        this.cacheOperations = new prom_client_1.Counter({
            name: 'wayuu_cache_operations_total',
            help: 'Total number of cache operations',
            labelNames: ['operation', 'cache_type', 'result'],
        });
        this.cacheHitRatio = new prom_client_1.Gauge({
            name: 'wayuu_cache_hit_ratio',
            help: 'Cache hit ratio percentage',
            labelNames: ['cache_type'],
        });
        this.translationQualityScore = new prom_client_1.Summary({
            name: 'wayuu_translation_quality_score',
            help: 'Translation quality scores',
            labelNames: ['direction', 'evaluation_method'],
            percentiles: [0.5, 0.9, 0.95, 0.99],
        });
        this.activeUsers = new prom_client_1.Gauge({
            name: 'wayuu_active_users',
            help: 'Number of active users',
        });
        this.sessionsTotal = new prom_client_1.Counter({
            name: 'wayuu_sessions_total',
            help: 'Total number of user sessions',
            labelNames: ['session_type'],
        });
        this.huggingfaceOperations = new prom_client_1.Counter({
            name: 'wayuu_huggingface_operations_total',
            help: 'Total number of Hugging Face operations',
            labelNames: ['operation', 'status'],
        });
        this.huggingfaceResponseTime = new prom_client_1.Histogram({
            name: 'wayuu_huggingface_response_time_seconds',
            help: 'Hugging Face API response time in seconds',
            labelNames: ['operation'],
            buckets: [0.5, 1, 2, 5, 10, 30],
        });
        this.datasetTotalEntries = new prom_client_1.Gauge({
            name: 'wayuu_dataset_total_entries',
            help: 'Total number of entries in each dataset',
            labelNames: ['dataset_name', 'dataset_type'],
        });
        this.datasetUniqueWords = new prom_client_1.Gauge({
            name: 'wayuu_dataset_unique_words',
            help: 'Number of unique words in each dataset',
            labelNames: ['dataset_name', 'language', 'dataset_type'],
        });
        this.datasetAverageWordsPerEntry = new prom_client_1.Gauge({
            name: 'wayuu_dataset_average_words_per_entry',
            help: 'Average number of words per entry in each dataset',
            labelNames: ['dataset_name', 'language', 'dataset_type'],
        });
        this.datasetCacheStatus = new prom_client_1.Gauge({
            name: 'wayuu_dataset_cache_status',
            help: 'Cache status for each dataset (1 = available, 0 = not available)',
            labelNames: ['dataset_name', 'dataset_type'],
        });
        this.datasetCacheSize = new prom_client_1.Gauge({
            name: 'wayuu_dataset_cache_size_bytes',
            help: 'Cache size in bytes for each dataset',
            labelNames: ['dataset_name', 'dataset_type'],
        });
        this.datasetLoadStatus = new prom_client_1.Gauge({
            name: 'wayuu_dataset_load_status',
            help: 'Load status for each dataset (1 = loaded, 0 = not loaded)',
            labelNames: ['dataset_name', 'dataset_type', 'is_active'],
        });
        this.datasetLastUpdateTime = new prom_client_1.Gauge({
            name: 'wayuu_dataset_last_update_timestamp',
            help: 'Timestamp of last dataset update',
            labelNames: ['dataset_name', 'dataset_type'],
        });
        this.audioDatasetTotalDuration = new prom_client_1.Gauge({
            name: 'wayuu_audio_dataset_total_duration_seconds',
            help: 'Total duration of audio in seconds for each audio dataset',
            labelNames: ['dataset_name'],
        });
        this.audioDatasetAverageDuration = new prom_client_1.Gauge({
            name: 'wayuu_audio_dataset_average_duration_seconds',
            help: 'Average duration per audio entry in seconds',
            labelNames: ['dataset_name'],
        });
        this.audioFilesDownloaded = new prom_client_1.Gauge({
            name: 'wayuu_audio_files_downloaded',
            help: 'Number of audio files downloaded locally',
            labelNames: ['dataset_name'],
        });
        this.audioFilesDownloadProgress = new prom_client_1.Gauge({
            name: 'wayuu_audio_download_progress_percent',
            help: 'Download progress percentage for audio files',
            labelNames: ['dataset_name'],
        });
        this.huggingfaceSourcesTotal = new prom_client_1.Gauge({
            name: 'wayuu_huggingface_sources_total',
            help: 'Total number of configured Hugging Face sources',
            labelNames: ['source_type'],
        });
        this.huggingfaceSourcesActive = new prom_client_1.Gauge({
            name: 'wayuu_huggingface_sources_active',
            help: 'Number of active Hugging Face sources',
            labelNames: ['source_type'],
        });
        this.totalWayuuWords = new prom_client_1.Gauge({
            name: 'wayuu_total_words_wayuu',
            help: 'Total unique Wayuu words across all active sources',
        });
        this.totalSpanishWords = new prom_client_1.Gauge({
            name: 'wayuu_total_words_spanish',
            help: 'Total unique Spanish words across all active sources',
        });
        this.totalAudioMinutes = new prom_client_1.Gauge({
            name: 'wayuu_total_audio_minutes',
            help: 'Total audio duration in minutes across all active sources',
        });
        this.totalPhrases = new prom_client_1.Gauge({
            name: 'wayuu_total_phrases',
            help: 'Total phrases/sentences across all active sources',
        });
        this.totalTranscribed = new prom_client_1.Gauge({
            name: 'wayuu_total_transcribed',
            help: 'Total transcribed audio files across all active sources',
        });
        this.totalDictionaryEntries = new prom_client_1.Gauge({
            name: 'wayuu_total_dictionary_entries',
            help: 'Total dictionary entries across all active sources',
        });
        this.totalAudioFiles = new prom_client_1.Gauge({
            name: 'wayuu_total_audio_files',
            help: 'Total audio files across all active sources',
        });
        this.growthLastUpdateTimestamp = new prom_client_1.Gauge({
            name: 'wayuu_growth_last_update_timestamp',
            help: 'Timestamp of last growth metrics update',
        });
    }
    onModuleInit() {
        (0, prom_client_1.collectDefaultMetrics)({ register: prom_client_1.register });
        prom_client_1.register.clear();
        prom_client_1.register.registerMetric(this.translationCounter);
        prom_client_1.register.registerMetric(this.translationDuration);
        prom_client_1.register.registerMetric(this.translationErrors);
        prom_client_1.register.registerMetric(this.audioRequestsCounter);
        prom_client_1.register.registerMetric(this.audioFilesServed);
        prom_client_1.register.registerMetric(this.datasetOperations);
        prom_client_1.register.registerMetric(this.dictionaryLookups);
        prom_client_1.register.registerMetric(this.httpRequestDuration);
        prom_client_1.register.registerMetric(this.httpRequestsTotal);
        prom_client_1.register.registerMetric(this.cacheOperations);
        prom_client_1.register.registerMetric(this.cacheHitRatio);
        prom_client_1.register.registerMetric(this.translationQualityScore);
        prom_client_1.register.registerMetric(this.activeUsers);
        prom_client_1.register.registerMetric(this.sessionsTotal);
        prom_client_1.register.registerMetric(this.huggingfaceOperations);
        prom_client_1.register.registerMetric(this.huggingfaceResponseTime);
        prom_client_1.register.registerMetric(this.datasetTotalEntries);
        prom_client_1.register.registerMetric(this.datasetUniqueWords);
        prom_client_1.register.registerMetric(this.datasetAverageWordsPerEntry);
        prom_client_1.register.registerMetric(this.datasetCacheStatus);
        prom_client_1.register.registerMetric(this.datasetCacheSize);
        prom_client_1.register.registerMetric(this.datasetLoadStatus);
        prom_client_1.register.registerMetric(this.datasetLastUpdateTime);
        prom_client_1.register.registerMetric(this.audioDatasetTotalDuration);
        prom_client_1.register.registerMetric(this.audioDatasetAverageDuration);
        prom_client_1.register.registerMetric(this.audioFilesDownloaded);
        prom_client_1.register.registerMetric(this.audioFilesDownloadProgress);
        prom_client_1.register.registerMetric(this.huggingfaceSourcesTotal);
        prom_client_1.register.registerMetric(this.huggingfaceSourcesActive);
        prom_client_1.register.registerMetric(this.totalWayuuWords);
        prom_client_1.register.registerMetric(this.totalSpanishWords);
        prom_client_1.register.registerMetric(this.totalAudioMinutes);
        prom_client_1.register.registerMetric(this.totalPhrases);
        prom_client_1.register.registerMetric(this.totalTranscribed);
        prom_client_1.register.registerMetric(this.totalDictionaryEntries);
        prom_client_1.register.registerMetric(this.totalAudioFiles);
        prom_client_1.register.registerMetric(this.growthLastUpdateTimestamp);
        (0, prom_client_1.collectDefaultMetrics)({ register: prom_client_1.register });
    }
    async getMetrics() {
        return prom_client_1.register.metrics();
    }
    incrementTranslation(direction, sourceLang, targetLang, status) {
        this.translationCounter.inc({ direction, source_lang: sourceLang, target_lang: targetLang, status });
    }
    recordTranslationDuration(direction, sourceLang, targetLang, duration) {
        this.translationDuration.observe({ direction, source_lang: sourceLang, target_lang: targetLang }, duration);
    }
    incrementTranslationError(errorType, direction) {
        this.translationErrors.inc({ error_type: errorType, direction });
    }
    incrementAudioRequest(audioType, status) {
        this.audioRequestsCounter.inc({ audio_type: audioType, status });
    }
    incrementDictionaryLookup(lookupType, found) {
        this.dictionaryLookups.inc({ lookup_type: lookupType, found: found.toString() });
    }
    recordHttpRequest(method, route, statusCode, duration) {
        this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
        this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    }
    incrementCacheOperation(operation, cacheType, result) {
        this.cacheOperations.inc({ operation, cache_type: cacheType, result });
    }
    updateCacheHitRatio(cacheType, ratio) {
        this.cacheHitRatio.set({ cache_type: cacheType }, ratio);
    }
    setActiveUsers(count) {
        this.activeUsers.set(count);
    }
    incrementHuggingfaceOperation(operation, status) {
        this.huggingfaceOperations.inc({ operation, status });
    }
    recordHuggingfaceResponseTime(operation, duration) {
        this.huggingfaceResponseTime.observe({ operation }, duration);
    }
    updateDatasetTotalEntries(datasetName, datasetType, entries) {
        this.datasetTotalEntries.set({ dataset_name: datasetName, dataset_type: datasetType }, entries);
    }
    updateDatasetUniqueWords(datasetName, language, datasetType, words) {
        this.datasetUniqueWords.set({ dataset_name: datasetName, language, dataset_type: datasetType }, words);
    }
    updateDatasetAverageWordsPerEntry(datasetName, language, datasetType, average) {
        this.datasetAverageWordsPerEntry.set({ dataset_name: datasetName, language, dataset_type: datasetType }, average);
    }
    updateDatasetCacheStatus(datasetName, datasetType, isAvailable) {
        this.datasetCacheStatus.set({ dataset_name: datasetName, dataset_type: datasetType }, isAvailable ? 1 : 0);
    }
    updateDatasetCacheSize(datasetName, datasetType, sizeBytes) {
        this.datasetCacheSize.set({ dataset_name: datasetName, dataset_type: datasetType }, sizeBytes);
    }
    updateDatasetLoadStatus(datasetName, datasetType, isActive, isLoaded) {
        this.datasetLoadStatus.set({ dataset_name: datasetName, dataset_type: datasetType, is_active: isActive.toString() }, isLoaded ? 1 : 0);
    }
    updateDatasetLastUpdateTime(datasetName, datasetType, timestamp) {
        this.datasetLastUpdateTime.set({ dataset_name: datasetName, dataset_type: datasetType }, timestamp);
    }
    updateAudioDatasetTotalDuration(datasetName, totalDurationSeconds) {
        this.audioDatasetTotalDuration.set({ dataset_name: datasetName }, totalDurationSeconds);
    }
    updateAudioDatasetAverageDuration(datasetName, averageDurationSeconds) {
        this.audioDatasetAverageDuration.set({ dataset_name: datasetName }, averageDurationSeconds);
    }
    updateAudioFilesDownloaded(datasetName, downloadedCount) {
        this.audioFilesDownloaded.set({ dataset_name: datasetName }, downloadedCount);
    }
    updateAudioDownloadProgress(datasetName, progressPercent) {
        this.audioFilesDownloadProgress.set({ dataset_name: datasetName }, progressPercent);
    }
    updateHuggingfaceSourcesTotal(sourceType, total) {
        this.huggingfaceSourcesTotal.set({ source_type: sourceType }, total);
    }
    updateHuggingfaceSourcesActive(sourceType, active) {
        this.huggingfaceSourcesActive.set({ source_type: sourceType }, active);
    }
    updateTotalWayuuWords(totalWords) {
        this.totalWayuuWords.set(totalWords);
    }
    updateTotalSpanishWords(totalWords) {
        this.totalSpanishWords.set(totalWords);
    }
    updateTotalAudioMinutes(totalMinutes) {
        this.totalAudioMinutes.set(totalMinutes);
    }
    updateTotalPhrases(totalPhrases) {
        this.totalPhrases.set(totalPhrases);
    }
    updateTotalTranscribed(totalTranscribed) {
        this.totalTranscribed.set(totalTranscribed);
    }
    updateTotalDictionaryEntries(totalEntries) {
        this.totalDictionaryEntries.set(totalEntries);
    }
    updateTotalAudioFiles(totalFiles) {
        this.totalAudioFiles.set(totalFiles);
    }
    updateGrowthLastUpdateTimestamp(timestamp) {
        this.growthLastUpdateTimestamp.set(timestamp);
    }
    updateGrowthMetric(metricName, value) {
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
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)()
], MetricsService);
//# sourceMappingURL=metrics.service.js.map
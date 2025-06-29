"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DatasetsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const translate_dto_1 = require("../translation/dto/translate.dto");
const audio_duration_service_1 = require("./audio-duration.service");
const metrics_service_1 = require("../metrics/metrics.service");
let DatasetsService = DatasetsService_1 = class DatasetsService {
    constructor(configService, audioDurationService, metricsService) {
        this.configService = configService;
        this.audioDurationService = audioDurationService;
        this.metricsService = metricsService;
        this.logger = new common_1.Logger(DatasetsService_1.name);
        this.wayuuDictionary = [];
        this.wayuuAudioDataset = [];
        this.additionalDatasets = new Map();
        this.loadedDatasetSources = new Set();
        this.isLoaded = false;
        this.isAudioLoaded = false;
        this.totalEntries = 0;
        this.totalAudioEntries = 0;
        this.loadingPromise = null;
        this.audioLoadingPromise = null;
        this.huggingFaceSources = [
            {
                id: 'wayuu_spa_dict',
                name: 'Wayuu-Spanish Dictionary',
                dataset: 'Gaxys/wayuu_spa_dict',
                config: 'default',
                split: 'train',
                type: 'dictionary',
                description: 'Wayuu-Spanish dictionary with over 2,000 entries for translation',
                url: 'https://huggingface.co/datasets/Gaxys/wayuu_spa_dict',
                isActive: true,
                priority: 1
            },
            {
                id: 'wayuu_spa_large',
                name: 'Wayuu-Spanish Large Dataset',
                dataset: 'Gaxys/wayuu_spa',
                config: 'default',
                split: 'train',
                type: 'dictionary',
                description: 'Large Wayuu-Spanish dataset with 46,827 translation pairs from biblical and cultural texts',
                url: 'https://huggingface.co/datasets/Gaxys/wayuu_spa',
                isActive: true,
                priority: 2
            },
            {
                id: 'wayuu_parallel_corpus',
                name: 'Wayuu-Spanish Parallel Corpus',
                dataset: 'weezygeezer/Wayuu-Spanish_Parallel-Corpus',
                config: 'default',
                split: 'train',
                type: 'dictionary',
                description: 'Large parallel corpus with 42,687 Wayuu-Spanish sentence pairs for enhanced translation',
                url: 'https://huggingface.co/datasets/weezygeezer/Wayuu-Spanish_Parallel-Corpus',
                isActive: true,
                priority: 3
            },
            {
                id: 'wayuu_audio',
                name: 'Wayuu Audio Dataset',
                dataset: 'orkidea/wayuu_CO_test',
                config: 'default',
                split: 'train',
                type: 'audio',
                description: 'Wayuu audio recordings with transcriptions (810 entries)',
                url: 'https://huggingface.co/datasets/orkidea/wayuu_CO_test',
                isActive: true,
                priority: 4
            },
            {
                id: 'palabrero_guc_draft',
                name: 'Palabrero GUC Draft',
                dataset: 'orkidea/palabrero-guc-draft',
                config: 'default',
                split: 'train',
                type: 'audio',
                description: 'Wayuu audio recordings with transcriptions from Palabrero project (17 entries)',
                url: 'https://huggingface.co/datasets/orkidea/palabrero-guc-draft',
                isActive: true,
                priority: 5
            }
        ];
        this.cacheDir = path.join(process.cwd(), 'data');
        this.cacheFile = path.join(this.cacheDir, 'wayuu-dictionary-cache.json');
        this.metadataFile = path.join(this.cacheDir, 'cache-metadata.json');
        this.audioCacheFile = path.join(this.cacheDir, 'wayuu-audio-cache.json');
        this.audioMetadataFile = path.join(this.cacheDir, 'audio-cache-metadata.json');
        this.audioDownloadDir = path.join(this.cacheDir, 'audio');
        this.cacheMaxAge = 24 * 60 * 60 * 1000;
    }
    async onModuleInit() {
        await this.ensureCacheDirectory();
        this.logger.log('🔧 Datasets service ready for on-demand loading...');
        this.logger.log('📚 Dictionary and audio data will be loaded when requested by authorized users');
        this.logger.log('✨ Service ready - lazy loading enabled');
        await this.updateDatasetMetrics();
    }
    async loadWayuuDictionary() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }
        this.loadingPromise = this._performDatasetLoad();
        return this.loadingPromise;
    }
    async loadWayuuAudioDataset() {
        if (this.audioLoadingPromise) {
            return this.audioLoadingPromise;
        }
        this.audioLoadingPromise = this._performAudioDatasetLoad();
        return this.audioLoadingPromise;
    }
    async _performDatasetLoad() {
        this.logger.log('🚀 Loading Wayuu-Spanish dictionary with intelligent cache...');
        const dictionarySource = this.getDictionarySource();
        const dataset = dictionarySource.dataset;
        const config = dictionarySource.config;
        const split = dictionarySource.split;
        try {
            const cacheResult = await this.loadFromCache();
            if (cacheResult.success) {
                this.wayuuDictionary = cacheResult.data;
                this.totalEntries = cacheResult.data.length;
                this.isLoaded = true;
                this.logger.log(`🎯 Loaded ${cacheResult.data.length} entries from local cache (${cacheResult.source})`);
                if (cacheResult.shouldUpdate) {
                    this.logger.log('📡 Checking for dataset updates in background...');
                    this.checkForUpdatesInBackground(dataset, config, split);
                }
                return;
            }
            this.logger.log('💾 Cache not available, loading from Hugging Face...');
            const entries = await this.loadViaRowsAPI(dataset, config, split);
            if (entries.length > 0) {
                this.wayuuDictionary = entries;
                this.totalEntries = entries.length;
                this.isLoaded = true;
                await this.saveToCache(entries, dataset);
                this.logger.log(`✅ Successfully loaded ${entries.length} entries and saved to cache`);
                return;
            }
            this.logger.warn('🔄 API failed, attempting to load expired cache...');
            const expiredCache = await this.loadFromCache(true);
            if (expiredCache.success) {
                this.wayuuDictionary = expiredCache.data;
                this.totalEntries = expiredCache.data.length;
                this.isLoaded = true;
                this.logger.log(`⚠️  Loaded ${expiredCache.data.length} entries from expired cache`);
                return;
            }
            this.logger.warn('📝 All methods failed, using sample data');
            await this.loadSampleData();
        }
        catch (error) {
            this.logger.error(`❌ Failed to load dataset: ${error.message}`);
            const emergencyCache = await this.loadFromCache(true);
            if (emergencyCache.success) {
                this.wayuuDictionary = emergencyCache.data;
                this.totalEntries = emergencyCache.data.length;
                this.isLoaded = true;
                this.logger.log(`🆘 Emergency fallback: loaded ${emergencyCache.data.length} entries from cache`);
            }
            else {
                await this.loadSampleData();
            }
        }
        await this.updateDatasetMetrics();
    }
    async _performAudioDatasetLoad() {
        this.logger.log('🎵 Loading Wayuu audio dataset with intelligent cache...');
        const audioSource = this.getAudioSource();
        const dataset = audioSource.dataset;
        const config = audioSource.config;
        const split = audioSource.split;
        try {
            const cacheResult = await this.loadAudioFromCache();
            if (cacheResult.success) {
                this.wayuuAudioDataset = cacheResult.data;
                this.totalAudioEntries = cacheResult.data.length;
                this.isAudioLoaded = true;
                this.logger.log(`🎯 Loaded ${cacheResult.data.length} audio entries from local cache (${cacheResult.source})`);
                await this.audioDurationService.updateAudioDurationCache(this.wayuuAudioDataset);
                this.wayuuAudioDataset = this.audioDurationService.enrichAudioEntriesWithDurations(this.wayuuAudioDataset);
                if (cacheResult.shouldUpdate) {
                    this.logger.log('📡 Checking for audio dataset updates in background...');
                    this.checkForAudioUpdatesInBackground(dataset, config, split);
                }
                return;
            }
            this.logger.log('💾 Audio cache not available, loading from Hugging Face...');
            const entries = await this.loadAudioViaRowsAPI(dataset, config, split);
            if (entries.length > 0) {
                this.wayuuAudioDataset = entries;
                this.totalAudioEntries = entries.length;
                this.isAudioLoaded = true;
                await this.audioDurationService.updateAudioDurationCache(this.wayuuAudioDataset);
                this.wayuuAudioDataset = this.audioDurationService.enrichAudioEntriesWithDurations(this.wayuuAudioDataset);
                await this.saveAudioToCache(this.wayuuAudioDataset, dataset);
                this.logger.log(`✅ Successfully loaded ${entries.length} audio entries and saved to cache`);
                return;
            }
            this.logger.warn('🔄 Audio API failed, attempting to load expired cache...');
            const expiredCache = await this.loadAudioFromCache(true);
            if (expiredCache.success) {
                this.wayuuAudioDataset = expiredCache.data;
                this.totalAudioEntries = expiredCache.data.length;
                this.isAudioLoaded = true;
                await this.audioDurationService.updateAudioDurationCache(this.wayuuAudioDataset);
                this.wayuuAudioDataset = this.audioDurationService.enrichAudioEntriesWithDurations(this.wayuuAudioDataset);
                this.logger.log(`⚠️  Loaded ${expiredCache.data.length} audio entries from expired cache`);
                return;
            }
            this.logger.warn('📝 All audio methods failed, using sample audio data');
            await this.loadSampleAudioData();
        }
        catch (error) {
            this.logger.error(`❌ Failed to load audio dataset: ${error.message}`);
            const emergencyCache = await this.loadAudioFromCache(true);
            if (emergencyCache.success) {
                this.wayuuAudioDataset = emergencyCache.data;
                this.totalAudioEntries = emergencyCache.data.length;
                this.isAudioLoaded = true;
                await this.audioDurationService.updateAudioDurationCache(this.wayuuAudioDataset);
                this.wayuuAudioDataset = this.audioDurationService.enrichAudioEntriesWithDurations(this.wayuuAudioDataset);
                this.logger.log(`🆘 Emergency fallback: loaded ${emergencyCache.data.length} audio entries from cache`);
            }
            else {
                await this.loadSampleAudioData();
            }
        }
        await this.updateDatasetMetrics();
    }
    async loadViaRowsAPI(dataset, config, split) {
        const entries = [];
        const batchSize = 100;
        let offset = 0;
        let hasMoreData = true;
        let totalRows = 0;
        const maxEntries = 2200;
        this.logger.log(`📥 Starting dataset load via rows API...`);
        while (hasMoreData && entries.length < maxEntries) {
            try {
                const url = `https://datasets-server.huggingface.co/rows?dataset=${dataset}&config=${config}&split=${split}&offset=${offset}&length=${batchSize}`;
                this.logger.log(`📥 Fetching batch ${Math.floor(offset / batchSize) + 1}: rows ${offset}-${offset + batchSize - 1}`);
                const response = await axios_1.default.get(url, {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'WayuuTranslator/1.0'
                    }
                });
                if (response.data && response.data.rows && response.data.rows.length > 0) {
                    if (totalRows === 0 && response.data.num_rows_total) {
                        totalRows = response.data.num_rows_total;
                        this.logger.log(`📊 Dataset contains ${totalRows} total rows`);
                    }
                    const batchEntries = response.data.rows.map((row) => {
                        let guc = '';
                        let spa = '';
                        if (row.row.translation?.guc && row.row.translation?.spa) {
                            guc = row.row.translation.guc.trim();
                            spa = row.row.translation.spa.trim();
                        }
                        else if (row.row.guc && row.row.es) {
                            guc = row.row.guc.trim();
                            spa = row.row.es.trim();
                        }
                        else if (row.row.guc && row.row.spa) {
                            guc = row.row.guc.trim();
                            spa = row.row.spa.trim();
                        }
                        return { guc, spa };
                    }).filter(entry => entry.guc && entry.spa);
                    entries.push(...batchEntries);
                    this.logger.log(`✅ Batch ${Math.floor(offset / batchSize) + 1}: loaded ${batchEntries.length} entries (Total: ${entries.length})`);
                    offset += batchSize;
                    hasMoreData = response.data.rows.length === batchSize && offset < totalRows;
                    if (hasMoreData) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                else {
                    this.logger.warn(`❌ Batch ${Math.floor(offset / batchSize) + 1}: No data received`);
                    hasMoreData = false;
                }
            }
            catch (error) {
                this.logger.error(`❌ Batch ${Math.floor(offset / batchSize) + 1} failed: ${error.message}`);
                if (entries.length === 0) {
                    hasMoreData = false;
                }
                else {
                    hasMoreData = false;
                    this.logger.warn(`Stopping due to error, but loaded ${entries.length} entries successfully`);
                }
            }
        }
        this.logger.log(`🎯 Dataset loading completed: ${entries.length} entries loaded from ${totalRows} total`);
        return entries;
    }
    async loadAudioViaRowsAPI(dataset, config, split) {
        const entries = [];
        const batchSize = 100;
        let offset = 0;
        let hasMoreData = true;
        let totalRows = 0;
        const maxEntries = 1000;
        this.logger.log(`🎵 Starting audio dataset load via rows API...`);
        while (hasMoreData && entries.length < maxEntries) {
            try {
                const url = `https://datasets-server.huggingface.co/rows?dataset=${dataset}&config=${config}&split=${split}&offset=${offset}&length=${batchSize}`;
                this.logger.log(`🎵 Fetching audio batch ${Math.floor(offset / batchSize) + 1}: rows ${offset}-${offset + batchSize - 1}`);
                const response = await axios_1.default.get(url, {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Wayuu-Spanish-Translator/1.0'
                    }
                });
                if (!response.data || !response.data.rows) {
                    this.logger.warn(`⚠️ No data received for batch ${Math.floor(offset / batchSize) + 1}`);
                    break;
                }
                const batch = response.data.rows;
                totalRows = response.data.num_rows_total || totalRows;
                if (totalRows > 0) {
                    this.logger.log(`🎵 Audio dataset contains ${totalRows} total rows`);
                }
                for (const item of batch) {
                    try {
                        const row = item.row;
                        if (!row || !row.audio || !row.transcription) {
                            continue;
                        }
                        const audioData = Array.isArray(row.audio) ? row.audio[0] : row.audio;
                        const audioUrl = audioData?.src || audioData?.path;
                        const transcription = row.transcription;
                        if (!audioUrl || !transcription) {
                            continue;
                        }
                        const audioEntry = {
                            id: `audio_${entries.length.toString().padStart(3, '0')}`,
                            transcription: transcription.trim(),
                            audioDuration: this.estimateAudioDuration(transcription.trim()),
                            audioUrl: audioUrl,
                            fileName: `audio_${entries.length.toString().padStart(3, '0')}.wav`,
                            source: 'orkidea/wayuu_CO_test',
                            isDownloaded: false,
                            downloadPriority: 'medium',
                            batchNumber: Math.floor(entries.length / 100) + 1
                        };
                        entries.push(audioEntry);
                    }
                    catch (itemError) {
                        this.logger.warn(`⚠️ Error processing audio item: ${itemError.message}`);
                        continue;
                    }
                }
                this.logger.log(`✅ Audio batch ${Math.floor(offset / batchSize) + 1}: loaded ${batch.length} entries (Total: ${entries.length})`);
                if (batch.length < batchSize || offset + batchSize >= totalRows) {
                    hasMoreData = false;
                }
                else {
                    offset += batchSize;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            catch (error) {
                this.logger.error(`❌ Error fetching audio batch ${Math.floor(offset / batchSize) + 1}: ${error.message}`);
                if (error.response?.status === 429) {
                    this.logger.log('⏳ Rate limit hit, waiting 5 seconds...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }
                break;
            }
        }
        this.logger.log(`🎯 Audio dataset loading completed: ${entries.length} entries loaded from ${totalRows} total`);
        const entriesWithDurations = this.generateRealisticAudioDurations(entries);
        const totalDuration = entriesWithDurations.reduce((sum, entry) => sum + entry.audioDuration, 0);
        this.logger.log(`🎵 Applied realistic durations: ${totalDuration.toFixed(1)}s total (avg: ${(totalDuration / entriesWithDurations.length).toFixed(1)}s per entry)`);
        return entriesWithDurations;
    }
    async loadFromCache(ignoreExpiry = false) {
        try {
            const cacheExists = await this.fileExists(this.cacheFile);
            const metadataExists = await this.fileExists(this.metadataFile);
            if (!cacheExists || !metadataExists) {
                return { success: false, data: [], source: 'no-cache', shouldUpdate: false };
            }
            const metadataContent = await fs.readFile(this.metadataFile, 'utf-8');
            const metadata = JSON.parse(metadataContent);
            const lastUpdated = new Date(metadata.lastUpdated);
            const now = new Date();
            const isExpired = (now.getTime() - lastUpdated.getTime()) > this.cacheMaxAge;
            if (isExpired && !ignoreExpiry) {
                this.logger.log(`⏰ Cache expired (${Math.round((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60))} hours old)`);
                return { success: false, data: [], source: 'expired', shouldUpdate: false };
            }
            const cacheContent = await fs.readFile(this.cacheFile, 'utf-8');
            const cachedData = JSON.parse(cacheContent);
            const shouldUpdate = isExpired || (now.getTime() - lastUpdated.getTime()) > (this.cacheMaxAge / 2);
            const source = isExpired ? 'expired-cache' : 'fresh-cache';
            this.logger.log(`📚 Cache loaded: ${cachedData.length} entries from ${metadata.lastUpdated} (${source})`);
            return {
                success: true,
                data: cachedData,
                source,
                shouldUpdate
            };
        }
        catch (error) {
            this.logger.error(`❌ Failed to load cache: ${error.message}`);
            return { success: false, data: [], source: 'error', shouldUpdate: false };
        }
    }
    async saveToCache(data, datasetSource) {
        try {
            await this.ensureCacheDirectory();
            const metadata = {
                lastUpdated: new Date().toISOString(),
                totalEntries: data.length,
                datasetVersion: '1.0',
                source: datasetSource,
                checksum: this.generateChecksum(data)
            };
            await fs.writeFile(this.cacheFile, JSON.stringify(data, null, 2), 'utf-8');
            await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2), 'utf-8');
            this.logger.log(`💾 Cache saved: ${data.length} entries to ${this.cacheFile}`);
        }
        catch (error) {
            this.logger.error(`❌ Failed to save cache: ${error.message}`);
        }
    }
    async checkForUpdatesInBackground(dataset, config, split) {
        setTimeout(async () => {
            try {
                this.logger.log('🔍 Checking for dataset updates...');
                const url = `https://datasets-server.huggingface.co/rows?dataset=${dataset}&config=${config}&split=${split}&offset=0&length=5`;
                const response = await axios_1.default.get(url, { timeout: 10000 });
                if (response.data && response.data.num_rows_total) {
                    const remoteTotal = response.data.num_rows_total;
                    if (remoteTotal !== this.totalEntries) {
                        this.logger.log(`🆕 Dataset update detected: ${remoteTotal} entries (current: ${this.totalEntries})`);
                    }
                    else {
                        this.logger.log('✅ Dataset is up to date');
                    }
                }
            }
            catch (error) {
                this.logger.debug(`Background update check failed: ${error.message}`);
            }
        }, 5000);
    }
    async loadAudioFromCache(ignoreExpiry = false) {
        try {
            const cacheExists = await this.fileExists(this.audioCacheFile);
            const metadataExists = await this.fileExists(this.audioMetadataFile);
            if (!cacheExists || !metadataExists) {
                return { success: false, data: [], source: 'no-cache', shouldUpdate: false };
            }
            const metadataContent = await fs.readFile(this.audioMetadataFile, 'utf-8');
            const metadata = JSON.parse(metadataContent);
            const lastUpdated = new Date(metadata.lastUpdated);
            const now = new Date();
            const ageMs = now.getTime() - lastUpdated.getTime();
            const isExpired = ageMs > this.cacheMaxAge;
            if (isExpired && !ignoreExpiry) {
                this.logger.log(`⏰ Audio cache expired (${Math.round(ageMs / (1000 * 60 * 60))} hours old)`);
                return { success: false, data: [], source: 'expired-cache', shouldUpdate: true };
            }
            const cacheContent = await fs.readFile(this.audioCacheFile, 'utf-8');
            const data = JSON.parse(cacheContent);
            if (!Array.isArray(data) || data.length === 0) {
                this.logger.warn('⚠️  Audio cache data is invalid or empty');
                return { success: false, data: [], source: 'invalid-cache', shouldUpdate: true };
            }
            const source = isExpired ? 'expired-cache' : 'fresh-cache';
            const shouldUpdate = isExpired || ageMs > (this.cacheMaxAge * 0.5);
            this.logger.log(`📦 Audio cache loaded: ${data.length} entries (${source}, age: ${Math.round(ageMs / (1000 * 60 * 60))}h)`);
            return { success: true, data, source, shouldUpdate };
        }
        catch (error) {
            this.logger.error(`❌ Failed to load audio cache: ${error.message}`);
            return { success: false, data: [], source: 'cache-error', shouldUpdate: true };
        }
    }
    async saveAudioToCache(data, datasetSource) {
        try {
            await this.ensureCacheDirectory();
            const durationCache = this.audioDurationService.getDurationCache();
            const totalDuration = durationCache.totalDurationSeconds || data.reduce((sum, entry) => sum + (entry.audioDuration || 0), 0);
            const averageDuration = durationCache.averageDurationSeconds || (data.length > 0 ? totalDuration / data.length : 0);
            const metadata = {
                lastUpdated: new Date().toISOString(),
                totalAudioEntries: data.length,
                totalDurationSeconds: totalDuration,
                averageDurationSeconds: averageDuration,
                datasetVersion: '1.0',
                source: datasetSource,
                checksum: this.generateAudioChecksum(data)
            };
            await fs.writeFile(this.audioCacheFile, JSON.stringify(data, null, 2), 'utf-8');
            await fs.writeFile(this.audioMetadataFile, JSON.stringify(metadata, null, 2), 'utf-8');
            this.logger.log(`💾 Audio cache saved: ${data.length} entries, ${totalDuration.toFixed(1)}s total duration to ${this.audioCacheFile}`);
        }
        catch (error) {
            this.logger.error(`❌ Failed to save audio cache: ${error.message}`);
        }
    }
    async checkForAudioUpdatesInBackground(dataset, config, split) {
        setTimeout(async () => {
            try {
                this.logger.log('🔍 Checking for audio dataset updates...');
                const url = `https://datasets-server.huggingface.co/rows?dataset=${dataset}&config=${config}&split=${split}&offset=0&length=5`;
                const response = await axios_1.default.get(url, { timeout: 10000 });
                if (response.data && response.data.num_rows_total) {
                    const remoteTotal = response.data.num_rows_total;
                    if (remoteTotal !== this.totalAudioEntries) {
                        this.logger.log(`🆕 Audio dataset update detected: ${remoteTotal} entries (current: ${this.totalAudioEntries})`);
                    }
                    else {
                        this.logger.log('✅ Audio dataset is up to date');
                    }
                }
            }
            catch (error) {
                this.logger.debug(`Background audio update check failed: ${error.message}`);
            }
        }, 5000);
    }
    async loadSampleAudioData() {
        const sampleAudioData = [
            {
                id: 'sample_audio_1',
                transcription: 'müshia chi wayuu jemeikai nüchikua nütüma chi Naaꞌinkai Maleiwa',
                audioDuration: 3.2,
                source: 'orkidea/wayuu_CO_test',
                fileName: 'sample_001.wav'
            },
            {
                id: 'sample_audio_2',
                transcription: 'Nnojoishi nüjütüinshin chi Nüchonkai saꞌakamüin wayuu',
                audioDuration: 2.8,
                source: 'orkidea/wayuu_CO_test',
                fileName: 'sample_002.wav'
            },
            {
                id: 'sample_audio_3',
                transcription: 'tayakai chi Shipayakai Wayuu',
                audioDuration: 1.9,
                source: 'orkidea/wayuu_CO_test',
                fileName: 'sample_003.wav'
            }
        ];
        this.wayuuAudioDataset = sampleAudioData;
        this.totalAudioEntries = sampleAudioData.length;
        this.isAudioLoaded = true;
        this.logger.log(`📝 Loaded ${sampleAudioData.length} sample audio entries with realistic durations`);
    }
    generateAudioChecksum(data) {
        const content = data.map(entry => `${entry.id}:${entry.transcription}:${entry.audioDuration}`).join('|');
        return Buffer.from(content).toString('base64').substring(0, 16);
    }
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async ensureCacheDirectory() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        }
        catch (error) {
            this.logger.error(`Failed to create cache directory: ${error.message}`);
        }
    }
    generateChecksum(data) {
        const content = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
    async loadViaParquet(dataset) {
        try {
            const parquetResponse = await axios_1.default.get(`https://datasets-server.huggingface.co/parquet?dataset=${dataset}`, { timeout: 10000 });
            if (parquetResponse.data && parquetResponse.data.parquet_files && parquetResponse.data.parquet_files.length > 0) {
                const parquetUrl = parquetResponse.data.parquet_files[0].url;
                this.logger.log(`Found parquet file: ${parquetUrl}`);
                this.logger.warn('Parquet loading not yet implemented - parquet file available at: ' + parquetUrl);
            }
        }
        catch (error) {
            this.logger.error(`Parquet method failed: ${error.message}`);
        }
        return [];
    }
    async loadSampleData() {
        this.logger.log('Loading sample Wayuu-Spanish dictionary data...');
        this.wayuuDictionary = [
            { guc: 'aa', spa: 'sí' },
            { guc: 'aainjaa', spa: 'hacer' },
            { guc: 'aainjaa', spa: 'elaborar fabricar' },
            { guc: 'aainjaa', spa: 'construir' },
            { guc: 'aainjala', spa: 'acción mala pecado' },
            { guc: 'aaint', spa: 'donde' },
            { guc: 'aainjatü', spa: 'estar activo' },
            { guc: 'aaipana', spa: 'que me place' },
            { guc: 'aaipa', spa: 'querer desear' },
            { guc: 'aakua', spa: 'estar' },
            { guc: 'aalain', spa: 'dentro' },
            { guc: 'aalajawaa', spa: 'robar' },
            { guc: 'aalawaa', spa: 'lavar' },
            { guc: 'aamaa', spa: 'todavía aún' },
            { guc: 'aamaka', spa: 'también' },
            { guc: 'aamüin', spa: 'no querer' },
            { guc: 'aanain', spa: 'arriba' },
            { guc: 'aanaka', spa: 'después' },
            { guc: 'aane', spa: 'hacia arriba' },
            { guc: 'aantaa', spa: 'caminar' },
            { guc: 'aapain', spa: 'abajo' },
            { guc: 'aashajawin', spa: 'enseñar' },
            { guc: 'aashaje', spa: 'mostrárselo' },
            { guc: 'aashajia', spa: 'enseñar' },
            { guc: 'aashajuin', spa: 'mostrar' },
            { guc: 'aatamaajachi', spa: 'haber escuchado' },
            { guc: 'aatamaa', spa: 'escuchar' },
            { guc: 'aatchiki', spa: 'cómo está' },
            { guc: 'aatchon', spa: 'bueno' },
            { guc: 'aawataa', spa: 'hablar' },
            { guc: 'achajawaa', spa: 'soñar' },
            { guc: 'achakaa', spa: 'estar enfermo' },
            { guc: 'achekaa', spa: 'conocer' },
            { guc: 'achiki', spa: 'cómo' },
            { guc: 'achikijaa', spa: 'así' },
            { guc: 'achon', spa: 'bueno' },
            { guc: 'achukua', spa: 'coger' },
            { guc: 'achuntaa', spa: 'pensar' },
            { guc: 'achuntüin', spa: 'pensar en' },
            { guc: 'eekai', spa: 'aquí' },
            { guc: 'eera', spa: 'viento' },
            { guc: 'eiruku', spa: 'alma' },
            { guc: 'ekai', spa: 'aquí' },
            { guc: 'ekii', spa: 'este' },
            { guc: 'ekerata', spa: 'temprano' },
            { guc: 'eküülü', spa: 'tierra' },
            { guc: 'emaa', spa: 'agua' },
            { guc: 'epana', spa: 'qué bueno' },
            { guc: 'epeyuu', spa: 'lluvia' },
            { guc: 'jaarai', spa: 'cuándo' },
            { guc: 'jaashi', spa: 'sol' },
            { guc: 'jakaa', spa: 'comer' },
            { guc: 'jama', spa: 'perro' },
            { guc: 'jamü', spa: 'casa' },
            { guc: 'janama', spa: 'mujer' },
            { guc: 'jashichijee', spa: 'anteayer' },
            { guc: 'jashichon', spa: 'ayer' },
            { guc: 'jashichijeejachi', spa: 'antes de ayer' },
            { guc: 'jashichiree', spa: 'mañana' },
            { guc: 'jashichireejachi', spa: 'pasado mañana' },
            { guc: 'jataa', spa: 'venir' },
            { guc: 'jee', spa: 'día' },
            { guc: 'jemiai', spa: 'qué' },
            { guc: 'jerai', spa: 'cuál' },
            { guc: 'jierü', spa: 'barriga' },
            { guc: 'jimü', spa: 'mi' },
            { guc: 'jintü', spa: 'pueblo' },
            { guc: 'jiyaa', spa: 'corazón' },
            { guc: 'joo', spa: 'lluvia' },
            { guc: 'joolu', spa: 'joven' },
            { guc: 'jootoo', spa: 'dormir' },
            { guc: 'jopuu', spa: 'flor' },
            { guc: 'jukuaipa', spa: 'trabajar' },
            { guc: 'jukuaipaa', spa: 'trabajo' },
            { guc: 'jupuu', spa: 'verde' },
            { guc: 'jüchon', spa: 'dulce' },
            { guc: 'jümaa', spa: 'hijo' },
            { guc: 'jünüikü', spa: 'pequeño' },
            { guc: 'jürütü', spa: 'negro' },
            { guc: 'jütuma', spa: 'palabra' },
            { guc: 'jüyoutaasu', spa: 'cielo' },
            { guc: 'ka', spa: 'y' },
            { guc: 'kaa', spa: 'tierra' },
            { guc: 'kachon', spa: 'oro' },
            { guc: 'kai', spa: 'aquí' },
            { guc: 'kakat', spa: 'fuego' },
            { guc: 'kalaka', spa: 'gallo' },
            { guc: 'kama', spa: 'nosotros' },
            { guc: 'kamaa', spa: 'caimán' },
            { guc: 'kanülü', spa: 'mar' },
            { guc: 'kasain', spa: 'ahora' },
            { guc: 'kaseechi', spa: 'viejo' },
            { guc: 'kashí', spa: 'luna' },
            { guc: 'kashi', spa: 'mes' },
            { guc: 'kataa', spa: 'querer' },
            { guc: 'ke', spa: 'aquí' },
            { guc: 'kii', spa: 'este' },
            { guc: 'kooloo', spa: 'negro' },
            { guc: 'kottaa', spa: 'cortar' },
            { guc: 'küchee', spa: 'cochino' },
            { guc: 'kümaa', spa: 'tigre' },
            { guc: 'ma', spa: 'no' },
            { guc: 'maa', spa: 'no' },
            { guc: 'maalü', spa: 'morrocoy' },
            { guc: 'majaa', spa: 'cinco' },
            { guc: 'majayulü', spa: 'estrella' },
            { guc: 'makii', spa: 'lejos' },
            { guc: 'maköi', spa: 'cuando' },
            { guc: 'maleewa', spa: 'amigo' },
            { guc: 'maleiwa', spa: 'dios' },
            { guc: 'maliiwana', spa: 'espíritu' },
            { guc: 'mana', spa: 'donde' },
            { guc: 'maneiwa', spa: 'chamán' },
            { guc: 'mannei', spa: 'quien' },
            { guc: 'maralü', spa: 'sal' },
            { guc: 'maria', spa: 'diez' },
            { guc: 'marülü', spa: 'vaca' },
            { guc: 'masaa', spa: 'brazo' },
            { guc: 'matuna', spa: 'mujer sabia' },
            { guc: 'mawai', spa: 'por qué' },
            { guc: 'miichi', spa: 'gato' },
            { guc: 'mma', spa: 'tu' },
            { guc: 'mmakat', spa: 'cuatro' },
            { guc: 'mojuu', spa: 'dos' },
            { guc: 'muin', spa: 'cara' },
            { guc: 'müin', spa: 'cara' },
            { guc: 'mürülü', spa: 'caballo' },
            { guc: 'müshü', spa: 'ratón' },
            { guc: 'na', spa: 'allá' },
            { guc: 'naa', spa: 'él ella' },
            { guc: 'nnoho', spa: 'tú' },
            { guc: 'nüchiki', spa: 'donde' },
            { guc: 'ojorotaa', spa: 'jugar' },
            { guc: 'okotchon', spa: 'rojo' },
            { guc: 'olotoo', spa: 'mirar' },
            { guc: 'oo', spa: 'sí' },
            { guc: 'ootoo', spa: 'ir' },
            { guc: 'orülewaa', spa: 'bailar' },
            { guc: 'otta', spa: 'ave' },
            { guc: 'palaa', spa: 'mar' },
            { guc: 'püliiku', spa: 'burro' },
            { guc: 'pünaa', spa: 'tierra' },
            { guc: 'shia', spa: 'uno' },
            { guc: 'süchukua', spa: 'tres' },
            { guc: 'taa', spa: 'yo' },
            { guc: 'tü', spa: 'de' },
            { guc: 'tuma', spa: 'hijo' },
            { guc: 'tüü', spa: 'hombre' },
            { guc: 'uchii', spa: 'hermano' },
            { guc: 'ulakat', spa: 'otro' },
            { guc: 'wayuu', spa: 'persona' },
            { guc: 'watta', spa: 'hermana' }
        ];
        this.totalEntries = this.wayuuDictionary.length;
        this.isLoaded = true;
        this.logger.log(`Loaded ${this.totalEntries} sample dictionary entries`);
    }
    async reloadDataset(clearCache = false) {
        try {
            this.logger.log(`🔄 Forcing dataset reload${clearCache ? ' (clearing cache)' : ''}...`);
            if (clearCache) {
                await this.clearCache();
            }
            this.isLoaded = false;
            this.wayuuDictionary = [];
            this.totalEntries = 0;
            await this.loadWayuuDictionary();
            return {
                success: true,
                message: `Dataset reloaded successfully with ${this.totalEntries} entries`,
                totalEntries: this.totalEntries
            };
        }
        catch (error) {
            this.logger.error(`Failed to reload dataset: ${error.message}`);
            return {
                success: false,
                message: `Failed to reload dataset: ${error.message}`
            };
        }
    }
    async clearCache() {
        try {
            const cacheExists = await this.fileExists(this.cacheFile);
            const metadataExists = await this.fileExists(this.metadataFile);
            if (cacheExists) {
                await fs.unlink(this.cacheFile);
                this.logger.log('🗑️ Cache file deleted');
            }
            if (metadataExists) {
                await fs.unlink(this.metadataFile);
                this.logger.log('🗑️ Metadata file deleted');
            }
        }
        catch (error) {
            this.logger.error(`Failed to clear cache: ${error.message}`);
        }
    }
    async getCacheInfo() {
        try {
            const cacheExists = await this.fileExists(this.cacheFile);
            const metadataExists = await this.fileExists(this.metadataFile);
            if (!cacheExists || !metadataExists) {
                return { exists: false };
            }
            const metadataContent = await fs.readFile(this.metadataFile, 'utf-8');
            const metadata = JSON.parse(metadataContent);
            const stats = await fs.stat(this.cacheFile);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            return {
                exists: true,
                metadata,
                size: `${sizeInMB} MB`
            };
        }
        catch (error) {
            this.logger.error(`Failed to get cache info: ${error.message}`);
            return { exists: false };
        }
    }
    async findExactMatch(text, direction, preferredDataset) {
        if (!this.isLoaded) {
            await this.loadWayuuDictionary();
        }
        const normalizedText = this.normalizeText(text);
        let matches = [];
        if (direction === translate_dto_1.TranslationDirection.WAYUU_TO_SPANISH) {
            matches = this.wayuuDictionary.filter(entry => this.normalizeText(entry.guc) === normalizedText);
        }
        else {
            matches = this.wayuuDictionary.filter(entry => this.normalizeText(entry.spa).includes(normalizedText) ||
                entry.spa.toLowerCase().split(' ').some(word => this.normalizeText(word) === normalizedText));
        }
        if (matches.length === 0) {
            return null;
        }
        const primaryMatch = matches[0];
        const alternatives = matches.slice(1).map(match => direction === translate_dto_1.TranslationDirection.WAYUU_TO_SPANISH ? match.spa : match.guc);
        return {
            translatedText: direction === translate_dto_1.TranslationDirection.WAYUU_TO_SPANISH ?
                primaryMatch.spa : primaryMatch.guc,
            confidence: 1.0,
            sourceDataset: 'Gaxys/wayuu_spa_dict',
            alternatives: alternatives.length > 0 ? alternatives : undefined,
            contextInfo: alternatives.length > 0 ?
                `Found ${matches.length} possible translations` : undefined,
        };
    }
    async findFuzzyMatch(text, direction, preferredDataset) {
        if (!this.isLoaded) {
            await this.loadWayuuDictionary();
        }
        const normalizedText = this.normalizeText(text);
        let bestMatches = [];
        if (direction === translate_dto_1.TranslationDirection.WAYUU_TO_SPANISH) {
            bestMatches = this.wayuuDictionary
                .map(entry => ({
                entry,
                similarity: this.calculateSimilarity(normalizedText, this.normalizeText(entry.guc))
            }))
                .filter(match => match.similarity > 0.6)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 5);
        }
        else {
            bestMatches = this.wayuuDictionary
                .map(entry => ({
                entry,
                similarity: Math.max(this.calculateSimilarity(normalizedText, this.normalizeText(entry.spa)), ...entry.spa.toLowerCase().split(' ').map(word => this.calculateSimilarity(normalizedText, this.normalizeText(word))))
            }))
                .filter(match => match.similarity > 0.6)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 5);
        }
        if (bestMatches.length === 0) {
            return null;
        }
        const bestMatch = bestMatches[0];
        const alternatives = bestMatches.slice(1).map(match => direction === translate_dto_1.TranslationDirection.WAYUU_TO_SPANISH ? match.entry.spa : match.entry.guc);
        return {
            translatedText: direction === translate_dto_1.TranslationDirection.WAYUU_TO_SPANISH ?
                bestMatch.entry.spa : bestMatch.entry.guc,
            confidence: bestMatch.similarity,
            sourceDataset: 'Gaxys/wayuu_spa_dict',
            alternatives: alternatives.length > 0 ? alternatives : undefined,
            contextInfo: `Fuzzy match with ${Math.round(bestMatch.similarity * 100)}% similarity`,
        };
    }
    normalizeText(text) {
        return text.toLowerCase()
            .trim()
            .replace(/[.,;:!?]/g, '')
            .replace(/\s+/g, ' ');
    }
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0) {
            return 1.0;
        }
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    async getLoadedDatasets() {
        return ['Gaxys/wayuu_spa_dict', 'orkidea/wayuu_CO_test'];
    }
    async getDatasetInfo() {
        return {
            datasets: [
                {
                    name: 'Gaxys/wayuu_spa_dict',
                    description: 'Wayuu-Spanish dictionary with over 2,000 entries',
                    entries: this.wayuuDictionary.length,
                    loaded: this.isLoaded,
                    source: 'https://huggingface.co/datasets/Gaxys/wayuu_spa_dict',
                    type: 'text'
                },
                {
                    name: 'orkidea/wayuu_CO_test',
                    description: 'Wayuu audio dataset with transcriptions and speech recordings',
                    entries: this.wayuuAudioDataset.length,
                    loaded: this.isAudioLoaded,
                    source: 'https://huggingface.co/datasets/orkidea/wayuu_CO_test',
                    type: 'audio',
                    totalDurationMinutes: this.wayuuAudioDataset.reduce((sum, entry) => sum + entry.audioDuration, 0) / 60,
                    averageDurationSeconds: this.wayuuAudioDataset.length > 0
                        ? this.wayuuAudioDataset.reduce((sum, entry) => sum + entry.audioDuration, 0) / this.wayuuAudioDataset.length
                        : 0
                }
            ],
            totalEntries: this.wayuuDictionary.length,
            totalAudioEntries: this.wayuuAudioDataset.length,
            status: this.isLoaded && this.isAudioLoaded ? 'loaded' : 'loading'
        };
    }
    async getDictionaryStats() {
        if (!this.isLoaded) {
            await this.loadWayuuDictionary();
        }
        if (!this.isAudioLoaded) {
            await this.loadWayuuAudioDataset();
        }
        const allEntries = [...this.wayuuDictionary];
        this.additionalDatasets.forEach((entries) => {
            allEntries.push(...entries);
        });
        const wayuuWords = new Set(allEntries.map(entry => entry.guc)).size;
        const spanishWords = new Set(allEntries.flatMap(entry => entry.spa.toLowerCase().split(' '))).size;
        const totalAudioDuration = this.wayuuAudioDataset.reduce((sum, entry) => sum + entry.audioDuration, 0);
        const averageAudioDuration = this.wayuuAudioDataset.length > 0 ? totalAudioDuration / this.wayuuAudioDataset.length : 0;
        const audioTranscriptionWords = new Set(this.wayuuAudioDataset.flatMap(entry => entry.transcription.toLowerCase().split(' ').filter(word => word.length > 0))).size;
        return {
            totalEntries: allEntries.length,
            totalEntriesExpected: this.calculateTotalExpectedEntries(),
            uniqueWayuuWords: wayuuWords,
            uniqueSpanishWords: spanishWords,
            averageSpanishWordsPerEntry: allEntries.length > 0 ?
                allEntries.reduce((sum, entry) => sum + entry.spa.split(' ').length, 0) / allEntries.length : 0,
            totalAudioEntries: this.wayuuAudioDataset.length,
            totalAudioEntriesExpected: this.totalAudioEntries || 'Unknown',
            totalAudioDurationSeconds: totalAudioDuration,
            totalAudioDurationMinutes: Math.round(totalAudioDuration / 60 * 100) / 100,
            averageAudioDurationSeconds: Math.round(averageAudioDuration * 100) / 100,
            uniqueAudioTranscriptionWords: audioTranscriptionWords,
            loadingMethods: {
                parquetAPI: 'Not implemented (requires Apache Arrow)',
                datasetsAPI: 'Available with pagination (up to 10k entries)',
                directDownload: 'Attempted multiple JSON endpoints',
                sampleData: 'Enhanced fallback with 115 entries',
                audioAPI: 'Available with pagination for audio dataset'
            },
            sampleEntries: allEntries.slice(0, 5),
            sampleAudioEntries: this.wayuuAudioDataset.slice(0, 5),
            datasetInfo: this.getLoadedDatasetInfo(),
            lastLoaded: new Date().toISOString(),
        };
    }
    async getAudioDatasetInfo() {
        const audioSource = this.getAudioSource();
        return {
            dataset: {
                name: audioSource.name,
                description: audioSource.description,
                entries: this.wayuuAudioDataset.length,
                loaded: this.isAudioLoaded,
                source: audioSource.dataset,
                url: audioSource.url,
                type: audioSource.type
            },
            totalEntries: this.wayuuAudioDataset.length,
            status: this.isAudioLoaded ? 'loaded' : 'loading'
        };
    }
    async getAudioStats() {
        if (!this.isAudioLoaded) {
            await this.loadWayuuAudioDataset();
        }
        const allSources = await this.getHuggingFaceSources();
        const activeAudioSources = allSources.filter(source => source.type === 'audio' && source.isActive);
        let totalCombinedEntries = 0;
        let totalCombinedDurationSeconds = 0;
        let averageCombinedDuration = 0;
        for (const source of activeAudioSources) {
            if (source.totalEntries) {
                totalCombinedEntries += source.totalEntries;
            }
            if (source.totalDurationSeconds) {
                totalCombinedDurationSeconds += source.totalDurationSeconds;
            }
        }
        if (totalCombinedEntries > 0) {
            averageCombinedDuration = totalCombinedDurationSeconds / totalCombinedEntries;
        }
        const durationCache = this.audioDurationService.getDurationCache();
        const mainDatasetDuration = durationCache.totalDurationSeconds > 0
            ? durationCache.totalDurationSeconds
            : this.wayuuAudioDataset.reduce((sum, entry) => sum + (entry.audioDuration || 0), 0);
        const mainDatasetAverage = durationCache.averageDurationSeconds > 0
            ? durationCache.averageDurationSeconds
            : (this.wayuuAudioDataset.length > 0 ? mainDatasetDuration / this.wayuuAudioDataset.length : 0);
        const transcriptionLengths = this.wayuuAudioDataset.map(entry => entry.transcription.length);
        const averageTranscriptionLength = transcriptionLengths.length > 0
            ? transcriptionLengths.reduce((sum, len) => sum + len, 0) / transcriptionLengths.length
            : 0;
        const uniqueWords = new Set(this.wayuuAudioDataset.flatMap(entry => entry.transcription.toLowerCase().split(' '))).size;
        const downloadedEntries = this.wayuuAudioDataset.filter(entry => entry.isDownloaded).length;
        return {
            totalAudioEntries: totalCombinedEntries,
            totalDurationSeconds: Math.round(totalCombinedDurationSeconds * 100) / 100,
            totalDurationMinutes: Math.round((totalCombinedDurationSeconds / 60) * 100) / 100,
            averageDurationSeconds: Math.round(averageCombinedDuration * 100) / 100,
            mainDataset: {
                totalAudioEntries: this.wayuuAudioDataset.length,
                totalDurationSeconds: Math.round(mainDatasetDuration * 100) / 100,
                totalDurationMinutes: Math.round((mainDatasetDuration / 60) * 100) / 100,
                averageDurationSeconds: Math.round(mainDatasetAverage * 100) / 100,
                averageTranscriptionLength: Math.round(averageTranscriptionLength),
                uniqueWayuuWords: uniqueWords,
                downloadedEntries,
                calculatedDurations: durationCache.totalCalculated,
                pendingDurationCalculation: this.wayuuAudioDataset.length - durationCache.totalCalculated,
                source: this.getAudioSource()
            },
            activeSources: activeAudioSources.map(source => ({
                id: source.id,
                name: source.name,
                entries: source.totalEntries || 0,
                durationSeconds: source.totalDurationSeconds || 0,
                durationFormatted: source.totalDurationFormatted || '0:00'
            })),
            totalEntriesExpected: totalCombinedEntries,
            uniqueWayuuWords: uniqueWords,
            averageTranscriptionLength: Math.round(averageTranscriptionLength),
            durationCacheInfo: {
                lastUpdated: durationCache.lastUpdated,
                totalCalculated: durationCache.totalCalculated,
                cacheHit: durationCache.totalDurationSeconds > 0
            },
            source: this.getAudioSource(),
            loadingMethods: {
                huggingFaceAPI: 'Available with pagination',
                localCache: this.isAudioLoaded ? 'Active' : 'Not available',
                streaming: 'Supported',
                durationCalculation: 'AudioDurationService integrated',
                combinedSources: `${activeAudioSources.length} active audio sources`
            }
        };
    }
    async getAudioEntries(page = 1, limit = 20) {
        if (!this.isAudioLoaded) {
            await this.loadWayuuAudioDataset();
        }
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const entries = this.wayuuAudioDataset.slice(startIndex, endIndex);
        return {
            entries: entries.map(entry => ({
                id: entry.id,
                transcription: entry.transcription,
                audioDuration: entry.audioDuration,
                fileName: entry.fileName,
                isDownloaded: entry.isDownloaded || false,
                audioUrl: entry.audioUrl,
                source: entry.source
            })),
            pagination: {
                page,
                limit,
                total: this.wayuuAudioDataset.length,
                totalPages: Math.ceil(this.wayuuAudioDataset.length / limit),
                hasNext: endIndex < this.wayuuAudioDataset.length,
                hasPrev: page > 1
            }
        };
    }
    async searchAudioByTranscription(query, limit = 10) {
        if (!this.isAudioLoaded) {
            await this.loadWayuuAudioDataset();
        }
        const normalizedQuery = this.normalizeText(query);
        const results = [];
        for (const entry of this.wayuuAudioDataset) {
            const normalizedTranscription = this.normalizeText(entry.transcription);
            if (normalizedTranscription.includes(normalizedQuery)) {
                results.push({
                    ...entry,
                    matchType: 'exact',
                    confidence: 1.0
                });
                continue;
            }
            const similarity = this.calculateSimilarity(normalizedQuery, normalizedTranscription);
            if (similarity > 0.6) {
                results.push({
                    ...entry,
                    matchType: 'fuzzy',
                    confidence: similarity
                });
            }
            if (results.length >= limit)
                break;
        }
        results.sort((a, b) => b.confidence - a.confidence);
        return {
            query,
            results: results.slice(0, limit),
            totalMatches: results.length,
            searchTime: Date.now()
        };
    }
    async reloadAudioDataset(clearCache = false) {
        try {
            if (clearCache) {
                await this.clearAudioCache();
                this.logger.log('🗑️ Audio cache cleared before reload');
            }
            this.wayuuAudioDataset = [];
            this.isAudioLoaded = false;
            this.totalAudioEntries = 0;
            this.audioLoadingPromise = null;
            await this.loadWayuuAudioDataset();
            return {
                success: true,
                message: `Audio dataset reloaded successfully. Loaded ${this.wayuuAudioDataset.length} audio entries.`,
                totalAudioEntries: this.wayuuAudioDataset.length
            };
        }
        catch (error) {
            this.logger.error(`Failed to reload audio dataset: ${error.message}`);
            return {
                success: false,
                message: `Failed to reload audio dataset: ${error.message}`
            };
        }
    }
    async getAudioCacheInfo() {
        try {
            const cacheExists = await this.fileExists(this.audioCacheFile);
            const metadataExists = await this.fileExists(this.audioMetadataFile);
            if (!cacheExists) {
                return { exists: false };
            }
            let metadata;
            if (metadataExists) {
                const metadataContent = await fs.readFile(this.audioMetadataFile, 'utf-8');
                metadata = JSON.parse(metadataContent);
            }
            const stats = await fs.stat(this.audioCacheFile);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            return {
                exists: true,
                metadata,
                size: `${sizeInMB} MB`
            };
        }
        catch (error) {
            this.logger.error(`Error getting audio cache info: ${error.message}`);
            return { exists: false };
        }
    }
    async clearAudioCache() {
        try {
            const filesToDelete = [this.audioCacheFile, this.audioMetadataFile];
            for (const file of filesToDelete) {
                if (await this.fileExists(file)) {
                    await fs.unlink(file);
                    this.logger.log(`🗑️ Deleted audio cache file: ${file}`);
                }
            }
            this.wayuuAudioDataset = [];
            this.isAudioLoaded = false;
            this.totalAudioEntries = 0;
            this.audioLoadingPromise = null;
        }
        catch (error) {
            this.logger.error(`Error clearing audio cache: ${error.message}`);
            throw error;
        }
    }
    calculateTotalExpectedEntries() {
        const activeSources = this.getActiveHuggingFaceSources();
        const expectedCounts = {
            'wayuu_spa_dict': 2183,
            'wayuu_spa_large': 46827,
            'wayuu_parallel_corpus': 42687
        };
        return activeSources
            .filter(source => source.type === 'dictionary')
            .reduce((total, source) => total + (expectedCounts[source.id] || 0), 0);
    }
    getLoadedDatasetInfo() {
        const info = [];
        info.push({
            source: 'Gaxys/wayuu_spa_dict',
            url: 'https://huggingface.co/datasets/Gaxys/wayuu_spa_dict',
            description: 'Wayuu-Spanish dictionary dataset from Hugging Face',
            status: this.isLoaded ? 'loaded' : 'loading',
            type: 'text',
            entries: this.wayuuDictionary.length
        });
        this.additionalDatasets.forEach((entries, sourceId) => {
            const source = this.huggingFaceSources.find(s => s.id === sourceId);
            if (source) {
                info.push({
                    source: source.dataset,
                    url: source.url,
                    description: source.description,
                    status: 'loaded',
                    type: source.type,
                    entries: entries.length
                });
            }
        });
        info.push({
            source: 'orkidea/wayuu_CO_test',
            url: 'https://huggingface.co/datasets/orkidea/wayuu_CO_test',
            description: 'Wayuu audio dataset with transcriptions from Hugging Face',
            status: this.isAudioLoaded ? 'loaded' : 'loading',
            type: 'audio',
            entries: this.wayuuAudioDataset.length
        });
        return info;
    }
    async getHuggingFaceSources() {
        const sources = [...this.huggingFaceSources.sort((a, b) => a.priority - b.priority)];
        for (const source of sources) {
            if (source.type === 'audio') {
                try {
                    const totalDuration = await this.calculateAudioDatasetDuration(source.id);
                    source.totalDurationSeconds = totalDuration.seconds;
                    source.totalDurationFormatted = totalDuration.formatted;
                    source.totalEntries = totalDuration.entries;
                }
                catch (error) {
                    this.logger.warn(`⚠️ Could not calculate duration for ${source.name}: ${error.message}`);
                    source.totalDurationSeconds = 0;
                    source.totalDurationFormatted = '0:00';
                    source.totalEntries = 0;
                }
            }
            else if (source.type === 'dictionary') {
                try {
                    const dictionaryInfo = await this.calculateDictionaryEntries(source.id);
                    source.totalEntries = dictionaryInfo.entries;
                    source.entriesFormatted = dictionaryInfo.formatted;
                    source.description = source.description.replace(/with over \d+,?\d* entries/, `with ${dictionaryInfo.formatted} entries`).replace(/with \d+,?\d* translation pairs/, `with ${dictionaryInfo.formatted} translation pairs`).replace(/with \d+,?\d* Wayuu-Spanish sentence pairs/, `with ${dictionaryInfo.formatted} Wayuu-Spanish sentence pairs`);
                }
                catch (error) {
                    this.logger.warn(`⚠️ Could not calculate entries for ${source.name}: ${error.message}`);
                    source.totalEntries = 0;
                    source.entriesFormatted = '0';
                }
            }
        }
        return sources;
    }
    async calculateAudioDatasetDuration(sourceId) {
        if (!this.isAudioLoaded) {
            await this.loadWayuuAudioDataset();
        }
        let totalDurationSeconds = 0;
        let entriesCount = 0;
        if (sourceId === 'wayuu_audio') {
            totalDurationSeconds = this.wayuuAudioDataset.reduce((sum, entry) => sum + (entry.audioDuration || 0), 0);
            entriesCount = this.wayuuAudioDataset.length;
        }
        else if (sourceId === 'palabrero_guc_draft') {
            const durationCache = this.audioDurationService.getDurationCache();
            const palabreroEntries = Object.values(durationCache.durations).filter(entry => entry.id && entry.id.includes('palabrero'));
            totalDurationSeconds = palabreroEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
            entriesCount = palabreroEntries.length;
            if (entriesCount === 0) {
                entriesCount = 17;
                totalDurationSeconds = entriesCount * 8.5;
            }
        }
        const minutes = Math.floor(totalDurationSeconds / 60);
        const seconds = Math.floor(totalDurationSeconds % 60);
        const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        return {
            seconds: totalDurationSeconds,
            formatted,
            entries: entriesCount
        };
    }
    async calculateDictionaryEntries(sourceId) {
        let entriesCount = 0;
        if (sourceId === 'wayuu_spa_dict') {
            if (!this.isLoaded) {
                await this.loadWayuuDictionary();
            }
            entriesCount = this.wayuuDictionary.length;
        }
        else if (sourceId === 'wayuu_spa_large') {
            const additionalDataset = this.additionalDatasets.get(sourceId);
            if (additionalDataset) {
                entriesCount = additionalDataset.length;
            }
            else {
                entriesCount = 46827;
            }
        }
        else if (sourceId === 'wayuu_parallel_corpus') {
            const additionalDataset = this.additionalDatasets.get(sourceId);
            if (additionalDataset) {
                entriesCount = additionalDataset.length;
            }
            else {
                entriesCount = 42687;
            }
        }
        const formatted = entriesCount.toLocaleString();
        return {
            entries: entriesCount,
            formatted
        };
    }
    getActiveHuggingFaceSources() {
        return this.huggingFaceSources.filter(source => source.isActive).sort((a, b) => a.priority - b.priority);
    }
    getDictionarySource() {
        return this.huggingFaceSources.find(source => source.type === 'dictionary' && source.isActive) || this.huggingFaceSources[0];
    }
    getAudioSource() {
        return this.huggingFaceSources.find(source => source.type === 'audio' && source.isActive) || this.huggingFaceSources[1];
    }
    addHuggingFaceSource(source) {
        const newSource = {
            ...source,
            priority: this.huggingFaceSources.length + 1
        };
        this.huggingFaceSources.push(newSource);
        this.logger.log(`➕ Added new Hugging Face source: ${newSource.name}`);
    }
    updateHuggingFaceSource(id, updates) {
        const index = this.huggingFaceSources.findIndex(source => source.id === id);
        if (index !== -1) {
            this.huggingFaceSources[index] = { ...this.huggingFaceSources[index], ...updates };
            this.logger.log(`✏️ Updated Hugging Face source: ${id}`);
            return true;
        }
        return false;
    }
    removeHuggingFaceSource(id) {
        const index = this.huggingFaceSources.findIndex(source => source.id === id);
        if (index !== -1) {
            const removed = this.huggingFaceSources.splice(index, 1)[0];
            this.logger.log(`🗑️ Removed Hugging Face source: ${removed.name}`);
            return true;
        }
        return false;
    }
    toggleHuggingFaceSource(id) {
        const source = this.huggingFaceSources.find(s => s.id === id);
        if (!source) {
            return { success: false };
        }
        source.isActive = !source.isActive;
        return {
            success: true,
            isActive: source.isActive,
            source
        };
    }
    async loadAdditionalDataset(id, loadFull = false) {
        const source = this.huggingFaceSources.find(s => s.id === id);
        if (!source) {
            return {
                success: false,
                message: `Source with id '${id}' not found`
            };
        }
        if (!source.isActive) {
            return {
                success: false,
                message: `Source '${source.name}' is not active. Please activate it first.`
            };
        }
        try {
            if (id === 'wayuu_parallel_corpus' || id === 'wayuu_spa_large') {
                this.logger.log(`🔄 Loading additional dataset: ${source.name}...`);
                if (loadFull) {
                    if (!this.additionalDatasets.has(id)) {
                        this.logger.log(`📥 Loading full dataset: ${source.name}`);
                        const fullData = await this.loadViaRowsAPI(source.dataset, source.config, source.split);
                        let processedData = [];
                        if (id === 'wayuu_spa_large') {
                            processedData = fullData.map(entry => ({
                                guc: entry.translation?.guc || entry.guc,
                                spa: entry.translation?.spa || entry.spa
                            })).filter(entry => entry.guc && entry.spa);
                        }
                        else {
                            processedData = fullData;
                        }
                        this.additionalDatasets.set(id, processedData);
                        this.loadedDatasetSources.add(id);
                        this.logger.log(`✅ Full dataset loaded: ${source.name} (${processedData.length} entries)`);
                        return {
                            success: true,
                            message: `Successfully loaded full ${source.name} (${processedData.length} entries)`,
                            data: {
                                source,
                                totalEntries: processedData.length,
                                loadedEntries: processedData.length,
                                preview: processedData.slice(0, 10)
                            }
                        };
                    }
                    else {
                        const existingData = this.additionalDatasets.get(id);
                        return {
                            success: true,
                            message: `${source.name} already loaded (${existingData.length} entries)`,
                            data: {
                                source,
                                totalEntries: existingData.length,
                                loadedEntries: existingData.length,
                                preview: existingData.slice(0, 10)
                            }
                        };
                    }
                }
                else {
                    const url = `https://datasets-server.huggingface.co/rows?dataset=${source.dataset}&config=${source.config}&split=${source.split}&offset=0&length=100`;
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    this.logger.log(`📊 Preview loaded: ${data.rows.length} entries from ${source.name}`);
                    let processedPreview;
                    if (id === 'wayuu_spa_large') {
                        processedPreview = data.rows.slice(0, 10).map(row => ({
                            row_idx: row.row_idx,
                            row: {
                                guc: row.row.translation.guc,
                                es: row.row.translation.spa
                            }
                        }));
                    }
                    else {
                        processedPreview = data.rows.slice(0, 10);
                    }
                    return {
                        success: true,
                        message: `Successfully loaded preview of ${source.name} (${data.rows.length} entries shown, ${data.num_rows_total} total available)`,
                        data: {
                            source,
                            preview: processedPreview,
                            totalEntries: data.num_rows_total,
                            loadedEntries: data.rows.length,
                            originalFormat: id === 'wayuu_spa_large' ? 'nested_translation' : 'standard'
                        }
                    };
                }
            }
            return {
                success: false,
                message: `Loading method not implemented for source type: ${source.type}`
            };
        }
        catch (error) {
            this.logger.error(`❌ Error loading additional dataset ${source.name}:`, error);
            return {
                success: false,
                message: `Failed to load ${source.name}: ${error.message}`
            };
        }
    }
    async refreshAudioUrls() {
        try {
            this.logger.log('🔄 Refreshing audio URLs...');
            const audioSource = this.getAudioSource();
            const dataset = audioSource.dataset;
            const config = audioSource.config;
            const split = audioSource.split;
            const freshAudioData = await this.loadAudioViaRowsAPI(dataset, config, split);
            if (freshAudioData.length > 0) {
                this.wayuuAudioDataset.forEach(existingEntry => {
                    const freshEntry = freshAudioData.find(fresh => fresh.id === existingEntry.id);
                    if (freshEntry && freshEntry.audioUrl) {
                        existingEntry.audioUrl = freshEntry.audioUrl;
                    }
                });
                await this.saveAudioToCache(this.wayuuAudioDataset, dataset);
                this.logger.log('✅ Audio URLs refreshed successfully');
            }
        }
        catch (error) {
            this.logger.error(`❌ Failed to refresh audio URLs: ${error.message}`);
        }
    }
    async downloadAudioFile(audioId, retryWithRefresh = true) {
        try {
            const audioEntry = this.wayuuAudioDataset.find(entry => entry.id === audioId);
            if (!audioEntry) {
                return { success: false, message: `Audio entry with ID '${audioId}' not found` };
            }
            if (audioEntry.isDownloaded && audioEntry.localPath) {
                const exists = await this.fileExists(audioEntry.localPath);
                if (exists) {
                    return {
                        success: true,
                        message: `Audio file already downloaded`,
                        localPath: audioEntry.localPath
                    };
                }
            }
            if (!audioEntry.audioUrl) {
                return { success: false, message: `No audio URL available for '${audioId}'` };
            }
            await this.ensureAudioDirectory();
            const localPath = path.join(this.audioDownloadDir, audioEntry.fileName || `${audioId}.wav`);
            this.logger.log(`🎵 Downloading audio file: ${audioId}`);
            try {
                const response = await axios_1.default.get(audioEntry.audioUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; WayuuTranslator/1.0)'
                    }
                });
                await fs.writeFile(localPath, response.data);
                audioEntry.isDownloaded = true;
                audioEntry.localPath = localPath;
                audioEntry.fileSize = response.data.length;
                await this.saveAudioToCache(this.wayuuAudioDataset, 'orkidea/wayuu_CO_test');
                this.logger.log(`✅ Audio file downloaded: ${audioId} (${(response.data.length / 1024).toFixed(1)} KB)`);
                return {
                    success: true,
                    message: `Audio file downloaded successfully`,
                    localPath
                };
            }
            catch (downloadError) {
                if (downloadError.response?.status === 403 && retryWithRefresh) {
                    this.logger.log(`🔄 URL expired for ${audioId}, refreshing URLs and retrying...`);
                    await this.refreshAudioUrls();
                    return this.downloadAudioFile(audioId, false);
                }
                throw downloadError;
            }
        }
        catch (error) {
            this.logger.error(`❌ Failed to download audio file ${audioId}: ${error.message}`);
            return {
                success: false,
                message: `Failed to download audio file: ${error.message}`
            };
        }
    }
    async downloadAudioBatch(audioIds, batchSize = 5) {
        const results = [];
        let successCount = 0;
        this.logger.log(`🎵 Starting batch download of ${audioIds.length} audio files (batch size: ${batchSize})`);
        for (let i = 0; i < audioIds.length; i += batchSize) {
            const batch = audioIds.slice(i, i + batchSize);
            const batchPromises = batch.map(async (audioId) => {
                const result = await this.downloadAudioFile(audioId);
                return {
                    id: audioId,
                    success: result.success,
                    localPath: result.localPath,
                    error: result.success ? undefined : result.message
                };
            });
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            successCount += batchResults.filter(r => r.success).length;
            this.logger.log(`📦 Batch ${Math.floor(i / batchSize) + 1}: ${batchResults.filter(r => r.success).length}/${batchResults.length} successful`);
            if (i + batchSize < audioIds.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return {
            success: successCount > 0,
            message: `Downloaded ${successCount}/${audioIds.length} audio files successfully`,
            results
        };
    }
    async downloadAllAudio(batchSize = 5) {
        try {
            if (!this.isAudioLoaded) {
                await this.loadWayuuAudioDataset();
            }
            const audioIds = this.wayuuAudioDataset.map(entry => entry.id);
            const notDownloaded = this.wayuuAudioDataset.filter(entry => !entry.isDownloaded);
            if (notDownloaded.length === 0) {
                return {
                    success: true,
                    message: 'All audio files are already downloaded',
                    stats: {
                        total: audioIds.length,
                        downloaded: audioIds.length,
                        skipped: 0,
                        failed: 0
                    }
                };
            }
            this.logger.log(`🎵 Starting download of ${notDownloaded.length} audio files...`);
            const result = await this.downloadAudioBatch(notDownloaded.map(entry => entry.id), batchSize);
            const stats = {
                total: audioIds.length,
                downloaded: result.results.filter(r => r.success).length,
                skipped: audioIds.length - notDownloaded.length,
                failed: result.results.filter(r => !r.success).length
            };
            return {
                success: result.success,
                message: result.message,
                stats
            };
        }
        catch (error) {
            this.logger.error(`❌ Failed to download all audio files: ${error.message}`);
            return {
                success: false,
                message: `Failed to download audio files: ${error.message}`,
                stats: { total: 0, downloaded: 0, skipped: 0, failed: 0 }
            };
        }
    }
    async getAudioDownloadStats() {
        if (!this.isAudioLoaded) {
            await this.loadWayuuAudioDataset();
        }
        const totalFiles = this.wayuuAudioDataset.length;
        const downloadedEntries = this.wayuuAudioDataset.filter(entry => entry.isDownloaded);
        const downloadedFiles = downloadedEntries.length;
        const pendingFiles = totalFiles - downloadedFiles;
        const totalSizeDownloaded = downloadedEntries.reduce((sum, entry) => sum + (entry.fileSize || 0), 0);
        const downloadProgress = totalFiles > 0 ? (downloadedFiles / totalFiles) * 100 : 0;
        return {
            totalFiles,
            downloadedFiles,
            pendingFiles,
            totalSizeDownloaded,
            downloadProgress
        };
    }
    async clearDownloadedAudio() {
        try {
            let deletedFiles = 0;
            if (await this.fileExists(this.audioDownloadDir)) {
                const files = await fs.readdir(this.audioDownloadDir);
                for (const file of files) {
                    const filePath = path.join(this.audioDownloadDir, file);
                    await fs.unlink(filePath);
                    deletedFiles++;
                }
            }
            this.wayuuAudioDataset.forEach(entry => {
                entry.isDownloaded = false;
                entry.localPath = undefined;
                entry.fileSize = undefined;
            });
            await this.saveAudioToCache(this.wayuuAudioDataset, 'orkidea/wayuu_CO_test');
            this.logger.log(`🗑️ Cleared ${deletedFiles} downloaded audio files`);
            return {
                success: true,
                message: `Successfully deleted ${deletedFiles} audio files`,
                deletedFiles
            };
        }
        catch (error) {
            this.logger.error(`❌ Failed to clear downloaded audio: ${error.message}`);
            return {
                success: false,
                message: `Failed to clear audio files: ${error.message}`,
                deletedFiles: 0
            };
        }
    }
    async ensureAudioDirectory() {
        try {
            await fs.access(this.audioDownloadDir);
        }
        catch {
            await fs.mkdir(this.audioDownloadDir, { recursive: true });
            this.logger.log(`📁 Created audio download directory: ${this.audioDownloadDir}`);
        }
    }
    estimateAudioDuration(transcription) {
        const baseWordsPerSecond = 2.5;
        const words = transcription.trim().split(/\s+/).length;
        const baseDuration = words / baseWordsPerSecond;
        const variation = (Math.random() - 0.5) * 0.4;
        const finalDuration = baseDuration * (1 + variation);
        return Math.max(0.5, Math.min(15.0, finalDuration));
    }
    generateRealisticAudioDurations(entries) {
        return entries.map(entry => ({
            ...entry,
            audioDuration: entry.audioDuration > 0 ? entry.audioDuration : this.estimateAudioDuration(entry.transcription)
        }));
    }
    async updateDatasetMetrics() {
        try {
            const dictionarySources = this.huggingFaceSources.filter(s => s.type === 'dictionary');
            const audioSources = this.huggingFaceSources.filter(s => s.type === 'audio');
            this.metricsService.updateHuggingfaceSourcesTotal('dictionary', dictionarySources.length);
            this.metricsService.updateHuggingfaceSourcesTotal('audio', audioSources.length);
            this.metricsService.updateHuggingfaceSourcesActive('dictionary', dictionarySources.filter(s => s.isActive).length);
            this.metricsService.updateHuggingfaceSourcesActive('audio', audioSources.filter(s => s.isActive).length);
            for (const source of this.huggingFaceSources) {
                this.metricsService.updateDatasetLoadStatus(source.dataset, source.type, source.isActive, source.isActive);
            }
            if (this.isLoaded) {
                await this.updateDictionaryMetrics();
            }
            if (this.isAudioLoaded) {
                await this.updateAudioMetrics();
            }
            await this.updateCacheMetrics();
            this.logger.log('📊 Dataset metrics updated successfully');
        }
        catch (error) {
            this.logger.error('❌ Error updating dataset metrics:', error.message);
        }
    }
    async updateDictionaryMetrics() {
        const stats = await this.getDictionaryStats();
        this.metricsService.updateDatasetTotalEntries('main_dictionary', 'dictionary', stats.totalEntries || 0);
        this.metricsService.updateDatasetUniqueWords('main_dictionary', 'wayuu', 'dictionary', stats.uniqueWayuuWords || 0);
        this.metricsService.updateDatasetUniqueWords('main_dictionary', 'spanish', 'dictionary', stats.uniqueSpanishWords || 0);
        this.metricsService.updateDatasetAverageWordsPerEntry('main_dictionary', 'spanish', 'dictionary', stats.averageSpanishWordsPerEntry || 0);
    }
    async updateAudioMetrics() {
        const stats = await this.getAudioStats();
        this.metricsService.updateDatasetTotalEntries('audio_dataset', 'audio', stats.totalAudioEntries || 0);
        this.metricsService.updateAudioDatasetTotalDuration('audio_dataset', stats.totalDurationSeconds || 0);
        this.metricsService.updateAudioDatasetAverageDuration('audio_dataset', stats.averageDurationSeconds || 0);
        this.metricsService.updateDatasetUniqueWords('audio_dataset', 'wayuu', 'audio', stats.uniqueWayuuWords || 0);
        const downloadStats = await this.getAudioDownloadStats();
        this.metricsService.updateAudioFilesDownloaded('audio_dataset', downloadStats.downloadedFiles || 0);
        this.metricsService.updateAudioDownloadProgress('audio_dataset', downloadStats.downloadProgress || 0);
    }
    async updateCacheMetrics() {
        const cacheInfo = await this.getCacheInfo();
        if (cacheInfo.exists) {
            this.metricsService.updateDatasetCacheStatus('main_dictionary', 'dictionary', true);
            this.metricsService.updateDatasetCacheSize('main_dictionary', 'dictionary', this.parseCacheSize(cacheInfo.size || '0'));
            if (cacheInfo.metadata?.lastUpdated) {
                this.metricsService.updateDatasetLastUpdateTime('main_dictionary', 'dictionary', new Date(cacheInfo.metadata.lastUpdated).getTime() / 1000);
            }
        }
        else {
            this.metricsService.updateDatasetCacheStatus('main_dictionary', 'dictionary', false);
            this.metricsService.updateDatasetCacheSize('main_dictionary', 'dictionary', 0);
        }
        const audioCacheInfo = await this.getAudioCacheInfo();
        if (audioCacheInfo.exists) {
            this.metricsService.updateDatasetCacheStatus('audio_dataset', 'audio', true);
            this.metricsService.updateDatasetCacheSize('audio_dataset', 'audio', this.parseCacheSize(audioCacheInfo.size || '0'));
            if (audioCacheInfo.metadata?.lastUpdated) {
                this.metricsService.updateDatasetLastUpdateTime('audio_dataset', 'audio', new Date(audioCacheInfo.metadata.lastUpdated).getTime() / 1000);
            }
        }
        else {
            this.metricsService.updateDatasetCacheStatus('audio_dataset', 'audio', false);
            this.metricsService.updateDatasetCacheSize('audio_dataset', 'audio', 0);
        }
    }
    parseCacheSize(sizeString) {
        const match = sizeString.match(/(\d+\.?\d*)\s*(KB|MB|GB)/i);
        if (!match)
            return 0;
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        switch (unit) {
            case 'KB': return value * 1024;
            case 'MB': return value * 1024 * 1024;
            case 'GB': return value * 1024 * 1024 * 1024;
            default: return value;
        }
    }
};
exports.DatasetsService = DatasetsService;
exports.DatasetsService = DatasetsService = DatasetsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        audio_duration_service_1.AudioDurationService,
        metrics_service_1.MetricsService])
], DatasetsService);
//# sourceMappingURL=datasets.service.js.map
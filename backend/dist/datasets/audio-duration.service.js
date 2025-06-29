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
var AudioDurationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioDurationService = void 0;
const common_1 = require("@nestjs/common");
const get_audio_duration_1 = require("get-audio-duration");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let AudioDurationService = AudioDurationService_1 = class AudioDurationService {
    constructor() {
        this.logger = new common_1.Logger(AudioDurationService_1.name);
        this.audioDirectory = path.join(__dirname, '..', '..', 'data', 'audio');
        this.cacheFile = path.join(__dirname, '..', '..', 'data', 'audio-duration-cache.json');
        this.durationCache = {
            lastUpdated: '',
            durations: {},
            totalCalculated: 0,
            totalDurationSeconds: 0,
            averageDurationSeconds: 0
        };
    }
    async onModuleInit() {
        await this.loadDurationCache();
    }
    async calculateAudioDuration(filePath) {
        try {
            this.logger.debug(`🎵 Calculating duration for: ${filePath}`);
            await fs.access(filePath);
            const duration = await (0, get_audio_duration_1.getAudioDurationInSeconds)(filePath);
            this.logger.debug(`✅ Duration calculated: ${duration}s for ${path.basename(filePath)}`);
            return Math.round(duration * 100) / 100;
        }
        catch (error) {
            this.logger.error(`❌ Failed to calculate duration for ${filePath}: ${error.message}`);
            throw error;
        }
    }
    async calculateMultipleAudioDurations(filePaths) {
        const results = [];
        const batchSize = 5;
        this.logger.log(`🎵 Calculating durations for ${filePaths.length} audio files...`);
        for (let i = 0; i < filePaths.length; i += batchSize) {
            const batch = filePaths.slice(i, i + batchSize);
            const batchPromises = batch.map(async (filePath) => {
                const id = path.basename(filePath, path.extname(filePath));
                try {
                    const duration = await this.calculateAudioDuration(filePath);
                    return {
                        id,
                        duration,
                        filePath,
                        calculated: true
                    };
                }
                catch (error) {
                    return {
                        id,
                        duration: 0,
                        filePath,
                        calculated: false,
                        error: error.message
                    };
                }
            });
            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    this.logger.error(`❌ Batch calculation failed: ${result.reason}`);
                }
            });
            const completed = Math.min(i + batchSize, filePaths.length);
            this.logger.log(`📊 Progress: ${completed}/${filePaths.length} files processed`);
        }
        return results;
    }
    async updateAudioDurationCache(audioEntries) {
        try {
            this.logger.log(`🔄 Updating audio duration cache for ${audioEntries.length} entries...`);
            const updatedDurations = {};
            let totalDuration = 0;
            let calculatedCount = 0;
            for (const entry of audioEntries) {
                const audioId = entry.id || `audio_${entry.index}`;
                if (this.durationCache.durations[audioId] && this.durationCache.durations[audioId].calculated) {
                    updatedDurations[audioId] = this.durationCache.durations[audioId];
                    totalDuration += this.durationCache.durations[audioId].duration;
                    calculatedCount++;
                    continue;
                }
                if (entry.audioDuration && entry.audioDuration > 0) {
                    updatedDurations[audioId] = {
                        id: audioId,
                        duration: entry.audioDuration,
                        calculated: true
                    };
                    totalDuration += entry.audioDuration;
                    calculatedCount++;
                    continue;
                }
                if (entry.isDownloaded && entry.fileName) {
                    const filePath = path.join(this.audioDirectory, entry.fileName);
                    try {
                        const duration = await this.calculateAudioDuration(filePath);
                        updatedDurations[audioId] = {
                            id: audioId,
                            duration,
                            filePath,
                            calculated: true
                        };
                        totalDuration += duration;
                        calculatedCount++;
                        entry.audioDuration = duration;
                    }
                    catch (error) {
                        this.logger.warn(`⚠️ Could not calculate duration for ${entry.fileName}: ${error.message}`);
                        updatedDurations[audioId] = {
                            id: audioId,
                            duration: 0,
                            calculated: false,
                            error: error.message
                        };
                    }
                }
                else {
                    updatedDurations[audioId] = {
                        id: audioId,
                        duration: 0,
                        calculated: false,
                        error: 'Audio file not downloaded'
                    };
                }
            }
            const averageDuration = calculatedCount > 0 ? totalDuration / calculatedCount : 0;
            this.durationCache = {
                lastUpdated: new Date().toISOString(),
                durations: updatedDurations,
                totalCalculated: calculatedCount,
                totalDurationSeconds: totalDuration,
                averageDurationSeconds: Math.round(averageDuration * 100) / 100
            };
            await this.saveDurationCache();
            this.logger.log(`✅ Audio duration cache updated: ${calculatedCount} calculated, ${totalDuration.toFixed(1)}s total duration`);
        }
        catch (error) {
            this.logger.error(`❌ Failed to update audio duration cache: ${error.message}`);
            throw error;
        }
    }
    async loadDurationCache() {
        try {
            const cacheExists = await fs.access(this.cacheFile).then(() => true).catch(() => false);
            if (cacheExists) {
                const cacheContent = await fs.readFile(this.cacheFile, 'utf-8');
                this.durationCache = JSON.parse(cacheContent);
                this.logger.log(`📚 Loaded audio duration cache: ${this.durationCache.totalCalculated} entries`);
            }
        }
        catch (error) {
            this.logger.warn(`⚠️ Could not load audio duration cache: ${error.message}`);
            this.durationCache = {
                lastUpdated: '',
                durations: {},
                totalCalculated: 0,
                totalDurationSeconds: 0,
                averageDurationSeconds: 0
            };
        }
    }
    async saveDurationCache() {
        try {
            await fs.writeFile(this.cacheFile, JSON.stringify(this.durationCache, null, 2), 'utf-8');
            this.logger.debug(`💾 Audio duration cache saved to ${this.cacheFile}`);
        }
        catch (error) {
            this.logger.error(`❌ Failed to save audio duration cache: ${error.message}`);
            throw error;
        }
    }
    getDurationCache() {
        return this.durationCache;
    }
    getDurationForAudio(audioId) {
        return this.durationCache.durations[audioId] || null;
    }
    async recalculateAllDurations() {
        try {
            this.logger.log(`🔄 Starting full recalculation of audio durations...`);
            const audioFiles = await fs.readdir(this.audioDirectory);
            const audioFilePaths = audioFiles
                .filter(file => /\.(mp3|wav|m4a|ogg|flac)$/i.test(file))
                .map(file => path.join(this.audioDirectory, file));
            if (audioFilePaths.length === 0) {
                this.logger.warn(`⚠️ No audio files found in ${this.audioDirectory}`);
                return { calculated: 0, failed: 0, totalDuration: 0 };
            }
            const results = await this.calculateMultipleAudioDurations(audioFilePaths);
            const updatedDurations = {};
            let totalDuration = 0;
            let calculatedCount = 0;
            let failedCount = 0;
            results.forEach(result => {
                updatedDurations[result.id] = result;
                if (result.calculated) {
                    totalDuration += result.duration;
                    calculatedCount++;
                }
                else {
                    failedCount++;
                }
            });
            const averageDuration = calculatedCount > 0 ? totalDuration / calculatedCount : 0;
            this.durationCache = {
                lastUpdated: new Date().toISOString(),
                durations: updatedDurations,
                totalCalculated: calculatedCount,
                totalDurationSeconds: totalDuration,
                averageDurationSeconds: Math.round(averageDuration * 100) / 100
            };
            await this.saveDurationCache();
            this.logger.log(`✅ Recalculation complete: ${calculatedCount} calculated, ${failedCount} failed, ${totalDuration.toFixed(1)}s total`);
            return {
                calculated: calculatedCount,
                failed: failedCount,
                totalDuration: Math.round(totalDuration * 100) / 100
            };
        }
        catch (error) {
            this.logger.error(`❌ Failed to recalculate audio durations: ${error.message}`);
            throw error;
        }
    }
    enrichAudioEntriesWithDurations(audioEntries) {
        return audioEntries.map(entry => {
            const audioId = entry.id || `audio_${entry.index}`;
            const durationInfo = this.getDurationForAudio(audioId);
            if (durationInfo && durationInfo.calculated) {
                return {
                    ...entry,
                    audioDuration: durationInfo.duration
                };
            }
            return entry;
        });
    }
};
exports.AudioDurationService = AudioDurationService;
exports.AudioDurationService = AudioDurationService = AudioDurationService_1 = __decorate([
    (0, common_1.Injectable)()
], AudioDurationService);
//# sourceMappingURL=audio-duration.service.js.map
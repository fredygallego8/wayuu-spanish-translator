import { Injectable, Logger } from '@nestjs/common';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AudioDurationInfo {
  id: string;
  duration: number; // in seconds
  filePath?: string;
  calculated: boolean;
  error?: string;
}

export interface AudioDurationCache {
  lastUpdated: string;
  durations: Record<string, AudioDurationInfo>;
  totalCalculated: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
}

@Injectable()
export class AudioDurationService {
  private readonly logger = new Logger(AudioDurationService.name);
  private readonly audioDirectory = path.join(__dirname, '..', '..', 'data', 'audio');
  private readonly cacheFile = path.join(__dirname, '..', '..', 'data', 'audio-duration-cache.json');
  private durationCache: AudioDurationCache = {
    lastUpdated: '',
    durations: {},
    totalCalculated: 0,
    totalDurationSeconds: 0,
    averageDurationSeconds: 0
  };

  async onModuleInit() {
    await this.loadDurationCache();
  }

  async calculateAudioDuration(filePath: string): Promise<number> {
    try {
      this.logger.debug(`🎵 Calculating duration for: ${filePath}`);
      
      // Verificar que el archivo existe
      await fs.access(filePath);
      
      // Obtener duración usando get-audio-duration
      const duration = await getAudioDurationInSeconds(filePath);
      
      this.logger.debug(`✅ Duration calculated: ${duration}s for ${path.basename(filePath)}`);
      return Math.round(duration * 100) / 100; // Round to 2 decimal places
      
    } catch (error) {
      this.logger.error(`❌ Failed to calculate duration for ${filePath}: ${error.message}`);
      throw error;
    }
  }

  async calculateMultipleAudioDurations(filePaths: string[]): Promise<AudioDurationInfo[]> {
    const results: AudioDurationInfo[] = [];
    const batchSize = 5; // Process in batches to avoid overwhelming the system

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
        } catch (error) {
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
        } else {
          this.logger.error(`❌ Batch calculation failed: ${result.reason}`);
        }
      });

      // Log progress
      const completed = Math.min(i + batchSize, filePaths.length);
      this.logger.log(`📊 Progress: ${completed}/${filePaths.length} files processed`);
    }

    return results;
  }

  async updateAudioDurationCache(audioEntries: any[]): Promise<void> {
    try {
      this.logger.log(`🔄 Updating audio duration cache for ${audioEntries.length} entries...`);

      const updatedDurations: Record<string, AudioDurationInfo> = {};
      let totalDuration = 0;
      let calculatedCount = 0;

      for (const entry of audioEntries) {
        const audioId = entry.id || `audio_${entry.index}`;
        
        // Check if we already have this duration cached
        if (this.durationCache.durations[audioId] && this.durationCache.durations[audioId].calculated) {
          updatedDurations[audioId] = this.durationCache.durations[audioId];
          totalDuration += this.durationCache.durations[audioId].duration;
          calculatedCount++;
          continue;
        }

        // If the entry already has a duration, use it
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

        // If it's a downloaded audio file, calculate duration
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
            
            // Update the original entry with calculated duration
            entry.audioDuration = duration;
          } catch (error) {
            this.logger.warn(`⚠️ Could not calculate duration for ${entry.fileName}: ${error.message}`);
            updatedDurations[audioId] = {
              id: audioId,
              duration: 0,
              calculated: false,
              error: error.message
            };
          }
        } else {
          // Entry not downloaded yet
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
      
    } catch (error) {
      this.logger.error(`❌ Failed to update audio duration cache: ${error.message}`);
      throw error;
    }
  }

  async loadDurationCache(): Promise<void> {
    try {
      const cacheExists = await fs.access(this.cacheFile).then(() => true).catch(() => false);
      
      if (cacheExists) {
        const cacheContent = await fs.readFile(this.cacheFile, 'utf-8');
        this.durationCache = JSON.parse(cacheContent);
        this.logger.log(`📚 Loaded audio duration cache: ${this.durationCache.totalCalculated} entries`);
      }
    } catch (error) {
      this.logger.warn(`⚠️ Could not load audio duration cache: ${error.message}`);
      // Initialize with empty cache
      this.durationCache = {
        lastUpdated: '',
        durations: {},
        totalCalculated: 0,
        totalDurationSeconds: 0,
        averageDurationSeconds: 0
      };
    }
  }

  async saveDurationCache(): Promise<void> {
    try {
      await fs.writeFile(this.cacheFile, JSON.stringify(this.durationCache, null, 2), 'utf-8');
      this.logger.debug(`💾 Audio duration cache saved to ${this.cacheFile}`);
    } catch (error) {
      this.logger.error(`❌ Failed to save audio duration cache: ${error.message}`);
      throw error;
    }
  }

  getDurationCache(): AudioDurationCache {
    return this.durationCache;
  }

  getDurationForAudio(audioId: string): AudioDurationInfo | null {
    return this.durationCache.durations[audioId] || null;
  }

  async recalculateAllDurations(): Promise<{ calculated: number; failed: number; totalDuration: number }> {
    try {
      this.logger.log(`🔄 Starting full recalculation of audio durations...`);

      // Get all audio files in the audio directory
      const audioFiles = await fs.readdir(this.audioDirectory);
      const audioFilePaths = audioFiles
        .filter(file => /\.(mp3|wav|m4a|ogg|flac)$/i.test(file))
        .map(file => path.join(this.audioDirectory, file));

      if (audioFilePaths.length === 0) {
        this.logger.warn(`⚠️ No audio files found in ${this.audioDirectory}`);
        return { calculated: 0, failed: 0, totalDuration: 0 };
      }

      const results = await this.calculateMultipleAudioDurations(audioFilePaths);
      
      // Update cache with new calculations
      const updatedDurations: Record<string, AudioDurationInfo> = {};
      let totalDuration = 0;
      let calculatedCount = 0;
      let failedCount = 0;

      results.forEach(result => {
        updatedDurations[result.id] = result;
        if (result.calculated) {
          totalDuration += result.duration;
          calculatedCount++;
        } else {
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

    } catch (error) {
      this.logger.error(`❌ Failed to recalculate audio durations: ${error.message}`);
      throw error;
    }
  }

  // Update audio entries with cached durations
  enrichAudioEntriesWithDurations(audioEntries: any[]): any[] {
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
} 
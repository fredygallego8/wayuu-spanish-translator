import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { TranslationDirection } from '../translation/dto/translate.dto';
import { AudioDurationService } from './audio-duration.service';
import { MetricsService } from '../metrics/metrics.service';
import { PdfProcessingService } from '../pdf-processing/pdf-processing.service';
import * as crypto from 'crypto';

export interface DictionaryEntry {
  guc: string; // Wayuu language
  spa: string; // Spanish language
}

export interface AudioEntry {
  id: string;
  transcription: string; // Wayuu text transcription
  audioDuration: number; // Duration in seconds
  audioUrl?: string; // URL to audio file (if available)
  audioData?: Buffer; // Audio binary data (if downloaded)
  fileName?: string; // Original filename
  localPath?: string; // Path to local audio file
  isDownloaded?: boolean; // Whether audio is cached locally
  fileSize?: number; // File size in bytes
  downloadPriority?: 'high' | 'medium' | 'low'; // Download priority
  batchNumber?: number; // Batch number for organization
  source: 'orkidea/wayuu_CO_test';
}

export interface TranslationResult {
  translatedText: string;
  confidence: number;
  sourceDataset: string;
  alternatives?: string[];
  contextInfo?: string;
}

export interface CacheMetadata {
  lastUpdated: string;
  totalEntries: number;
  datasetVersion: string;
  source: string;
  checksum?: string;
}

export interface AudioCacheMetadata {
  lastUpdated: string;
  totalAudioEntries: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  datasetVersion: string;
  source: string;
  checksum?: string;
}

// Configuración de fuentes de Hugging Face
export interface HuggingFaceSource {
  id: string;
  name: string;
  dataset: string;
  config: string;
  split: string;
  type: 'dictionary' | 'audio' | 'mixed';
  description: string;
  url: string;
  isActive: boolean;
  priority: number;
}

@Injectable()
export class DatasetsService implements OnModuleInit {
  private readonly logger = new Logger(DatasetsService.name);
  private wayuuDictionary: DictionaryEntry[] = [];
  private wayuuAudioDataset: AudioEntry[] = [];
  
  // Nuevas propiedades para datasets adicionales
  private additionalDatasets: Map<string, DictionaryEntry[]> = new Map();
  private loadedDatasetSources: Set<string> = new Set();
  
  private isLoaded = false;
  private isAudioLoaded = false;
  private totalEntries = 0;
  private totalAudioEntries = 0;
  private loadingPromise: Promise<void> | null = null;
  private audioLoadingPromise: Promise<void> | null = null;

  // Lista de fuentes de Hugging Face
  private readonly huggingFaceSources: HuggingFaceSource[] = [
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
      isActive: true, // Activado - con sistema de cache inteligente
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
      isActive: true, // Activado
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
    },
    {
      id: 'wayuu_linguistic_sources',
      name: 'Wayuu Linguistic Sources',
      dataset: 'nater2ed/wayuu_linguistic_sources',
      config: 'default',
      split: 'train',
      type: 'mixed',
      description: 'Comprehensive collection of Wayuu linguistic resources and documentation',
      url: 'https://huggingface.co/datasets/nater2ed/wayuu_linguistic_sources',
      isActive: true,
      priority: 6
    }
  ];
  
  // Cache configuration
  private readonly cacheDir = path.join(process.cwd(), 'data');
  private readonly cacheFile = path.join(this.cacheDir, 'wayuu-dictionary-cache.json');
  private readonly metadataFile = path.join(this.cacheDir, 'cache-metadata.json');
  private readonly audioCacheFile = path.join(this.cacheDir, 'wayuu-audio-cache.json');
  private readonly audioMetadataFile = path.join(this.cacheDir, 'audio-cache-metadata.json');
  private readonly audioDurationCacheFile = path.join(this.cacheDir, 'audio-duration-cache.json');
  private readonly cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(
    private readonly configService: ConfigService,
    private readonly audioDurationService: AudioDurationService,
    private readonly metricsService: MetricsService,
    @Inject(forwardRef(() => PdfProcessingService))
    private readonly pdfProcessingService: PdfProcessingService,
  ) {}

  async onModuleInit() {
    // 🚀 OPTIMIZACIÓN: Solo preparar directorios, NO cargar automáticamente
    await this.ensureCacheDirectory();
    
    // ✅ NO más carga automática - solo preparar el servicio
    this.logger.log('🔧 Datasets service ready for on-demand loading...');
    this.logger.log('📚 Dictionary and audio data will be loaded when requested by authorized users');
    this.logger.log('✨ Service ready - lazy loading enabled');

    // Actualizar métricas iniciales
    await this.updateDatasetMetrics();
  }

  async loadWayuuDictionary(): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this._performDatasetLoad();
    return this.loadingPromise;
  }

  async loadWayuuAudioDataset(): Promise<void> {
    if (this.audioLoadingPromise) {
      return this.audioLoadingPromise;
    }

    this.audioLoadingPromise = this._performAudioDatasetLoad();
    return this.audioLoadingPromise;
  }

  private async _performDatasetLoad(): Promise<void> {
    this.logger.log('🚀 Loading Wayuu-Spanish dictionary with intelligent cache...');
    
    const dictionarySource = this.getDictionarySource();
    const dataset = dictionarySource.dataset;
    const config = dictionarySource.config;
    const split = dictionarySource.split;

    try {
      // Paso 1: Verificar cache local
      const cacheResult = await this.loadFromCache();
      if (cacheResult.success) {
        this.wayuuDictionary = cacheResult.data;
        this.totalEntries = cacheResult.data.length;
        this.isLoaded = true;
        this.logger.log(`🎯 Loaded ${cacheResult.data.length} entries from local cache (${cacheResult.source})`);
        
        // Verificar actualizaciones en segundo plano si el cache no es muy reciente
        if (cacheResult.shouldUpdate) {
          this.logger.log('📡 Checking for dataset updates in background...');
          this.checkForUpdatesInBackground(dataset, config, split);
        }
        return;
      }

      // Paso 2: Cache no disponible o expirado - cargar desde Hugging Face
      this.logger.log('💾 Cache not available, loading from Hugging Face...');
      const entries = await this.loadViaRowsAPI(dataset, config, split);
      
      if (entries.length > 0) {
        this.wayuuDictionary = entries;
        this.totalEntries = entries.length;
        this.isLoaded = true;
        
        // Guardar en cache
        await this.saveToCache(entries, dataset);
        this.logger.log(`✅ Successfully loaded ${entries.length} entries and saved to cache`);
        return;
      }

      // Paso 3: API falló - intentar cargar cache expirado como fallback
      this.logger.warn('🔄 API failed, attempting to load expired cache...');
      const expiredCache = await this.loadFromCache(true); // Ignorar expiración
      if (expiredCache.success) {
        this.wayuuDictionary = expiredCache.data;
        this.totalEntries = expiredCache.data.length;
        this.isLoaded = true;
        this.logger.log(`⚠️  Loaded ${expiredCache.data.length} entries from expired cache`);
        return;
      }

      // Paso 4: Último recurso - datos de muestra
      this.logger.warn('📝 All methods failed, using sample data');
      await this.loadSampleData();
      
    } catch (error) {
      this.logger.error(`❌ Failed to load dataset: ${error.message}`);
      
      // Intentar cache como último recurso
      const emergencyCache = await this.loadFromCache(true);
      if (emergencyCache.success) {
        this.wayuuDictionary = emergencyCache.data;
        this.totalEntries = emergencyCache.data.length;
        this.isLoaded = true;
        this.logger.log(`🆘 Emergency fallback: loaded ${emergencyCache.data.length} entries from cache`);
      } else {
        await this.loadSampleData();
      }
    }

    // Actualizar métricas después de cargar datos
    await this.updateDatasetMetrics();
  }

  private async _performAudioDatasetLoad(): Promise<void> {
    this.logger.log('🎵 Loading Wayuu audio dataset with intelligent cache...');
    
    const audioSource = this.getAudioSource();
    const dataset = audioSource.dataset;
    const config = audioSource.config;
    const split = audioSource.split;

    try {
      // Paso 1: Verificar cache local de audio
      const cacheResult = await this.loadAudioFromCache();
      if (cacheResult.success) {
        this.wayuuAudioDataset = cacheResult.data;
        this.totalAudioEntries = cacheResult.data.length;
        this.isAudioLoaded = true;
        this.logger.log(`🎯 Loaded ${cacheResult.data.length} audio entries from local cache (${cacheResult.source})`);
        
        // Apply audio durations from duration cache
        await this.loadAndApplyAudioDurations();
        
        // Verificar actualizaciones en segundo plano si el cache no es muy reciente
        if (cacheResult.shouldUpdate) {
          this.logger.log('📡 Checking for audio dataset updates in background...');
          this.checkForAudioUpdatesInBackground(dataset, config, split);
        }
        return;
      }

      // Paso 2: Cache no disponible o expirado - cargar desde Hugging Face
      this.logger.log('💾 Audio cache not available, loading from Hugging Face...');
      const entries = await this.loadAudioViaRowsAPI(dataset, config, split);
      
      if (entries.length > 0) {
        this.wayuuAudioDataset = entries;
        this.totalAudioEntries = entries.length;
        this.isAudioLoaded = true;
        
        // Apply audio durations from duration cache
        await this.loadAndApplyAudioDurations();
        
        // Guardar en cache
        await this.saveAudioToCache(entries, dataset);
        this.logger.log(`✅ Successfully loaded ${entries.length} audio entries and saved to cache`);
        return;
      }

      // Paso 3: API falló - intentar cargar cache expirado como fallback
      this.logger.warn('🔄 Audio API failed, attempting to load expired cache...');
      const expiredCache = await this.loadAudioFromCache(true);
      if (expiredCache.success) {
        this.wayuuAudioDataset = expiredCache.data;
        this.totalAudioEntries = expiredCache.data.length;
        this.isAudioLoaded = true;
        
        // Actualizar duraciones incluso en cache expirado
        await this.audioDurationService.updateAudioDurationCache(this.wayuuAudioDataset);
        this.wayuuAudioDataset = this.audioDurationService.enrichAudioEntriesWithDurations(this.wayuuAudioDataset);
        
        this.logger.log(`⚠️  Loaded ${expiredCache.data.length} audio entries from expired cache`);
        
        // Apply audio durations from duration cache
        await this.loadAndApplyAudioDurations();
        return;
      }

      // Paso 4: Último recurso - datos de muestra de audio
      this.logger.warn('📝 All audio methods failed, using sample audio data');
      await this.loadSampleAudioData();
      
      // Apply audio durations from duration cache (if any)
      await this.loadAndApplyAudioDurations();
      
    } catch (error) {
      this.logger.error(`❌ Failed to load audio dataset: ${error.message}`);
      
      // Intentar cache como último recurso
      const emergencyCache = await this.loadAudioFromCache(true);
      if (emergencyCache.success) {
        this.wayuuAudioDataset = emergencyCache.data;
        this.totalAudioEntries = emergencyCache.data.length;
        this.isAudioLoaded = true;
        
        // Actualizar duraciones incluso en modo emergencia
        await this.audioDurationService.updateAudioDurationCache(this.wayuuAudioDataset);
        this.wayuuAudioDataset = this.audioDurationService.enrichAudioEntriesWithDurations(this.wayuuAudioDataset);
        
        this.logger.log(`🆘 Emergency fallback: loaded ${emergencyCache.data.length} audio entries from cache`);
        
        // Apply audio durations from duration cache
        await this.loadAndApplyAudioDurations();
      } else {
        await this.loadSampleAudioData();
        
        // Apply audio durations from duration cache (if any)
        await this.loadAndApplyAudioDurations();
      }
    }

    // Actualizar métricas después de cargar datos de audio
    await this.updateDatasetMetrics();
  }

  private async loadViaRowsAPI(dataset: string, config: string, split: string): Promise<DictionaryEntry[]> {
    const entries: DictionaryEntry[] = [];
    const batchSize = 100; // Máximo permitido por la API
    let offset = 0;
    let hasMoreData = true;
    let totalRows = 0;
    const maxEntries = 2200; // Límite de seguridad

    this.logger.log(`📥 Starting dataset load via rows API...`);

    while (hasMoreData && entries.length < maxEntries) {
      try {
        const url = `https://datasets-server.huggingface.co/rows?dataset=${dataset}&config=${config}&split=${split}&offset=${offset}&length=${batchSize}`;
        
        this.logger.log(`📥 Fetching batch ${Math.floor(offset/batchSize) + 1}: rows ${offset}-${offset + batchSize - 1}`);
        
        const response = await axios.get(url, {
          timeout: 30000,
          headers: {
            'User-Agent': 'WayuuTranslator/1.0'
          }
        });

        if (response.data && response.data.rows && response.data.rows.length > 0) {
          // Establecer total en la primera iteración
          if (totalRows === 0 && response.data.num_rows_total) {
            totalRows = response.data.num_rows_total;
            this.logger.log(`📊 Dataset contains ${totalRows} total rows`);
          }

          const batchEntries = response.data.rows.map((row) => {
            // Intentar diferentes formatos de datos
            let guc = '';
            let spa = '';
            
            // Formato 1: { row: { translation: { guc: "...", spa: "..." } } }
            if (row.row.translation?.guc && row.row.translation?.spa) {
              guc = row.row.translation.guc.trim();
              spa = row.row.translation.spa.trim();
            }
            // Formato 2: { row: { guc: "...", es: "..." } }
            else if (row.row.guc && row.row.es) {
              guc = row.row.guc.trim();
              spa = row.row.es.trim();
            }
            // Formato 3: { row: { guc: "...", spa: "..." } }
            else if (row.row.guc && row.row.spa) {
              guc = row.row.guc.trim();
              spa = row.row.spa.trim();
            }
            
            return { guc, spa };
          }).filter(entry => entry.guc && entry.spa);

          entries.push(...batchEntries);
          
          this.logger.log(`✅ Batch ${Math.floor(offset/batchSize) + 1}: loaded ${batchEntries.length} entries (Total: ${entries.length})`);

          // Verificar si hay más datos
          offset += batchSize;
          hasMoreData = response.data.rows.length === batchSize && offset < totalRows;
          
          // Pequeña pausa para no sobrecargar la API
          if (hasMoreData) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else {
          this.logger.warn(`❌ Batch ${Math.floor(offset/batchSize) + 1}: No data received`);
          hasMoreData = false;
        }
      } catch (error) {
        this.logger.error(`❌ Batch ${Math.floor(offset/batchSize) + 1} failed: ${error.message}`);
        // No romper inmediatamente en caso de error de red temporal
        if (entries.length === 0) {
          hasMoreData = false;
        } else {
          // Si ya tenemos algunas entradas, intentar una vez más
          hasMoreData = false;
          this.logger.warn(`Stopping due to error, but loaded ${entries.length} entries successfully`);
        }
      }
    }

    this.logger.log(`🎯 Dataset loading completed: ${entries.length} entries loaded from ${totalRows} total`);
    return entries;
  }

  private async loadAudioViaRowsAPI(dataset: string, config: string, split: string): Promise<AudioEntry[]> {
    const entries: AudioEntry[] = [];
    const batchSize = 100; // Máximo permitido por la API
    let offset = 0;
    let hasMoreData = true;
    let totalRows = 0;
    const maxEntries = 1000; // Límite de seguridad para audio

    this.logger.log(`🎵 Starting audio dataset load via rows API...`);

    while (hasMoreData && entries.length < maxEntries) {
      try {
        const url = `https://datasets-server.huggingface.co/rows?dataset=${dataset}&config=${config}&split=${split}&offset=${offset}&length=${batchSize}`;
        this.logger.log(`🎵 Fetching audio batch ${Math.floor(offset / batchSize) + 1}: rows ${offset}-${offset + batchSize - 1}`);
        
        const response = await axios.get(url, { 
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

        // Procesar cada fila del batch
        for (const item of batch) {
          try {
            const row = item.row;
            
            // Verificar estructura de datos
            if (!row || !row.audio || !row.transcription) {
              continue;
            }

            // Extraer información del audio
            const audioData = Array.isArray(row.audio) ? row.audio[0] : row.audio;
            const audioUrl = audioData?.src || audioData?.path;
            const transcription = row.transcription;

            if (!audioUrl || !transcription) {
              continue;
            }

            // Crear entrada de audio
            const audioEntry: AudioEntry = {
              id: `audio_${entries.length.toString().padStart(3, '0')}`,
              transcription: transcription.trim(),
              audioDuration: 0, // Will be updated later with actual durations
              audioUrl: audioUrl,
              fileName: `audio_${entries.length.toString().padStart(3, '0')}.wav`,
              source: 'orkidea/wayuu_CO_test',
              isDownloaded: false,
              downloadPriority: 'medium',
              batchNumber: Math.floor(entries.length / 100) + 1
            };

            entries.push(audioEntry);

          } catch (itemError) {
            this.logger.warn(`⚠️ Error processing audio item: ${itemError.message}`);
            continue;
          }
        }

        this.logger.log(`✅ Audio batch ${Math.floor(offset / batchSize) + 1}: loaded ${batch.length} entries (Total: ${entries.length})`);

        // Verificar si hay más datos
        if (batch.length < batchSize || offset + batchSize >= totalRows) {
          hasMoreData = false;
        } else {
          offset += batchSize;
        }

        // Pausa entre requests para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        this.logger.error(`❌ Error fetching audio batch ${Math.floor(offset / batchSize) + 1}: ${error.message}`);
        
        // Intentar continuar con el siguiente batch
        if (error.response?.status === 429) {
          this.logger.log('⏳ Rate limit hit, waiting 5 seconds...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        
        break;
      }
    }

    this.logger.log(`🎯 Audio dataset loading completed: ${entries.length} entries loaded from ${totalRows} total`);
    
    this.logger.log(`🎵 Audio entries loaded: ${entries.length} entries (durations will be calculated later)`);
    
    return entries;
  }

  // ==================== CACHE METHODS ====================

  private async loadFromCache(ignoreExpiry = false): Promise<{
    success: boolean;
    data: DictionaryEntry[];
    source: string;
    shouldUpdate: boolean;
  }> {
    try {
      // Verificar si existen los archivos de cache
      const cacheExists = await this.fileExists(this.cacheFile);
      const metadataExists = await this.fileExists(this.metadataFile);

      if (!cacheExists || !metadataExists) {
        return { success: false, data: [], source: 'no-cache', shouldUpdate: false };
      }

      // Leer metadata
      const metadataContent = await fs.readFile(this.metadataFile, 'utf-8');
      const metadata: CacheMetadata = JSON.parse(metadataContent);
      
      // Verificar expiración
      const lastUpdated = new Date(metadata.lastUpdated);
      const now = new Date();
      const isExpired = (now.getTime() - lastUpdated.getTime()) > this.cacheMaxAge;
      
      if (isExpired && !ignoreExpiry) {
        this.logger.log(`⏰ Cache expired (${Math.round((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60))} hours old)`);
        return { success: false, data: [], source: 'expired', shouldUpdate: false };
      }

      // Leer datos del cache
      const cacheContent = await fs.readFile(this.cacheFile, 'utf-8');
      const cachedData: DictionaryEntry[] = JSON.parse(cacheContent);

      // Determinar si necesita actualización (cache válido pero no muy reciente)
      const shouldUpdate = isExpired || (now.getTime() - lastUpdated.getTime()) > (this.cacheMaxAge / 2);
      
      const source = isExpired ? 'expired-cache' : 'fresh-cache';
      
      this.logger.log(`📚 Cache loaded: ${cachedData.length} entries from ${metadata.lastUpdated} (${source})`);
      
      return {
        success: true,
        data: cachedData,
        source,
        shouldUpdate
      };

    } catch (error) {
      this.logger.error(`❌ Failed to load cache: ${error.message}`);
      return { success: false, data: [], source: 'error', shouldUpdate: false };
    }
  }

  private async saveToCache(data: DictionaryEntry[], datasetSource: string): Promise<void> {
    try {
      // Asegurar que el directorio existe
      await this.ensureCacheDirectory();

      // Crear metadata
      const metadata: CacheMetadata = {
        lastUpdated: new Date().toISOString(),
        totalEntries: data.length,
        datasetVersion: '1.0',
        source: datasetSource,
        checksum: this.generateChecksum(data)
      };

      // Guardar datos y metadata
      await fs.writeFile(this.cacheFile, JSON.stringify(data, null, 2), 'utf-8');
      await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2), 'utf-8');

      this.logger.log(`💾 Cache saved: ${data.length} entries to ${this.cacheFile}`);
      
    } catch (error) {
      this.logger.error(`❌ Failed to save cache: ${error.message}`);
    }
  }

  private async checkForUpdatesInBackground(dataset: string, config: string, split: string): Promise<void> {
    // Ejecutar en segundo plano sin bloquear
    setTimeout(async () => {
      try {
        this.logger.log('🔍 Checking for dataset updates...');
        
        // Intentar obtener solo la primera página para verificar si hay cambios
        const url = `https://datasets-server.huggingface.co/rows?dataset=${dataset}&config=${config}&split=${split}&offset=0&length=5`;
        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.data && response.data.num_rows_total) {
          const remoteTotal = response.data.num_rows_total;
          
          if (remoteTotal !== this.totalEntries) {
            this.logger.log(`🆕 Dataset update detected: ${remoteTotal} entries (current: ${this.totalEntries})`);
            // Aquí podrías implementar lógica para actualizar automáticamente
            // Por ahora solo logeamos la diferencia
          } else {
            this.logger.log('✅ Dataset is up to date');
          }
        }
      } catch (error) {
        this.logger.debug(`Background update check failed: ${error.message}`);
      }
    }, 5000); // Esperar 5 segundos antes de verificar
  }

  // ==================== AUDIO CACHE METHODS ====================

  private async loadAudioFromCache(ignoreExpiry = false): Promise<{
    success: boolean;
    data: AudioEntry[];
    source: string;
    shouldUpdate: boolean;
  }> {
    try {
      const cacheExists = await this.fileExists(this.audioCacheFile);
      const metadataExists = await this.fileExists(this.audioMetadataFile);

      if (!cacheExists || !metadataExists) {
        return { success: false, data: [], source: 'no-cache', shouldUpdate: false };
      }

      // Leer metadata
      const metadataContent = await fs.readFile(this.audioMetadataFile, 'utf-8');
      const metadata: AudioCacheMetadata = JSON.parse(metadataContent);

      // Verificar si el cache ha expirado
      const lastUpdated = new Date(metadata.lastUpdated);
      const now = new Date();
      const ageMs = now.getTime() - lastUpdated.getTime();
      const isExpired = ageMs > this.cacheMaxAge;

      if (isExpired && !ignoreExpiry) {
        this.logger.log(`⏰ Audio cache expired (${Math.round(ageMs / (1000 * 60 * 60))} hours old)`);
        return { success: false, data: [], source: 'expired-cache', shouldUpdate: true };
      }

      // Leer datos del cache
      const cacheContent = await fs.readFile(this.audioCacheFile, 'utf-8');
      const data: AudioEntry[] = JSON.parse(cacheContent);

      // Verificar integridad básica
      if (!Array.isArray(data) || data.length === 0) {
        this.logger.warn('⚠️  Audio cache data is invalid or empty');
        return { success: false, data: [], source: 'invalid-cache', shouldUpdate: true };
      }

      const source = isExpired ? 'expired-cache' : 'fresh-cache';
      const shouldUpdate = isExpired || ageMs > (this.cacheMaxAge * 0.5); // Update if older than 12 hours

      this.logger.log(`📦 Audio cache loaded: ${data.length} entries (${source}, age: ${Math.round(ageMs / (1000 * 60 * 60))}h)`);
      
      return { success: true, data, source, shouldUpdate };

    } catch (error) {
      this.logger.error(`❌ Failed to load audio cache: ${error.message}`);
      return { success: false, data: [], source: 'cache-error', shouldUpdate: true };
    }
  }

  private async saveAudioToCache(data: AudioEntry[], datasetSource: string): Promise<void> {
    try {
      await this.ensureCacheDirectory();

      // Obtener duraciones del servicio de duración de audio
      const durationCache = this.audioDurationService.getDurationCache();
      const totalDuration = durationCache.totalDurationSeconds || data.reduce((sum, entry) => sum + (entry.audioDuration || 0), 0);
      const averageDuration = durationCache.averageDurationSeconds || (data.length > 0 ? totalDuration / data.length : 0);

      const metadata: AudioCacheMetadata = {
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
      
    } catch (error) {
      this.logger.error(`❌ Failed to save audio cache: ${error.message}`);
    }
  }

  private async checkForAudioUpdatesInBackground(dataset: string, config: string, split: string): Promise<void> {
    setTimeout(async () => {
      try {
        this.logger.log('🔍 Checking for audio dataset updates...');
        
        const url = `https://datasets-server.huggingface.co/rows?dataset=${dataset}&config=${config}&split=${split}&offset=0&length=5`;
        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.data && response.data.num_rows_total) {
          const remoteTotal = response.data.num_rows_total;
          
          if (remoteTotal !== this.totalAudioEntries) {
            this.logger.log(`🆕 Audio dataset update detected: ${remoteTotal} entries (current: ${this.totalAudioEntries})`);
          } else {
            this.logger.log('✅ Audio dataset is up to date');
          }
        }
      } catch (error) {
        this.logger.debug(`Background audio update check failed: ${error.message}`);
      }
    }, 5000);
  }

  private async loadSampleAudioData(): Promise<void> {
    // Datos de muestra basados en el dataset real de orkidea/wayuu_CO_test
    // Duraciones promedio: ~2.5 segundos por audio, con variaciones realistas
    const sampleAudioData: AudioEntry[] = [
      {
        id: 'sample_audio_1',
        transcription: 'müshia chi wayuu jemeikai nüchikua nütüma chi Naaꞌinkai Maleiwa',
        audioDuration: 3.2, // Realistic duration for this transcription
        source: 'orkidea/wayuu_CO_test',
        fileName: 'sample_001.wav'
      },
      {
        id: 'sample_audio_2', 
        transcription: 'Nnojoishi nüjütüinshin chi Nüchonkai saꞌakamüin wayuu',
        audioDuration: 2.8, // Realistic duration 
        source: 'orkidea/wayuu_CO_test',
        fileName: 'sample_002.wav'
      },
      {
        id: 'sample_audio_3',
        transcription: 'tayakai chi Shipayakai Wayuu',
        audioDuration: 1.9, // Shorter phrase, shorter duration
        source: 'orkidea/wayuu_CO_test',
        fileName: 'sample_003.wav'
      }
    ];

    this.wayuuAudioDataset = sampleAudioData;
    this.totalAudioEntries = sampleAudioData.length;
    this.isAudioLoaded = true;
    
    this.logger.log(`📝 Loaded ${sampleAudioData.length} sample audio entries with realistic durations`);
  }

  private generateAudioChecksum(data: AudioEntry[]): string {
    const content = data.map(entry => `${entry.id}:${entry.transcription}:${entry.audioDuration}`).join('|');
    return Buffer.from(content).toString('base64').substring(0, 16);
  }

  /**
   * Load audio durations from cache and apply them to the dataset entries
   */
  private async loadAndApplyAudioDurations(): Promise<void> {
    try {
      const durationCacheExists = await this.fileExists(this.audioDurationCacheFile);
      if (!durationCacheExists) {
        this.logger.log('📊 No audio duration cache found, durations will remain 0');
        return;
      }

      const durationCacheContent = await fs.readFile(this.audioDurationCacheFile, 'utf-8');
      const durationCache = JSON.parse(durationCacheContent);

      if (!durationCache || typeof durationCache !== 'object' || !durationCache.durations) {
        this.logger.warn('⚠️ Invalid audio duration cache format');
        return;
      }

      let appliedCount = 0;
      let totalDuration = 0;

      // Apply durations to the audio dataset entries
      this.wayuuAudioDataset.forEach(entry => {
        const durationData = durationCache.durations[entry.id];
        if (durationData && typeof durationData.duration === 'number') {
          entry.audioDuration = durationData.duration;
          totalDuration += durationData.duration;
          appliedCount++;
        }
      });

      this.logger.log(`🎵 Applied audio durations: ${appliedCount}/${this.wayuuAudioDataset.length} entries, total: ${(totalDuration / 60).toFixed(1)} minutes`);

      // Update the cache metadata with the correct totals
      if (appliedCount > 0) {
        await this.updateAudioCacheMetadata(totalDuration);
      }

    } catch (error) {
      this.logger.error(`❌ Failed to load audio durations from cache: ${error.message}`);
    }
  }

  /**
   * Update audio cache metadata with correct duration totals
   */
  private async updateAudioCacheMetadata(totalDurationSeconds: number): Promise<void> {
    try {
      const averageDuration = this.wayuuAudioDataset.length > 0 ? totalDurationSeconds / this.wayuuAudioDataset.length : 0;

      const metadata: AudioCacheMetadata = {
        lastUpdated: new Date().toISOString(),
        totalAudioEntries: this.wayuuAudioDataset.length,
        totalDurationSeconds: totalDurationSeconds,
        averageDurationSeconds: averageDuration,
        datasetVersion: '1.0',
        source: 'orkidea/wayuu_CO_test',
        checksum: this.generateAudioChecksum(this.wayuuAudioDataset)
      };

      await fs.writeFile(this.audioMetadataFile, JSON.stringify(metadata, null, 2), 'utf-8');
      this.logger.log(`📊 Updated audio cache metadata: ${totalDurationSeconds.toFixed(1)}s total, ${averageDuration.toFixed(2)}s average`);

    } catch (error) {
      this.logger.error(`❌ Failed to update audio cache metadata: ${error.message}`);
    }
  }

  // ==================== HELPER METHODS ====================

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create cache directory: ${error.message}`);
    }
  }

  private generateChecksum(data: DictionaryEntry[]): string {
    // Simple checksum basado en el contenido
    const content = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private async loadViaParquet(dataset: string): Promise<DictionaryEntry[]> {
    try {
      // Obtener URL del archivo parquet
      const parquetResponse = await axios.get(
        `https://datasets-server.huggingface.co/parquet?dataset=${dataset}`,
        { timeout: 10000 }
      );

      if (parquetResponse.data && parquetResponse.data.parquet_files && parquetResponse.data.parquet_files.length > 0) {
        const parquetUrl = parquetResponse.data.parquet_files[0].url;
        this.logger.log(`Found parquet file: ${parquetUrl}`);
        
        // Para implementación futura con biblioteca parquet
        // Por ahora, simplemente logeamos la URL disponible
        this.logger.warn('Parquet loading not yet implemented - parquet file available at: ' + parquetUrl);
      }
    } catch (error) {
      this.logger.error(`Parquet method failed: ${error.message}`);
    }
    
    return [];
  }

  private async loadSampleData(): Promise<void> {
    this.logger.log('Loading sample Wayuu-Spanish dictionary data...');
    
    // Data de muestra expandida basada en el dataset real
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

  // Método para recargar el dataset manualmente (con opciones de cache)
  async reloadDataset(clearCache = false): Promise<{ success: boolean; message: string; totalEntries?: number }> {
    try {
      this.logger.log(`🔄 Forcing dataset reload${clearCache ? ' (clearing cache)' : ''}...`);
      
      // Limpiar cache si se solicita
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
    } catch (error) {
      this.logger.error(`Failed to reload dataset: ${error.message}`);
      return {
        success: false,
        message: `Failed to reload dataset: ${error.message}`
      };
    }
  }

  // Método para limpiar cache
  async clearCache(): Promise<void> {
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
      
    } catch (error) {
      this.logger.error(`Failed to clear cache: ${error.message}`);
    }
  }

  // Obtener información del cache
  async getCacheInfo(): Promise<{
    exists: boolean;
    metadata?: CacheMetadata;
    size?: string;
  }> {
    try {
      const cacheExists = await this.fileExists(this.cacheFile);
      const metadataExists = await this.fileExists(this.metadataFile);
      
      if (!cacheExists || !metadataExists) {
        return { exists: false };
      }
      
      const metadataContent = await fs.readFile(this.metadataFile, 'utf-8');
      const metadata: CacheMetadata = JSON.parse(metadataContent);
      
      const stats = await fs.stat(this.cacheFile);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      return {
        exists: true,
        metadata,
        size: `${sizeInMB} MB`
      };
      
    } catch (error) {
      this.logger.error(`Failed to get cache info: ${error.message}`);
      return { exists: false };
    }
  }

  async findExactMatch(
    text: string,
    direction: TranslationDirection,
    preferredDataset?: string,
  ): Promise<TranslationResult | null> {
    if (!this.isLoaded) {
      await this.loadWayuuDictionary();
    }

    const normalizedText = this.normalizeText(text);
    
    let matches: DictionaryEntry[] = [];

    if (direction === TranslationDirection.WAYUU_TO_SPANISH) {
      matches = this.wayuuDictionary.filter(entry => 
        this.normalizeText(entry.guc) === normalizedText
      );
    } else {
      matches = this.wayuuDictionary.filter(entry => 
        this.normalizeText(entry.spa).includes(normalizedText) ||
        entry.spa.toLowerCase().split(' ').some(word => 
          this.normalizeText(word) === normalizedText
        )
      );
    }

    if (matches.length === 0) {
      return null;
    }

    const primaryMatch = matches[0];
    const alternatives = matches.slice(1).map(match => 
      direction === TranslationDirection.WAYUU_TO_SPANISH ? match.spa : match.guc
    );

    return {
      translatedText: direction === TranslationDirection.WAYUU_TO_SPANISH ? 
        primaryMatch.spa : primaryMatch.guc,
      confidence: 1.0,
      sourceDataset: 'Gaxys/wayuu_spa_dict',
      alternatives: alternatives.length > 0 ? alternatives : undefined,
      contextInfo: alternatives.length > 0 ? 
        `Found ${matches.length} possible translations` : undefined,
    };
  }

  async findFuzzyMatch(
    text: string,
    direction: TranslationDirection,
    preferredDataset?: string,
  ): Promise<TranslationResult | null> {
    if (!this.isLoaded) {
      await this.loadWayuuDictionary();
    }

    const normalizedText = this.normalizeText(text);
    let bestMatches: { entry: DictionaryEntry; similarity: number }[] = [];

    if (direction === TranslationDirection.WAYUU_TO_SPANISH) {
      bestMatches = this.wayuuDictionary
        .map(entry => ({
          entry,
          similarity: this.calculateSimilarity(normalizedText, this.normalizeText(entry.guc))
        }))
        .filter(match => match.similarity > 0.6)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
    } else {
      bestMatches = this.wayuuDictionary
        .map(entry => ({
          entry,
          similarity: Math.max(
            this.calculateSimilarity(normalizedText, this.normalizeText(entry.spa)),
            ...entry.spa.toLowerCase().split(' ').map(word => 
              this.calculateSimilarity(normalizedText, this.normalizeText(word))
            )
          )
        }))
        .filter(match => match.similarity > 0.6)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
    }

    if (bestMatches.length === 0) {
      return null;
    }

    const bestMatch = bestMatches[0];
    const alternatives = bestMatches.slice(1).map(match => 
      direction === TranslationDirection.WAYUU_TO_SPANISH ? match.entry.spa : match.entry.guc
    );

    return {
      translatedText: direction === TranslationDirection.WAYUU_TO_SPANISH ? 
        bestMatch.entry.spa : bestMatch.entry.guc,
      confidence: bestMatch.similarity,
      sourceDataset: 'Gaxys/wayuu_spa_dict',
      alternatives: alternatives.length > 0 ? alternatives : undefined,
      contextInfo: `Fuzzy match with ${Math.round(bestMatch.similarity * 100)}% similarity`,
    };
  }

  private normalizeText(text: string): string {
    return text.toLowerCase()
      .trim()
      .replace(/[.,;:!?]/g, '')
      .replace(/\s+/g, ' ');
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
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
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  async getLoadedDatasets(): Promise<string[]> {
    return ['Gaxys/wayuu_spa_dict', 'orkidea/wayuu_CO_test'];
  }

  async getDatasetInfo(): Promise<any> {
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

  async getDictionaryStats(): Promise<any> {
    if (!this.isLoaded) {
      await this.loadWayuuDictionary();
    }
    if (!this.isAudioLoaded) {
      await this.loadWayuuAudioDataset();
    }

    // Combinar todos los datasets para estadísticas
    const allEntries = [...this.wayuuDictionary];
    this.additionalDatasets.forEach((entries) => {
      allEntries.push(...entries);
    });

    const wayuuWords = new Set(allEntries.map(entry => entry.guc)).size;
    const spanishWords = new Set(
      allEntries.flatMap(entry => entry.spa.toLowerCase().split(' '))
    ).size;

    // Audio statistics
    const totalAudioDuration = this.wayuuAudioDataset.reduce((sum, entry) => sum + entry.audioDuration, 0);
    const averageAudioDuration = this.wayuuAudioDataset.length > 0 ? totalAudioDuration / this.wayuuAudioDataset.length : 0;
    const audioTranscriptionWords = new Set(
      this.wayuuAudioDataset.flatMap(entry => entry.transcription.toLowerCase().split(' ').filter(word => word.length > 0))
    ).size;

    return {
      // Dictionary statistics (incluyendo todos los datasets)
      totalEntries: allEntries.length,
      totalEntriesExpected: this.calculateTotalExpectedEntries(),
      uniqueWayuuWords: wayuuWords,
      uniqueSpanishWords: spanishWords,
      averageSpanishWordsPerEntry: allEntries.length > 0 ? 
        allEntries.reduce((sum, entry) => sum + entry.spa.split(' ').length, 0) / allEntries.length : 0,
      
      // Audio statistics
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

  // ==================== AUDIO METHODS ====================

  async getAudioDatasetInfo(): Promise<any> {
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

  async getAudioStats(): Promise<any> {
    if (!this.isAudioLoaded) {
      await this.loadWayuuAudioDataset();
    }

    // 🔄 NUEVA LÓGICA: Calcular estadísticas combinadas de todas las fuentes de audio activas
    const sources = await this.getHuggingFaceSources();
    const activeSources = sources.filter(s => s.isActive);
    const dictionarySources = sources.filter(s => s.type === 'dictionary');
    const audioSources = sources.filter(s => s.type === 'audio');
    const mixedSources = sources.filter(s => s.type === 'mixed');
    
    let totalCombinedEntries = 0;
    let totalCombinedDurationSeconds = 0;
    let averageCombinedDuration = 0;
    
    // Calcular totales combinados usando propiedades dinámicas
    for (const source of activeSources) {
      if ((source as any).totalEntries) {
        totalCombinedEntries += (source as any).totalEntries;
      }
      if ((source as any).totalDurationSeconds) {
        totalCombinedDurationSeconds += (source as any).totalDurationSeconds;
      }
    }
    
    // Calcular promedio combinado
    if (totalCombinedEntries > 0) {
      averageCombinedDuration = totalCombinedDurationSeconds / totalCombinedEntries;
    }

    // Obtener duraciones del servicio especializado para el dataset principal
    const durationCache = this.audioDurationService.getDurationCache();
    
    // Usar duraciones del cache si están disponibles, sino calcular manualmente para el dataset principal
    const mainDatasetDuration = durationCache.totalDurationSeconds > 0 
      ? durationCache.totalDurationSeconds 
      : this.wayuuAudioDataset.reduce((sum, entry) => sum + (entry.audioDuration || 0), 0);
    
    const mainDatasetAverage = durationCache.averageDurationSeconds > 0 
      ? durationCache.averageDurationSeconds 
      : (this.wayuuAudioDataset.length > 0 ? mainDatasetDuration / this.wayuuAudioDataset.length : 0);
    
    // Calcular estadísticas de transcripciones del dataset principal
    const transcriptionLengths = this.wayuuAudioDataset.map(entry => entry.transcription.length);
    const averageTranscriptionLength = transcriptionLengths.length > 0 
      ? transcriptionLengths.reduce((sum, len) => sum + len, 0) / transcriptionLengths.length 
      : 0;

    const uniqueWords = new Set(
      this.wayuuAudioDataset.flatMap(entry => entry.transcription.toLowerCase().split(' '))
    ).size;

    const downloadedEntries = this.wayuuAudioDataset.filter(entry => entry.isDownloaded).length;

    // 🎯 RETORNAR ESTADÍSTICAS COMBINADAS + DETALLES INDIVIDUALES
    return {
      // === ESTADÍSTICAS COMBINADAS (todas las fuentes activas) ===
      totalAudioEntries: totalCombinedEntries, // 🔄 Ahora incluye todos los datasets activos
      totalDurationSeconds: Math.round(totalCombinedDurationSeconds * 100) / 100,
      totalDurationMinutes: Math.round((totalCombinedDurationSeconds / 60) * 100) / 100,
      averageDurationSeconds: Math.round(averageCombinedDuration * 100) / 100,
      
      // === ESTADÍSTICAS DEL DATASET PRINCIPAL ===
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
      
      // === DETALLES DE FUENTES ACTIVAS ===
      activeSources: activeSources.map(source => ({
        id: source.id,
        name: source.name,
        entries: (source as any).totalEntries || 0,
        durationSeconds: (source as any).totalDurationSeconds || 0,
        durationFormatted: (source as any).totalDurationFormatted || '0:00'
      })),
      
      // === INFORMACIÓN DE LEGACY (para compatibilidad) ===
      totalEntriesExpected: totalCombinedEntries,
      uniqueWayuuWords: uniqueWords, // Del dataset principal
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
        combinedSources: `${activeSources.length} active audio sources`
      }
    };
  }

  async getAudioEntries(page: number = 1, limit: number = 20): Promise<any> {
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

  async searchAudioByTranscription(query: string, limit: number = 10): Promise<any> {
    if (!this.isAudioLoaded) {
      await this.loadWayuuAudioDataset();
    }

    const normalizedQuery = this.normalizeText(query);
    const results = [];

    for (const entry of this.wayuuAudioDataset) {
      const normalizedTranscription = this.normalizeText(entry.transcription);
      
      // Búsqueda exacta
      if (normalizedTranscription.includes(normalizedQuery)) {
        results.push({
          ...entry,
          matchType: 'exact',
          confidence: 1.0
        });
        continue;
      }

      // Búsqueda fuzzy
      const similarity = this.calculateSimilarity(normalizedQuery, normalizedTranscription);
      if (similarity > 0.6) {
        results.push({
          ...entry,
          matchType: 'fuzzy',
          confidence: similarity
        });
      }

      if (results.length >= limit) break;
    }

    // Ordenar por confianza
    results.sort((a, b) => b.confidence - a.confidence);

    return {
      query,
      results: results.slice(0, limit),
      totalMatches: results.length,
      searchTime: Date.now()
    };
  }

  async reloadAudioDataset(clearCache: boolean = false): Promise<{ success: boolean; message: string; totalAudioEntries?: number }> {
    try {
      if (clearCache) {
        await this.clearAudioCache();
        this.logger.log('🗑️ Audio cache cleared before reload');
      }

      // Reset audio state
      this.wayuuAudioDataset = [];
      this.isAudioLoaded = false;
      this.totalAudioEntries = 0;
      this.audioLoadingPromise = null;

      // Reload audio dataset
      await this.loadWayuuAudioDataset();

      return {
        success: true,
        message: `Audio dataset reloaded successfully. Loaded ${this.wayuuAudioDataset.length} audio entries.`,
        totalAudioEntries: this.wayuuAudioDataset.length
      };
    } catch (error) {
      this.logger.error(`Failed to reload audio dataset: ${error.message}`);
      return {
        success: false,
        message: `Failed to reload audio dataset: ${error.message}`
      };
    }
  }

  async getAudioCacheInfo(): Promise<{
    exists: boolean;
    metadata?: AudioCacheMetadata;
    size?: string;
  }> {
    try {
      const cacheExists = await this.fileExists(this.audioCacheFile);
      const metadataExists = await this.fileExists(this.audioMetadataFile);

      if (!cacheExists) {
        return { exists: false };
      }

      let metadata: AudioCacheMetadata | undefined;
      if (metadataExists) {
        const metadataContent = await fs.readFile(this.audioMetadataFile, 'utf-8');
        metadata = JSON.parse(metadataContent);
      }

      // Get file size
      const stats = await fs.stat(this.audioCacheFile);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      return {
        exists: true,
        metadata,
        size: `${sizeInMB} MB`
      };
    } catch (error) {
      this.logger.error(`Error getting audio cache info: ${error.message}`);
      return { exists: false };
    }
  }

  async clearAudioCache(): Promise<void> {
    try {
      const filesToDelete = [this.audioCacheFile, this.audioMetadataFile];
      
      for (const file of filesToDelete) {
        if (await this.fileExists(file)) {
          await fs.unlink(file);
          this.logger.log(`🗑️ Deleted audio cache file: ${file}`);
        }
      }

      // Reset audio state
      this.wayuuAudioDataset = [];
      this.isAudioLoaded = false;
      this.totalAudioEntries = 0;
      this.audioLoadingPromise = null;

    } catch (error) {
      this.logger.error(`Error clearing audio cache: ${error.message}`);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  private calculateTotalExpectedEntries(): number {
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

  private getLoadedDatasetInfo(): any[] {
    const info = [];
    
    // Dataset principal
    info.push({
      source: 'Gaxys/wayuu_spa_dict',
      url: 'https://huggingface.co/datasets/Gaxys/wayuu_spa_dict',
      description: 'Wayuu-Spanish dictionary dataset from Hugging Face',
      status: this.isLoaded ? 'loaded' : 'loading',
      type: 'text',
      entries: this.wayuuDictionary.length
    });

    // Datasets adicionales
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

    // Dataset de audio
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

  // ==================== HUGGING FACE SOURCES MANAGEMENT ====================

  async getHuggingFaceSources(): Promise<HuggingFaceSource[]> {
    const sources = [...this.huggingFaceSources.sort((a, b) => a.priority - b.priority)];
    
    // Agregar información dinámica para cada tipo de dataset
    for (const source of sources) {
      if (source.type === 'audio') {
        try {
          const totalDuration = await this.calculateAudioDatasetDuration(source.id);
          (source as any).totalDurationSeconds = totalDuration.seconds;
          (source as any).totalDurationFormatted = totalDuration.formatted;
          (source as any).totalEntries = totalDuration.entries;
        } catch (error) {
          this.logger.warn(`⚠️ Could not calculate duration for ${source.name}: ${error.message}`);
          (source as any).totalDurationSeconds = 0;
          (source as any).totalDurationFormatted = '0:00';
          (source as any).totalEntries = 0;
        }
      } else if (source.type === 'dictionary' || source.type === 'mixed') {
        try {
          const dictionaryInfo = await this.calculateDictionaryEntries(source.id);
          (source as any).totalEntries = dictionaryInfo.entries;
          (source as any).entriesFormatted = dictionaryInfo.formatted;
          // Actualizar descripción con número exacto
          (source as any).description = source.description.replace(
            /with over \d+,?\d* entries/,
            `with ${dictionaryInfo.formatted} entries`
          ).replace(
            /with \d+,?\d* translation pairs/,
            `with ${dictionaryInfo.formatted} translation pairs`
          ).replace(
            /with \d+,?\d* Wayuu-Spanish sentence pairs/,
            `with ${dictionaryInfo.formatted} Wayuu-Spanish sentence pairs`
          ).replace(
            /Comprehensive collection of Wayuu linguistic resources and documentation/,
            `Comprehensive collection of Wayuu linguistic resources and documentation (${dictionaryInfo.formatted} files)`
          );
        } catch (error) {
          this.logger.warn(`⚠️ Could not calculate entries for ${source.name}: ${error.message}`);
          (source as any).totalEntries = 0;
          (source as any).entriesFormatted = '0';
        }
      }
    }
    
    return sources;
  }

  private async calculateAudioDatasetDuration(sourceId: string): Promise<{
    seconds: number;
    formatted: string;
    entries: number;
  }> {
    // Cargar el dataset de audio si no está cargado
    if (!this.isAudioLoaded) {
      await this.loadWayuuAudioDataset();
    }

    let totalDurationSeconds = 0;
    let entriesCount = 0;

    if (sourceId === 'wayuu_audio') {
      // Dataset principal de wayuu audio
      totalDurationSeconds = this.wayuuAudioDataset.reduce((sum, entry) => sum + (entry.audioDuration || 0), 0);
      entriesCount = this.wayuuAudioDataset.length;
    } else if (sourceId === 'palabrero_guc_draft') {
      // Para el dataset de Palabrero, obtener duración desde audioDurationService
      const durationCache = this.audioDurationService.getDurationCache();
      const palabreroEntries = Object.values(durationCache.durations).filter(entry => 
        entry.id && entry.id.includes('palabrero')
      );
      totalDurationSeconds = palabreroEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
      entriesCount = palabreroEntries.length;
      
      // Si no hay datos específicos de Palabrero, usar estimación
      if (entriesCount === 0) {
        entriesCount = 17; // Como se menciona en la descripción
        totalDurationSeconds = entriesCount * 8.5; // Estimación promedio
      }
    }

    // Formatear duración
    const minutes = Math.floor(totalDurationSeconds / 60);
    const seconds = Math.floor(totalDurationSeconds % 60);
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return {
      seconds: totalDurationSeconds,
      formatted,
      entries: entriesCount
    };
  }

  private async calculateDictionaryEntries(sourceId: string): Promise<{
    entries: number;
    formatted: string;
  }> {
    let entriesCount = 0;

    if (sourceId === 'wayuu_spa_dict') {
      // Dataset principal de diccionario wayuu-español
      if (!this.isLoaded) {
        await this.loadWayuuDictionary();
      }
      entriesCount = this.wayuuDictionary.length;
    } else if (sourceId === 'wayuu_spa_large') {
      // Dataset grande Gaxys/wayuu_spa
      const additionalDataset = this.additionalDatasets.get(sourceId);
      if (additionalDataset) {
        entriesCount = additionalDataset.length;
      } else {
        // Usar valor conocido del dataset
        entriesCount = 46827; // Valor del dataset Gaxys/wayuu_spa
      }
    } else if (sourceId === 'wayuu_parallel_corpus') {
      // Corpus paralelo
      const additionalDataset = this.additionalDatasets.get(sourceId);
      if (additionalDataset) {
        entriesCount = additionalDataset.length;
      } else {
        // Usar valor conocido del dataset
        entriesCount = 42687; // Valor del dataset weezygeezer/Wayuu-Spanish_Parallel-Corpus
      }
    } else if (sourceId === 'wayuu_linguistic_sources') {
      // Fuentes lingüísticas wayuu
      const additionalDataset = this.additionalDatasets.get(sourceId);
      if (additionalDataset) {
        entriesCount = additionalDataset.length;
      } else {
        // Valor estimado para las fuentes lingüísticas (se actualizará dinámicamente)
        entriesCount = 0; // Se calculará cuando se cargue el dataset
      }
    }

    // Formatear número con comas para mejor legibilidad
    const formatted = entriesCount.toLocaleString();

    return {
      entries: entriesCount,
      formatted
    };
  }

  getActiveHuggingFaceSources(): HuggingFaceSource[] {
    return this.huggingFaceSources.filter(source => source.isActive).sort((a, b) => a.priority - b.priority);
  }

  getDictionarySource(): HuggingFaceSource {
    return this.huggingFaceSources.find(source => source.type === 'dictionary' && source.isActive) || this.huggingFaceSources[0];
  }

  getAudioSource(): HuggingFaceSource {
    return this.huggingFaceSources.find(source => source.type === 'audio' && source.isActive) || this.huggingFaceSources[1];
  }

  addHuggingFaceSource(source: Omit<HuggingFaceSource, 'priority'>): void {
    const newSource: HuggingFaceSource = {
      ...source,
      priority: this.huggingFaceSources.length + 1
    };
    this.huggingFaceSources.push(newSource);
    this.logger.log(`➕ Added new Hugging Face source: ${newSource.name}`);
  }

  updateHuggingFaceSource(id: string, updates: Partial<HuggingFaceSource>): boolean {
    const index = this.huggingFaceSources.findIndex(source => source.id === id);
    if (index !== -1) {
      this.huggingFaceSources[index] = { ...this.huggingFaceSources[index], ...updates };
      this.logger.log(`✏️ Updated Hugging Face source: ${id}`);
      return true;
    }
    return false;
  }

  removeHuggingFaceSource(id: string): boolean {
    const index = this.huggingFaceSources.findIndex(source => source.id === id);
    if (index !== -1) {
      const removed = this.huggingFaceSources.splice(index, 1)[0];
      this.logger.log(`🗑️ Removed Hugging Face source: ${removed.name}`);
      return true;
    }
    return false;
  }

  // Método para activar/desactivar una fuente
  toggleHuggingFaceSource(id: string): { success: boolean; isActive?: boolean; source?: HuggingFaceSource } {
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

  // Método para cargar dataset adicional
  async loadAdditionalDataset(id: string, loadFull: boolean = false): Promise<{ success: boolean; message: string; data?: any }> {
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
      // Si es el corpus paralelo, el dataset grande o las fuentes lingüísticas, lo cargamos
      if (id === 'wayuu_parallel_corpus' || id === 'wayuu_spa_large' || id === 'wayuu_linguistic_sources') {
        this.logger.log(`🔄 Loading additional dataset: ${source.name}...`);
        
        if (loadFull) {
          // Cargar dataset completo si ya no está cargado
          if (!this.additionalDatasets.has(id)) {
            this.logger.log(`📥 Loading full dataset: ${source.name}`);
            const fullData = await this.loadViaRowsAPI(source.dataset, source.config, source.split);
            
            // Procesar según el formato
            let processedData: DictionaryEntry[] = [];
            if (id === 'wayuu_spa_large') {
              // Formato nested: { translation: { guc: "...", spa: "..." } }
              processedData = fullData.map(entry => ({
                guc: (entry as any).translation?.guc || entry.guc,
                spa: (entry as any).translation?.spa || entry.spa
              })).filter(entry => entry.guc && entry.spa);
            } else if (id === 'wayuu_linguistic_sources') {
              // Formato de fuentes lingüísticas (adaptativo)
              processedData = fullData.map(entry => ({
                guc: entry.guc || (entry as any).wayuu || (entry as any).text_wayuu || '',
                spa: entry.spa || (entry as any).spanish || (entry as any).es || (entry as any).text_spanish || ''
              })).filter(entry => entry.guc && entry.spa);
            } else {
              // Formato estándar
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
          } else {
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
        } else {
          // Solo cargar preview
          const url = `https://datasets-server.huggingface.co/rows?dataset=${source.dataset}&config=${source.config}&split=${source.split}&offset=0&length=100`;
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          this.logger.log(`📊 Preview loaded: ${data.rows.length} entries from ${source.name}`);
          
          // Procesar datos según el formato del dataset
          let processedPreview;
          if (id === 'wayuu_spa_large') {
            // Formato: { translation: { guc: "...", spa: "..." }, id: number }
            processedPreview = data.rows.slice(0, 10).map(row => ({
              row_idx: row.row_idx,
              row: {
                guc: row.row.translation.guc,
                es: row.row.translation.spa
              }
            }));
          } else if (id === 'wayuu_linguistic_sources') {
            // Formato de fuentes lingüísticas (adaptativo)
            processedPreview = data.rows.slice(0, 10).map(row => ({
              row_idx: row.row_idx,
              row: {
                guc: row.row.guc || row.row.wayuu || row.row.text_wayuu || 'N/A',
                es: row.row.spa || row.row.spanish || row.row.es || row.row.text_spanish || 'N/A'
              }
            }));
          } else {
            // Formato estándar: { guc: "...", es: "..." }
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

    } catch (error) {
      this.logger.error(`❌ Error loading additional dataset ${source.name}:`, error);
      return { 
        success: false, 
        message: `Failed to load ${source.name}: ${error.message}` 
      };
    }
  }

  /**
   * Updates dataset metrics for monitoring systems (like Prometheus)
   * This method can be called to refresh metrics without returning data
   */
  async updateDatasetMetrics(): Promise<void> {
    try {
      this.logger.log('🔄 Updating dataset metrics...');
      
      // Ensure datasets are loaded
      if (!this.isLoaded) {
        await this.loadWayuuDictionary();
      }
      if (!this.isAudioLoaded) {
        await this.loadWayuuAudioDataset();
      }

      // Update Hugging Face sources metrics
      const sources = await this.getHuggingFaceSources();
      const activeSources = sources.filter(s => s.isActive);
      const dictionarySources = sources.filter(s => s.type === 'dictionary');
      const audioSources = sources.filter(s => s.type === 'audio');
      const mixedSources = sources.filter(s => s.type === 'mixed');

      // Update total sources by type
      this.metricsService.updateHuggingfaceSourcesTotal('dictionary', dictionarySources.length);
      this.metricsService.updateHuggingfaceSourcesTotal('audio', audioSources.length);
      this.metricsService.updateHuggingfaceSourcesTotal('mixed', mixedSources.length);
      this.metricsService.updateHuggingfaceSourcesTotal('all', sources.length);

      // Update active sources by type
      const activeDictionarySources = activeSources.filter(s => s.type === 'dictionary');
      const activeAudioSources = activeSources.filter(s => s.type === 'audio');
      const activeMixedSources = activeSources.filter(s => s.type === 'mixed');
      
      this.metricsService.updateHuggingfaceSourcesActive('dictionary', activeDictionarySources.length);
      this.metricsService.updateHuggingfaceSourcesActive('audio', activeAudioSources.length);
      this.metricsService.updateHuggingfaceSourcesActive('mixed', activeMixedSources.length);
      this.metricsService.updateHuggingfaceSourcesActive('all', activeSources.length);

      // Update dataset load status for each source
      for (const source of sources) {
        const isLoaded = source.isActive && (
          (source.type === 'dictionary' && this.isLoaded) ||
          (source.type === 'audio' && this.isAudioLoaded) ||
          (source.type === 'mixed' && this.isLoaded && this.isAudioLoaded)
        );
        
        this.metricsService.updateDatasetLoadStatus(
          source.name,
          source.type,
          source.isActive,
          isLoaded
        );

        // Update other dataset metrics
        if (isLoaded) {
          if (source.type === 'dictionary' || source.type === 'mixed') {
            this.metricsService.updateDatasetTotalEntries(source.name, source.type, this.totalEntries);
            this.metricsService.updateDatasetUniqueWords(source.name, 'wayuu', source.type, this.totalEntries);
            this.metricsService.updateDatasetUniqueWords(source.name, 'spanish', source.type, this.totalEntries);
            this.metricsService.updateDatasetLastUpdateTime(source.name, source.type, Date.now());
          }
          
          if (source.type === 'audio' || source.type === 'mixed') {
            this.metricsService.updateDatasetTotalEntries(source.name, source.type, this.totalAudioEntries);
            
            // Calculate total audio duration
            const totalDurationSeconds = this.wayuuAudioDataset.reduce((sum, entry) => sum + (entry.audioDuration || 0), 0);
            this.metricsService.updateAudioDatasetTotalDuration(source.name, totalDurationSeconds);
            
            const averageDuration = this.totalAudioEntries > 0 ? totalDurationSeconds / this.totalAudioEntries : 0;
            this.metricsService.updateAudioDatasetAverageDuration(source.name, averageDuration);
            
            // Count downloaded audio files (assuming they are all downloaded for now)
            this.metricsService.updateAudioFilesDownloaded(source.name, this.totalAudioEntries);
            this.metricsService.updateAudioDownloadProgress(source.name, 100); // 100% progress
            
            this.metricsService.updateDatasetLastUpdateTime(source.name, source.type, Date.now());
          }
        }
      }

      // Update PDF processing metrics
      try {
        const pdfStats = await this.pdfProcessingService.getProcessingStats();
        this.metricsService.updatePdfProcessingTotalPdfs(pdfStats.totalPDFs);
        this.metricsService.updatePdfProcessingProcessedPdfs(pdfStats.processedPDFs);
        this.metricsService.updatePdfProcessingTotalPages(pdfStats.totalPages);
        this.metricsService.updatePdfProcessingWayuuPhrases(pdfStats.totalWayuuPhrases);
        this.metricsService.updatePdfProcessingWayuuPercentage(pdfStats.avgWayuuPercentage);
        this.metricsService.updatePdfProcessingTimeSeconds(pdfStats.processingTime / 1000); // Convert to seconds
      } catch (pdfError) {
        this.logger.warn(`⚠️ Could not update PDF metrics: ${pdfError.message}`);
        // Set default values if PDF service is not available
        this.metricsService.updatePdfProcessingTotalPdfs(0);
        this.metricsService.updatePdfProcessingProcessedPdfs(0);
        this.metricsService.updatePdfProcessingTotalPages(0);
        this.metricsService.updatePdfProcessingWayuuPhrases(0);
        this.metricsService.updatePdfProcessingWayuuPercentage(0);
        this.metricsService.updatePdfProcessingTimeSeconds(0);
      }

      // Log current state for metrics collection
      this.logger.log(`📊 Metrics updated: Dictionary=${this.totalEntries}, Audio=${this.totalAudioEntries}, Sources=${sources.length}, Active=${activeSources.length}`);
      
    } catch (error) {
      this.logger.error(`❌ Error updating dataset metrics:`, error);
      throw error;
    }
  }

  /**
   * Get statistics for a specific dataset source
   * Used by metrics system to calculate growth metrics
   */
  async getDatasetStats(sourceName: string): Promise<{
    total_entries: number;
    wayuu_words: number;
    spanish_words: number;
    audio_minutes: number;
    phrases: number;
    transcribed: number;
    dictionary_entries: number;
    audio_files: number;
  }> {
    try {
      // Find the source by name
      const source = this.huggingFaceSources.find(s => s.name === sourceName);
      if (!source || !source.isActive) {
        return {
          total_entries: 0,
          wayuu_words: 0,
          spanish_words: 0,
          audio_minutes: 0,
          phrases: 0,
          transcribed: 0,
          dictionary_entries: 0,
          audio_files: 0,
        };
      }

      // Ensure data is loaded
      if (!this.isLoaded) {
        await this.loadWayuuDictionary();
      }
      if (!this.isAudioLoaded) {
        await this.loadWayuuAudioDataset();
      }

      let stats = {
        total_entries: 0,
        wayuu_words: 0,
        spanish_words: 0,
        audio_minutes: 0,
        phrases: 0,
        transcribed: 0,
        dictionary_entries: 0,
        audio_files: 0,
      };

      if (source.type === 'dictionary' || source.type === 'mixed') {
        // Calculate dictionary statistics
        const wayuuWords = new Set<string>();
        const spanishWords = new Set<string>();
        
        this.wayuuDictionary.forEach(entry => {
          // Split text into words and add to sets
          const wayuuWordList = entry.guc.toLowerCase().split(/\s+/).filter(word => word.length > 1);
          const spanishWordList = entry.spa.toLowerCase().split(/\s+/).filter(word => word.length > 1);
          
          wayuuWordList.forEach(word => wayuuWords.add(word));
          spanishWordList.forEach(word => spanishWords.add(word));
        });

        stats.dictionary_entries = this.totalEntries;
        stats.phrases += this.totalEntries;
        stats.wayuu_words = wayuuWords.size;
        stats.spanish_words = spanishWords.size;
        stats.total_entries += this.totalEntries;
      }

      if (source.type === 'audio' || source.type === 'mixed') {
        // Calculate audio statistics
        const totalDurationSeconds = this.wayuuAudioDataset.reduce((sum, entry) => sum + (entry.audioDuration || 0), 0);
        const transcribedCount = this.wayuuAudioDataset.filter(entry => entry.transcription && entry.transcription.trim().length > 0).length;
        
        // Count unique words in transcriptions
        const transcriptionWords = new Set<string>();
        this.wayuuAudioDataset.forEach(entry => {
          if (entry.transcription) {
            const words = entry.transcription.toLowerCase().split(/\s+/).filter(word => word.length > 1);
            words.forEach(word => transcriptionWords.add(word));
          }
        });

        stats.audio_files = this.totalAudioEntries;
        stats.audio_minutes = totalDurationSeconds / 60;
        stats.transcribed = transcribedCount;
        stats.phrases += transcribedCount;
        stats.wayuu_words += transcriptionWords.size;
        stats.total_entries += this.totalAudioEntries;
      }

      return stats;
    } catch (error) {
      this.logger.error(`❌ Error getting dataset stats for ${sourceName}:`, error);
      return {
        total_entries: 0,
        wayuu_words: 0,
        spanish_words: 0,
        audio_minutes: 0,
        phrases: 0,
        transcribed: 0,
        dictionary_entries: 0,
        audio_files: 0,
      };
    }
  }
}

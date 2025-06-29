import { Controller, Post, Body, HttpCode, HttpStatus, Get, Logger } from '@nestjs/common';
import { YoutubeIngestionService } from './youtube-ingestion.service';
import { IngestYoutubeDto } from './dto/ingest-youtube.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('▶️ Youtube Ingestion')
@Controller('youtube-ingestion')
export class YoutubeIngestionController {
  private readonly logger = new Logger(YoutubeIngestionController.name);

  constructor(private readonly youtubeIngestionService: YoutubeIngestionService) {}

  @Post('ingest')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: '📹 Ingerir Video de YouTube',
    description: `
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <h4>🔄 Pipeline de Procesamiento</h4>
        <ol>
          <li><strong>📥 Descarga:</strong> Extrae audio del video usando yt-dlp</li>
          <li><strong>🎤 Transcripción:</strong> Convierte audio a texto usando ASR configurado</li>
          <li><strong>🌐 Traducción:</strong> Traduce wayuunaiki → español automáticamente</li>
        </ol>
      </div>
      
      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <h4>🎤 Estrategias ASR Disponibles</h4>
        <ul>
          <li><strong>Stub ASR:</strong> Mock para desarrollo (sin hardware)</li>
          <li><strong>OpenAI Whisper API:</strong> Cloud-based, alta precisión (~$0.006/min)</li>
          <li><strong>Whisper Local:</strong> Procesamiento local (requiere 2GB+ RAM)</li>
        </ul>
        <p><em>Configura con variables de entorno: ASR_PROVIDER, OPENAI_API_KEY, etc.</em></p>
      </div>
      
      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <h4>⚠️ Límites y Consideraciones</h4>
        <ul>
          <li>Máximo 25MB por archivo (OpenAI API)</li>
          <li>Formatos soportados: MP3, MP4, WAV, etc.</li>
          <li>Tiempo de procesamiento: 30s - 5min según ASR</li>
        </ul>
      </div>
    `,
  })
  @ApiBody({
    description: 'URL del video de YouTube a procesar',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          description: 'URL completa del video de YouTube (soporta videos normales, shorts, y playlist)',
        },
      },
      required: ['url'],
    },
  })
  @ApiResponse({
    status: 202,
    description: '✅ Video agregado a la cola de procesamiento',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Video processing started successfully' },
        data: {
          type: 'object',
          properties: {
            videoId: { type: 'string', example: 'dQw4w9WgXcQ' },
            title: { type: 'string', example: 'Video Title' },
            status: { type: 'string', example: 'downloading' },
            estimatedTime: { type: 'string', example: '2-5 minutes' },
            asrProvider: { type: 'string', example: 'openai' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '❌ URL inválida o error en el procesamiento',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Invalid YouTube URL provided' },
        error: { type: 'string', example: 'URL format not supported' },
      },
    },
  })
  async ingestVideo(@Body() ingestDto: IngestYoutubeDto) {
    this.logger.log(`Received ingestion request for URL: ${ingestDto.url}`);
    
    try {
      await this.youtubeIngestionService.processVideo(ingestDto.url);
      
      return {
        success: true,
        message: 'Video processing started successfully',
        data: {
          url: ingestDto.url,
          status: 'processing',
          estimatedTime: '2-5 minutes',
          asrProvider: process.env.ASR_PROVIDER || 'stub',
        },
      };
    } catch (error) {
      this.logger.error(`Failed to process video: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to start video processing',
        error: error.message,
      };
    }
  }

  @Post('process-pending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🔄 Procesar Videos Pendientes',
    description: `
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <h4>⚡ Procesamiento Batch</h4>
        <p>Este endpoint procesa todos los videos que están en estado <code>pending_translation</code>, 
        aplicando el servicio de traducción wayuu→español automáticamente.</p>
      </div>
      
      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <h4>🎯 Casos de Uso</h4>
        <ul>
          <li>Videos que fallaron en traducción automática</li>
          <li>Procesamiento manual después de transcripción</li>
          <li>Re-procesamiento con nuevas reglas de traducción</li>
          <li>Recuperación después de errores del sistema</li>
        </ul>
      </div>
      
      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <h4>📊 Información de Respuesta</h4>
        <ul>
          <li><strong>processed:</strong> Cantidad de videos procesados</li>
          <li><strong>successful:</strong> Traducciones exitosas</li>
          <li><strong>failed:</strong> Errores en traducción</li>
          <li><strong>results:</strong> Detalles por video</li>
        </ul>
      </div>
    `,
  })
  @ApiResponse({
    status: 200,
    description: '✅ Procesamiento de videos pendientes completado',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Processed 3 pending videos' },
            processed: { type: 'number', example: 3 },
            successful: { type: 'number', example: 2 },
            failed: { type: 'number', example: 1 },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  videoId: { type: 'string', example: 'dQw4w9WgXcQ' },
                  title: { type: 'string', example: 'Video Title' },
                  status: { type: 'string', example: 'completed' },
                  translation: { type: 'string', example: 'spanish translation...' },
                  error: { type: 'string', example: 'Translation failed: ...' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '📭 No hay videos pendientes para procesar',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'No pending videos found' },
            processed: { type: 'number', example: 0 },
            successful: { type: 'number', example: 0 },
            failed: { type: 'number', example: 0 },
            results: { type: 'array', items: {}, example: [] },
          },
        },
      },
    },
  })
  async processPendingTranslations() {
    this.logger.log('Processing pending translations');
    
    const result = await this.youtubeIngestionService.processPendingTranslations();
    
    return {
      success: true,
      data: result,
    };
  }

  @Get('status')
  @ApiOperation({
    summary: '📊 Estado de Videos Procesados',
    description: `
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <h4>📈 Información Proporcionada</h4>
        <ul>
          <li><strong>Total de Videos:</strong> Cantidad total procesada</li>
          <li><strong>Por Estado:</strong> Distribución por estado de procesamiento</li>
          <li><strong>Detalles:</strong> Lista completa con metadatos</li>
          <li><strong>ASR Config:</strong> Configuración actual de transcripción</li>
        </ul>
      </div>
      
      <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <h4>🔄 Estados Posibles</h4>
        <ul>
          <li><strong>downloading:</strong> Descargando audio desde YouTube</li>
          <li><strong>pending_transcription:</strong> Esperando transcripción ASR</li>
          <li><strong>pending_translation:</strong> Esperando traducción wayuu→español</li>
          <li><strong>completed:</strong> Procesamiento completado exitosamente</li>
          <li><strong>failed:</strong> Error en algún paso del pipeline</li>
        </ul>
      </div>
    `,
  })
  @ApiResponse({
    status: 200,
    description: '✅ Estado actual de la base de datos de videos',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 5 },
            byStatus: {
              type: 'object',
              properties: {
                completed: { type: 'number', example: 3 },
                pending_translation: { type: 'number', example: 1 },
                failed: { type: 'number', example: 1 },
              },
            },
            asrConfig: {
              type: 'object',
              properties: {
                provider: { type: 'string', example: 'openai' },
                model: { type: 'string', example: 'whisper-1' },
                language: { type: 'string', example: 'es' },
                fallbackEnabled: { type: 'boolean', example: true },
              },
            },
            videos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  videoId: { type: 'string', example: 'dQw4w9WgXcQ' },
                  title: { type: 'string', example: 'Video Title' },
                  status: { type: 'string', example: 'completed' },
                  createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
                  updatedAt: { type: 'string', example: '2024-01-15T10:35:00Z' },
                  transcription: { type: 'string', example: 'wayuu text...' },
                  translation: { type: 'string', example: 'spanish translation...' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getStatus() {
    this.logger.log('Fetching database status');
    
    const status = this.youtubeIngestionService.getDatabaseStatus();
    const asrConfig = await this.youtubeIngestionService.getAsrConfiguration();
    
    return {
      success: true,
      data: {
        ...status,
        asrConfig,
      },
    };
  }

  @Get('asr-config')
  @ApiOperation({
    summary: '🎤 Configuración ASR Actual',
    description: `
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <h4>🔧 Información de ASR</h4>
        <p>Obtiene la configuración actual del sistema de reconocimiento de voz (ASR) 
        utilizado para transcribir audio de videos de YouTube.</p>
      </div>
      
      <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <h4>📋 Datos Incluidos</h4>
        <ul>
          <li><strong>Provider:</strong> Estrategia ASR activa (stub/openai/whisper)</li>
          <li><strong>Configuration:</strong> Parámetros específicos del proveedor</li>
          <li><strong>Capabilities:</strong> Capacidades y límites</li>
          <li><strong>Status:</strong> Estado de disponibilidad</li>
        </ul>
      </div>
      
      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <h4>⚙️ Variables de Entorno</h4>
        <code>ASR_PROVIDER</code>, <code>OPENAI_API_KEY</code>, <code>WHISPER_MODEL</code>, 
        <code>ASR_LANGUAGE</code>, <code>ASR_ENABLE_FALLBACK</code>
      </div>
    `,
  })
  @ApiResponse({
    status: 200,
    description: '✅ Configuración ASR actual',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            provider: { type: 'string', example: 'openai' },
            configuration: {
              type: 'object',
              properties: {
                model: { type: 'string', example: 'whisper-1' },
                language: { type: 'string', example: 'es' },
                responseFormat: { type: 'string', example: 'text' },
                temperature: { type: 'number', example: 0 },
                fallbackEnabled: { type: 'boolean', example: true },
              },
            },
            capabilities: {
              type: 'object',
              properties: {
                maxFileSize: { type: 'string', example: '25 MB' },
                supportedFormats: { 
                  type: 'array', 
                  items: { type: 'string' },
                  example: ['mp3', 'wav', 'mp4', 'm4a'] 
                },
                estimatedCostPerMinute: { type: 'string', example: '$0.006' },
              },
            },
            status: {
              type: 'object',
              properties: {
                available: { type: 'boolean', example: true },
                lastCheck: { type: 'string', example: '2024-01-15T10:30:00Z' },
                message: { type: 'string', example: 'ASR service is operational' },
              },
            },
          },
        },
      },
    },
  })
  async getAsrConfiguration() {
    this.logger.log('Fetching ASR configuration');
    
    const config = await this.youtubeIngestionService.getAsrConfiguration();
    
    return {
      success: true,
      data: config,
    };
  }
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: [
      'http://localhost:3000', 
      'http://localhost:4000', 
      'http://localhost:4001', 
      'http://localhost:5173', 
      'http://localhost:4200',
      null  // Allow file:// protocol for static HTML frontend
    ],
    credentials: true,
  });

  // Serve static audio files
  app.useStaticAssets(join(__dirname, '..', 'data', 'audio'), {
    prefix: '/api/audio/files/',
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation - Professional configuration
  const config = new DocumentBuilder()
    .setTitle('🌟 Wayuu-Spanish Translator API v2.0')
    .setDescription(`
      <div style="text-align: center; margin-bottom: 30px;">
        <h2>🏛️ Wayuu-Spanish Translation & YouTube Ingestion Platform</h2>
        <p><strong>Preservando la lengua ancestral wayuu a través de la tecnología moderna</strong></p>
        <p><em>Now with YouTube video processing capabilities!</em></p>
      </div>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 15px; color: white; margin: 25px 0;">
        <h3>🎯 Características Principales</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
          <div>
            <h4>🔄 Traducción Core</h4>
            <ul>
              <li>📝 Traducción Bidireccional: Wayuu ↔ Español</li>
              <li>🎵 Audio Nativo: Pronunciación auténtica wayuu</li>
              <li>📚 Diccionario Completo: Dataset Gaxys integrado</li>
              <li>🧠 IA Avanzada: Análisis fonético y lingüístico</li>
            </ul>
          </div>
          <div>
            <h4>📹 YouTube Ingestion (NEW!)</h4>
            <ul>
              <li>🔽 Descarga automática de audio desde YouTube</li>
              <li>🎤 Transcripción automática (ASR)</li>
              <li>🌐 Traducción automática wayuu → español</li>
              <li>📊 Pipeline completo de procesamiento</li>
            </ul>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 25px 0;">
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 12px; border-left: 5px solid #28a745;">
          <h4>🎙️ Audio Processing</h4>
          <p>Pronunciación nativa wayuu<br/>+ Extracción desde YouTube</p>
        </div>
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 12px; border-left: 5px solid #007bff;">
          <h4>📖 Knowledge Base</h4>
          <p>Base de datos completa<br/>+ Videos procesados</p>
        </div>
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 12px; border-left: 5px solid #ffc107;">
          <h4>⚡ Performance</h4>
          <p>Respuestas en milisegundos<br/>+ Procesamiento asíncrono</p>
        </div>
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 12px; border-left: 5px solid #dc3545;">
          <h4>🔄 Workflow</h4>
          <p>Pipeline automático<br/>YouTube → Audio → Texto → Traducción</p>
        </div>
      </div>

      <div style="background: #e3f2fd; padding: 20px; border-radius: 12px; border-left: 5px solid #2196f3; margin: 25px 0;">
        <h4>🚀 Flujo de Trabajo YouTube Ingestion</h4>
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 15px 0;">
          <div style="text-align: center; flex: 1;">
            <div style="background: #2196f3; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">1</div>
            <strong>📹 URL Input</strong><br/>
            <small>YouTube video URL</small>
          </div>
          <div style="color: #2196f3; font-size: 24px;">→</div>
          <div style="text-align: center; flex: 1;">
            <div style="background: #4caf50; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">2</div>
            <strong>🔽 Download</strong><br/>
            <small>Audio extraction</small>
          </div>
          <div style="color: #2196f3; font-size: 24px;">→</div>
          <div style="text-align: center; flex: 1;">
            <div style="background: #ff9800; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">3</div>
            <strong>🎤 Transcribe</strong><br/>
            <small>Speech to text</small>
          </div>
          <div style="color: #2196f3; font-size: 24px;">→</div>
          <div style="text-align: center; flex: 1;">
            <div style="background: #9c27b0; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">4</div>
            <strong>🌐 Translate</strong><br/>
            <small>Wayuu → Español</small>
          </div>
        </div>
      </div>

      <hr style="margin: 30px 0;">
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 12px;">
        <h4>🔗 Enlaces Útiles</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <a href="/api/audio/files" target="_blank" style="text-decoration: none; color: #007bff;">🎵 Archivos de Audio</a>
          <a href="/api/translation/stats" target="_blank" style="text-decoration: none; color: #007bff;">📊 Estadísticas de Traducción</a>
          <a href="/api/youtube-ingestion/status" target="_blank" style="text-decoration: none; color: #007bff;">📹 Estado de Videos</a>
          <a href="https://github.com/your-repo" target="_blank" style="text-decoration: none; color: #007bff;">📖 Documentación GitHub</a>
        </div>
      </div>

      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 5px solid #ffc107; margin: 20px 0;">
        <h4>⚠️ Versión 2.0 - Nuevas Funcionalidades</h4>
        <ul>
          <li><strong>YouTube Ingestion:</strong> Procesamiento automático de videos</li>
          <li><strong>ASR Integration:</strong> Transcripción de audio a texto</li>
          <li><strong>Batch Processing:</strong> Procesamiento de videos pendientes</li>
          <li><strong>Status Monitoring:</strong> Seguimiento del estado de videos</li>
        </ul>
      </div>
    `)
    .setVersion('2.0.0')
    .setContact(
      'Equipo de Desarrollo Wayuu',
      'https://github.com/your-repo',
      'contact@wayuu-translator.com'
    )
    .setLicense('MIT License', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3002/api', 'Servidor de Desarrollo')
    .addServer('https://api.wayuu-translator.com/api', 'Servidor de Producción')
    .addTag('🔄 Translation', 'Endpoints de traducción Wayuu ↔ Español')
    .addTag('▶️ Youtube Ingestion', 'Procesamiento de videos de YouTube (NEW!)')
    .addTag('📚 Datasets', 'Gestión de datasets y diccionarios')
    .addTag('🎵 Audio', 'Recursos de audio y pronunciación')
    .addTag('📊 Statistics', 'Métricas y estadísticas de uso')
    .addTag('🛠️ System', 'Endpoints del sistema y salud')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Custom Swagger options for professional look
  const swaggerOptions = {
    customSiteTitle: '🌟 Wayuu-Spanish Translator API v2.0',
    customCss: `
      .swagger-ui .topbar { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        border-bottom: 3px solid #4a5568;
      }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      .swagger-ui .info .title { 
        color: #2d3748; 
        font-size: 2.8rem; 
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 10px;
      }
      .swagger-ui .info .description { 
        font-size: 1.1rem; 
        line-height: 1.7;
      }
      .swagger-ui .scheme-container { 
        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); 
        border-radius: 15px; 
        padding: 20px; 
        margin: 25px 0;
        box-shadow: 0 6px 12px rgba(0,0,0,0.1);
      }
      .swagger-ui .opblock { 
        border-radius: 10px; 
        box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        margin-bottom: 20px;
        border: 2px solid transparent;
        transition: all 0.3s ease;
      }
      .swagger-ui .opblock:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0,0,0,0.15);
      }
      .swagger-ui .opblock.opblock-get { 
        border-color: #48bb78; 
        background: rgba(72, 187, 120, 0.1);
      }
      .swagger-ui .opblock.opblock-post { 
        border-color: #4299e1; 
        background: rgba(66, 153, 225, 0.1);
      }
      .swagger-ui .opblock.opblock-put { 
        border-color: #ed8936; 
        background: rgba(237, 137, 54, 0.1);
      }
      .swagger-ui .opblock.opblock-delete { 
        border-color: #f56565; 
        background: rgba(245, 101, 101, 0.1);
      }
      .swagger-ui .opblock-tag { 
        font-size: 1.4rem; 
        font-weight: bold;
        color: #2d3748;
        border-bottom: 3px solid #e2e8f0;
        padding-bottom: 15px;
        margin-bottom: 25px;
        background: linear-gradient(90deg, #f7fafc 0%, #edf2f7 100%);
        padding: 15px;
        border-radius: 8px;
      }
      .swagger-ui .btn { 
        border-radius: 8px; 
        font-weight: 600;
        transition: all 0.3s ease;
        padding: 10px 20px;
      }
      .swagger-ui .btn.execute { 
        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); 
        color: white;
        border: none;
      }
      .swagger-ui .btn.execute:hover { 
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(72, 187, 120, 0.4);
      }
      .swagger-ui .response-col_status { 
        font-weight: bold;
        font-size: 1.1rem;
      }
      .swagger-ui .response-col_status.response-col_status-200 { 
        color: #48bb78; 
      }
      .swagger-ui .response-col_status.response-col_status-202 { 
        color: #4299e1; 
      }
      .swagger-ui .response-col_status.response-col_status-400 { 
        color: #f56565; 
      }
      .swagger-ui .response-col_status.response-col_status-500 { 
        color: #e53e3e; 
      }
      .swagger-ui .model-box { 
        background: #f7fafc; 
        border-radius: 10px;
        border: 2px solid #e2e8f0;
        padding: 15px;
      }
      .swagger-ui .model-title { 
        color: #2d3748; 
        font-weight: bold;
        font-size: 1.2rem;
      }
      .swagger-ui .parameter__name { 
        font-weight: bold; 
        color: #4a5568;
        font-size: 1.1rem;
      }
      .swagger-ui .parameter__type { 
        color: #718096; 
        font-style: italic;
      }
      .swagger-ui .info { 
        margin: 40px 0; 
        padding: 30px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.1);
      }
      .swagger-ui .wrapper { 
        max-width: 1400px; 
        margin: 0 auto;
        padding: 0 20px;
      }
      .swagger-ui .information-container { 
        background: white;
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 15px 50px rgba(0,0,0,0.1);
        margin: 30px 0;
      }
    `,
    customJs: `
      // Enhanced interactive features
      console.log('🌟 Wayuu-Spanish Translator API v2.0 Documentation loaded!');
      console.log('📹 New YouTube Ingestion features available!');
      
      // Add enhanced favicon
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌟</text></svg>';
      document.head.appendChild(favicon);
      
      // Add custom styles for better UX
      const style = document.createElement('style');
      style.textContent = \`
        .swagger-ui .opblock-summary-description {
          font-weight: 600;
          color: #4a5568;
        }
        .swagger-ui .opblock-description-wrapper p {
          font-size: 1.05rem;
          line-height: 1.6;
        }
      \`;
      document.head.appendChild(style);
    `,
    swaggerOptions: {
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      docExpansion: 'list',
      displayRequestDuration: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      persistAuthorization: true,
      displayOperationId: false,
      filter: true,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      validatorUrl: null,
    }
  };

  SwaggerModule.setup('api/docs', app, document, swaggerOptions);

  const port = process.env.PORT || 3002;
  await app.listen(port);
  
  console.log(`🚀 Wayuu-Spanish Translator API v2.0 is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation available at: http://localhost:${port}/api/docs`);
  console.log(`🎵 Audio files served at: http://localhost:${port}/api/audio/files/`);
  console.log(`📹 YouTube Ingestion ready for processing wayuunaiki content!`);
  console.log(`✨ Professional Swagger UI v2.0 with enhanced styling and YouTube features loaded!`);
}

bootstrap();
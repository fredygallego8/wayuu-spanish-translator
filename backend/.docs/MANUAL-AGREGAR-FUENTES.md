# 📚 Manual para Agregar Fuentes al Traductor Wayuu-Español

## 🎯 Introducción

Este manual te guía paso a paso para agregar nuevas fuentes de datos wayuu al traductor. El sistema soporta múltiples tipos de fuentes: texto, audio, datasets de Hugging Face, videos de YouTube, y PDFs académicos.

## 🏗️ Arquitectura del Sistema de Fuentes

```
wayuu-spanish-translator/
├── backend/data/sources/          # Fuentes locales
│   ├── orkidea-wayuu-audio/      # Dataset Orkidea (audio + texto)
│   ├── *.pdf                     # Documentos académicos
│   └── *.parquet                 # Datasets procesados
├── backend/data/youtube-audio/    # Audio desde YouTube
└── backend/data/audio/           # Audio de pronunciación
```

## 🔧 Tipos de Fuentes Soportadas

### 1. 📄 **PDFs Académicos**
- **Qué son:** Libros, gramáticas, diccionarios, tesis
- **Formatos:** PDF con texto extraíble
- **Ubicación:** `backend/data/sources/`

### 2. 🎵 **Datasets de Audio**
- **Qué son:** Audio wayuu con transcripciones
- **Formatos:** Parquet, MP3, WAV
- **Ejemplo:** orkidea/palabrero-guc-draft

### 3. 📹 **Videos de YouTube**
- **Qué son:** Videos con contenido wayuu hablado
- **Proceso:** Descarga → Transcripción → Traducción
- **API:** `/api/youtube-ingestion/ingest`

### 4. 🗂️ **Datasets de Hugging Face**
- **Qué son:** Datasets públicos o privados
- **Formatos:** Parquet, JSON, CSV
- **Configuración:** Variables de entorno

## 📝 Proceso Paso a Paso

### 🎵 Agregando Dataset de Hugging Face (Ejemplo: Orkidea)

#### **Paso 1: Identificar el Dataset**
```bash
# Dataset ya agregado como ejemplo
https://huggingface.co/datasets/orkidea/palabrero-guc-draft

# Características:
- 17 archivos de audio wayuu
- Transcripciones en wayuunaiki
- Duración variable (17s - 25s)
- Formato: Parquet con audio embebido
```

#### **Paso 2: Descargar vía API**
```bash
curl -X POST "http://localhost:3002/api/huggingface/fetch-orkidea-dataset" \
     -H "Content-Type: application/json"
```

#### **Paso 3: Verificar Descarga**
```bash
ls -la backend/data/sources/orkidea-wayuu-audio/
# Debería mostrar: train-00000-of-00001-*.parquet
```

#### **Paso 4: Usar en Traducciones**
El dataset se integra automáticamente al sistema de traducción.

### 📄 Agregando PDFs Académicos

#### **Paso 1: Copiar Archivo**
```bash
cp "ruta/del/archivo.pdf" backend/data/sources/
```

#### **Paso 2: Verificar Integración**
```bash
curl "http://localhost:3002/api/huggingface/status"
```

### 📹 Agregando Videos de YouTube

#### **Paso 1: Usar API de Ingestion**
```bash
curl -X POST "http://localhost:3002/api/youtube-ingestion/ingest" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://www.youtube.com/watch?v=VIDEO_ID"}'
```

#### **Paso 2: Monitorear Proceso**
```bash
curl "http://localhost:3002/api/youtube-ingestion/status"
```

## 🛠️ Configuración Avanzada

### Variables de Entorno

```bash
# backend/.env
PORT=3002

# Hugging Face (opcional - para datasets privados)
HUGGING_FACE_REPO_ID=tu-repo/dataset-privado
HUGGING_FACE_TOKEN=hf_tu_token_aqui

# OpenAI (opcional - para transcripción avanzada)
OPENAI_API_KEY=sk-tu_api_key_aqui

# YouTube Ingestion
YOUTUBE_AUDIO_DIR=/ruta/personalizada/audio
ASR_STRATEGY=whisper-local  # o 'openai-whisper-api', 'stub'
```

### Configuración de ASR (Reconocimiento de Voz)

```bash
# Ver configuración actual
curl "http://localhost:3002/api/youtube-ingestion/asr-config"

# Estrategias disponibles:
# 1. whisper-local    - Whisper en local (gratis)
# 2. openai-whisper-api - OpenAI API (pago)
# 3. stub             - Mock para testing
```

## 📊 Agregar Nuevos Datasets de Hugging Face

### **Paso 1: Identificar Dataset**
1. Busca en https://huggingface.co/datasets
2. Filtra por:
   - Idioma: wayuu, wayuunaiki, guajiro
   - Modalidad: audio, text
   - Licencia: abierta preferiblemente

### **Paso 2: Modificar el Código**

En `backend/src/huggingface/huggingface.service.ts`:

```typescript
// Agregar nuevo método para tu dataset
async fetchTuNuevoDataset() {
  try {
    this.logger.log('🎵 Fetching Tu Nuevo Dataset...');
    
    const repoName = 'organizacion/tu-dataset-wayuu';
    const datasetDir = path.join(this.sourcesDir, 'tu-dataset-wayuu');
    await this.ensureDirectoryExists(datasetDir);

    const filesIterator = listFiles({
      repo: { type: 'dataset', name: repoName },
    });
    
    const files = [];
    for await (const file of filesIterator) {
      if (file.path.endsWith('.parquet') || file.path.endsWith('.json')) {
        files.push(file.path);
      }
    }

    // ... resto del código similar a fetchOrkideaDataset
    
    return { 
      message: 'Tu nuevo dataset descargado exitosamente.',
      files: files.length,
      location: datasetDir
    };
  } catch (error) {
    this.logger.error('❌ Failed to fetch tu dataset', error.stack);
    throw error;
  }
}
```

### **Paso 3: Agregar Endpoint**

En `backend/src/huggingface/huggingface.controller.ts`:

```typescript
@Post('fetch-tu-dataset')
@ApiOperation({ 
    summary: '🎵 Descargar Tu Dataset Wayuu',
    description: 'Descarga el dataset organizacion/tu-dataset-wayuu'
})
async fetchTuDataset() {
    return await this.huggingfaceService.fetchTuNuevoDataset();
}
```

## 🔍 Verificación y Testing

### **Verificar Estado del Sistema**
```bash
# Estado general
curl "http://localhost:3002/api/huggingface/status"

# Estado de YouTube ingestion
curl "http://localhost:3002/api/youtube-ingestion/status"

# Estadísticas de traducción
curl "http://localhost:3002/api/translation/stats"
```

### **Probar Nuevas Fuentes**
```bash
# Traducir usando nuevas fuentes
curl -X POST "http://localhost:3002/api/translation/translate" \
     -H "Content-Type: application/json" \
     -d '{
       "text": "Jamüshala tü wayuu",
       "sourceLanguage": "wayuu",
       "targetLanguage": "spanish"
     }'
```

## 📋 Checklist de Nueva Fuente

- [ ] **Identificar** tipo de fuente (PDF, audio, dataset, video)
- [ ] **Verificar** calidad y relevancia del contenido
- [ ] **Configurar** variables de entorno si es necesario
- [ ] **Implementar** método de descarga/procesamiento
- [ ] **Agregar** endpoint API correspondiente
- [ ] **Probar** descarga y integración
- [ ] **Verificar** mejora en traducciones
- [ ] **Documentar** en este manual

## 🚨 Solución de Problemas

### **Error: "Hugging Face not configured"**
```bash
# Solución: El servicio funcionará en modo offline
# Las fuentes locales seguirán funcionando
echo "✅ Normal - sistema funciona sin configuración HF"
```

### **Error: "YouTube video failed to download"**
```bash
# Verificar URL
curl -X POST "http://localhost:3002/api/youtube-ingestion/ingest" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://www.youtube.com/watch?v=VALID_ID"}'

# Verificar logs
tail -f backend/logs/youtube-ingestion.log
```

### **Error: "ASR transcription failed"**
```bash
# Cambiar a modo stub para testing
echo 'ASR_STRATEGY=stub' >> backend/.env

# Reiniciar servidor
pnpm start:dev
```

## 🔗 Recursos Útiles

### **Fuentes Recomendadas**

1. **Datasets de Hugging Face:**
   - [`orkidea/palabrero-guc-draft`](https://huggingface.co/datasets/orkidea/palabrero-guc-draft) ✅ Ya integrado
   - Buscar más en: https://huggingface.co/datasets?language=language:guc

2. **PDFs Académicos:**
   - Manual de la lengua wayuu (Álvarez, José)
   - Wayuunkeera - Manual de wayuu
   - Diccionarios SIL International

3. **Videos de YouTube:**
   - Canales wayuu educativos
   - Videos de cultura y tradición
   - Contenido lingüístico wayuu

### **APIs y Endpoints**

- **Traducción:** `POST /api/translation/translate`
- **YouTube:** `POST /api/youtube-ingestion/ingest`
- **Datasets:** `POST /api/huggingface/fetch-*`
- **Estado:** `GET /api/*/status`
- **Documentación:** `http://localhost:3002/api/docs`

---

## 🎯 Conclusión

Este sistema es extensible y diseñado para agregar fácilmente nuevas fuentes wayuu. Cada nueva fuente mejora la calidad y cobertura del traductor, preservando y digitalizando la lengua wayuu.

**¿Tienes una nueva fuente?** ¡Síguelos pasos de este manual y contribuye al proyecto!

---

**📞 Contacto:** Para dudas o contribuciones, revisa la documentación API en `/api/docs` 
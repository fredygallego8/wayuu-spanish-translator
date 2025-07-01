# Rate Limiting y Anti-Bot Detection - YouTube Ingestion

## 🎯 Propósito

Este documento describe las mejoras implementadas en el sistema de ingesta de YouTube para evitar la detección de bot y reducir las probabilidades de bloqueo por parte de YouTube.

## 🚀 Características Implementadas

### 1. **Rate Limiting Inteligente**

#### Configuración de Delays
```typescript
private readonly minDelayBetweenRequests = 30000; // 30 segundos mínimo
private readonly maxDelayBetweenRequests = 90000; // 90 segundos máximo
```

#### Pausas Aleatorias
- **Delay mínimo**: 30 segundos entre solicitudes
- **Delay máximo**: 90 segundos entre solicitudes
- **Randomización**: Cada pausa es aleatoria dentro del rango para simular comportamiento humano

### 2. **Doble Rate Limiting**

El sistema aplica pausas en **dos momentos críticos**:

1. **Antes de obtener metadatos**: Primera solicitud a YouTube
2. **Antes de descargar audio**: Segunda solicitud a YouTube

```typescript
// Primera pausa - metadatos
await this.waitForRateLimit();
const metadataCmd = `yt-dlp --dump-json ...`;

// Segunda pausa - descarga
await this.waitForRateLimit();  
const downloadCmd = `yt-dlp --extract-audio ...`;
```

### 3. **User Agent Realista**

Uso de User Agent completo de Chrome real:
```bash
"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
```

### 4. **Sleep Intervals en yt-dlp**

#### Para Metadatos:
```bash
--sleep-interval 5 --max-sleep-interval 15
```

#### Para Descarga de Audio:
```bash
--sleep-interval 10 --max-sleep-interval 30
```

### 5. **Logging y Monitoreo**

#### Rate Limit Status
```typescript
🔍 Rate limit status: Last request 45s ago, Total requests: 3
```

#### Pausas Activas
```typescript
🕐 Rate limiting: Waiting 67s to avoid bot detection (request #4)
⏳ Adding pause before audio download for fYUjs_dbnjs
```

## 📊 Comportamiento del Sistema

### Flujo Temporal para Un Video

```
T+0s:   🔍 Rate limit status: Last request 0s ago, Total requests: 0
T+0s:   🕐 Rate limiting: Waiting 45s to avoid bot detection (request #1)
T+45s:  📥 Ejecutando: yt-dlp --dump-json ... (con sleep 5-15s internos)
T+65s:  ⏳ Adding pause before audio download for videoId
T+65s:  🕐 Rate limiting: Waiting 72s to avoid bot detection (request #2)
T+137s: 📥 Ejecutando: yt-dlp --extract-audio ... (con sleep 10-30s internos)
T+180s: ✅ Video procesado completamente
```

### Flujo para Múltiples Videos

```
Video 1: T+0s    -> T+180s  (3 minutos total)
Video 2: T+180s  -> T+420s  (4 minutos desde T+180s)
Video 3: T+420s  -> T+720s  (5 minutos desde T+420s)
```

## 🛡️ Estrategias Anti-Bot

### 1. **Delays Variables**
- Nunca usa el mismo delay dos veces seguidas
- Rango amplio (30-90s) para máxima variabilidad

### 2. **Headers Realistas**
- User-Agent de navegador real
- Referer apropiado: `https://www.youtube.com/`

### 3. **Comportamiento Humano**
- Pausas antes de cada acción importante
- Sleep intervals internos en yt-dlp
- Logging detallado para monitoreo

### 4. **Rate Limit Progresivo**
- Contador de requests para análisis
- Tiempo desde última request
- Logs detallados de estado

## 📈 Beneficios Esperados

### ✅ Reducción de Errores 403 Forbidden
- Menor probabilidad de bloqueo por YouTube
- Requests más espaciadas en el tiempo

### ✅ Comportamiento más "Humano"
- Pausas variables y realistas
- Headers de navegador real
- Sleep intervals internos

### ✅ Mejor Monitoreo
- Logs detallados de rate limiting
- Contador de requests
- Estado temporal entre requests

### ✅ Escalabilidad Controlada
- Sistema preparado para procesar múltiples videos
- Garantía de pausas entre cada video

## 🔧 Configuración Avanzada

### Modificar Delays
```typescript
// En youtube-ingestion.service.ts
private readonly minDelayBetweenRequests = 45000; // 45 segundos
private readonly maxDelayBetweenRequests = 120000; // 2 minutos
```

### Verificar Estado
```bash
# Logs del backend
tail -f backend.log | grep "Rate limiting\|Rate limit status"
```

### Monitoreo de Requests
```bash
# Ver todas las pausas aplicadas
tail -f backend.log | grep "🕐\|⏳"
```

## 🎯 Casos de Uso

### Videos Individuales
- Pausa automática de 30-90s antes de procesar
- Doble rate limiting (metadatos + audio)
- Logs detallados de progreso

### Procesamiento en Lote
- Cada video respeta el rate limiting individual
- Tiempo total = N_videos × (3-5 minutos promedio)
- Escalable para múltiples videos sin riesgo

### Recuperación de Errores
- Si falla por rate limiting, el siguiente video esperará automáticamente
- No acumula errores por requests demasiado rápidas

## 📝 Logs de Ejemplo

```
[YoutubeIngestionService] 🔍 Rate limit status: Last request 0s ago, Total requests: 0
[YoutubeIngestionService] 🕐 Rate limiting: Waiting 67s to avoid bot detection (request #1)
[YoutubeIngestionService] Processing video with yt-dlp: https://www.youtube.com/watch?v=fYUjs_dbnjs
[YoutubeIngestionService] ⏳ Adding pause before audio download for fYUjs_dbnjs
[YoutubeIngestionService] 🕐 Rate limiting: Waiting 43s to avoid bot detection (request #2)
[YoutubeIngestionService] Successfully downloaded audio to /path/to/fYUjs_dbnjs.mp3
```

## 🚨 Importante

- **No desactivar**: El rate limiting es esencial para evitar bloqueos
- **Monitorear logs**: Verificar que las pausas se están aplicando
- **Paciencia**: El procesamiento será más lento pero más confiable
- **Escalabilidad**: Sistema diseñado para crecimiento futuro

---

**Fecha de implementación**: $(date)  
**Versión**: 1.0  
**Estado**: ✅ Activo y funcional 
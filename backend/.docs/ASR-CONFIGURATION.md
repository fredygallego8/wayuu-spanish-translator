# 🎤 ASR Configuration Guide - Wayuu-Spanish Translator v2.0

## 📋 Overview

El sistema soporta múltiples estrategias de ASR (Automatic Speech Recognition) para transcribir audio de videos de YouTube a texto wayuunaiki. Cada opción tiene diferentes requerimientos de hardware y costos.

## ⚙️ Opciones de ASR Disponibles

### 1. 🔧 **Stub ASR** (Desarrollo)
```bash
ASR_PROVIDER=stub
```

**Características:**
- ✅ Sin configuración adicional
- ✅ Ideal para desarrollo y testing
- ❌ No produce transcripciones reales

**Requerimientos de Hardware:**
- **RAM**: Cualquier cantidad
- **Storage**: Ninguno
- **Network**: No requerido
- **Costo**: Gratis

---

### 2. ☁️ **OpenAI Whisper API** (Recomendado para Producción)
```bash
ASR_PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
ASR_LANGUAGE=es
ASR_RESPONSE_FORMAT=text
ASR_TEMPERATURE=0
```

**Características:**
- ✅ Alta precisión y calidad
- ✅ Sin requerimientos de hardware local
- ✅ Mantenimiento cero
- ✅ Soporte para múltiples idiomas
- ❌ Requiere conexión a internet
- ❌ Costo por uso

**Requerimientos de Hardware:**
- **RAM**: Mínima (procesamiento en la nube)
- **Storage**: Ninguno adicional
- **Network**: Conexión estable a internet
- **Costo**: ~$0.006 por minuto (~$0.36 por hora)

**Límites:**
- Máximo 25MB por archivo
- Formatos soportados: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm

---

### 3. 🖥️ **Whisper Local** (Mejor Control)
```bash
ASR_PROVIDER=whisper
WHISPER_MODEL=small
ASR_LANGUAGE=es
ASR_ENABLE_FALLBACK=true
OPENAI_API_KEY=your_fallback_key_here
```

**Modelos Disponibles:**

| Modelo | Tamaño | RAM Req. | Velocidad | Precisión | Uso Recomendado |
|--------|--------|----------|-----------|-----------|-----------------|
| `tiny` | 39 MB | 1 GB | Muy Rápida | Básica | Testing rápido |
| `base` | 74 MB | 1 GB | Rápida | Buena | Desarrollo |
| `small` | 244 MB | 2 GB | Media | Muy Buena | **Producción Balanceada** |
| `medium` | 769 MB | 5 GB | Lenta | Excelente | Alta calidad |
| `large` | 1550 MB | 10 GB | Muy Lenta | Superior | Máxima precisión |

**Requerimientos de Hardware por Modelo:**

#### Whisper Small (Recomendado)
- **RAM**: 2GB+ disponible
- **Storage**: 244MB para el modelo
- **CPU**: Multi-core moderno (Intel i5/AMD Ryzen 5+)
- **GPU**: Opcional (CUDA para aceleración)
- **Network**: Solo para fallback
- **Costo**: Gratis después de la instalación

#### Whisper Large (Máxima Calidad)
- **RAM**: 10GB+ disponible
- **Storage**: 1550MB para el modelo
- **CPU**: Alto rendimiento (Intel i7/AMD Ryzen 7+)
- **GPU**: Recomendada (NVIDIA GTX 1660+)
- **Network**: Solo para fallback
- **Costo**: Gratis después de la instalación

## 🚀 Instalación y Configuración

### Opción 1: OpenAI Whisper API (Más Fácil)

1. **Obtener API Key:**
   ```bash
   # Visita: https://platform.openai.com/api-keys
   # Crea una nueva API key
   ```

2. **Configurar Variables de Entorno:**
   ```bash
   export ASR_PROVIDER=openai
   export OPENAI_API_KEY=sk-your-actual-api-key-here
   export ASR_LANGUAGE=es
   ```

3. **Verificar Configuración:**
   ```bash
   # El sistema detectará automáticamente la configuración
   # No requiere instalación adicional
   ```

### Opción 2: Whisper Local

1. **Instalar Python y pip:**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install python3 python3-pip

   # macOS
   brew install python

   # Windows: Descargar desde python.org
   ```

2. **Instalar OpenAI Whisper:**
   ```bash
   pip install openai-whisper
   ```

3. **Instalar Aceleración GPU (Opcional):**
   ```bash
   # Para NVIDIA GPUs
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   ```

4. **Verificar Instalación:**
   ```bash
   whisper --help
   # Debería mostrar las opciones de Whisper
   ```

5. **Configurar Variables de Entorno:**
   ```bash
   export ASR_PROVIDER=whisper
   export WHISPER_MODEL=small
   export ASR_LANGUAGE=es
   export ASR_ENABLE_FALLBACK=true
   export OPENAI_API_KEY=sk-your-fallback-key-here  # Opcional para fallback
   ```

## 📊 Comparación de Rendimiento

### Tiempo de Procesamiento (Video de 1 minuto)

| Estrategia | Hardware | Tiempo | Costo | Precisión |
|------------|----------|--------|-------|-----------|
| Stub | Cualquiera | Instantáneo | $0 | N/A |
| OpenAI API | Mínimo | 10-30s | $0.006 | 95%+ |
| Whisper Tiny | 1GB RAM | 30s | $0 | 70% |
| Whisper Small | 2GB RAM | 60s | $0 | 85% |
| Whisper Large | 10GB RAM | 180s | $0 | 95%+ |

### Recomendaciones por Escenario

#### 🏢 **Desarrollo/Testing**
```bash
ASR_PROVIDER=stub
```
- Sin configuración
- Respuesta inmediata
- Ideal para probar el pipeline

#### 🌐 **Producción con Presupuesto**
```bash
ASR_PROVIDER=openai
OPENAI_API_KEY=sk-...
```
- Configuración mínima
- Alta calidad
- Costo predecible (~$0.36/hora)

#### 🖥️ **Producción Auto-hospedada**
```bash
ASR_PROVIDER=whisper
WHISPER_MODEL=small
ASR_ENABLE_FALLBACK=true
```
- Control total
- Sin costo por uso
- Requiere hardware dedicado

#### 🎯 **Máxima Calidad**
```bash
ASR_PROVIDER=whisper
WHISPER_MODEL=large
ASR_ENABLE_FALLBACK=true
```
- Mejor precisión posible
- Requiere hardware potente
- Ideal para contenido crítico

## 🔧 Configuración Avanzada

### Variables de Entorno Completas

```bash
# ASR Provider
ASR_PROVIDER=openai  # stub | openai | whisper

# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here
ASR_LANGUAGE=es  # es | auto | en | etc.
ASR_RESPONSE_FORMAT=text  # text | json | srt | vtt
ASR_TEMPERATURE=0  # 0.0-1.0

# Whisper Local Configuration
WHISPER_MODEL=small  # tiny | base | small | medium | large
ASR_ENABLE_FALLBACK=true  # true | false

# Processing Limits
MAX_AUDIO_FILE_SIZE=25  # MB
PROCESSING_TIMEOUT=300  # seconds
```

### Optimización de Rendimiento

#### Para Whisper Local:
```bash
# Usar GPU si está disponible
export CUDA_VISIBLE_DEVICES=0

# Aumentar prioridad del proceso
nice -n -10 pnpm run start:dev

# Monitorear uso de recursos
htop  # CPU/RAM
nvidia-smi  # GPU (si aplica)
```

## 🐛 Solución de Problemas

### Error: "Whisper not found"
```bash
# Verificar instalación
which whisper
pip show openai-whisper

# Reinstalar si es necesario
pip uninstall openai-whisper
pip install openai-whisper
```

### Error: "OpenAI API key not found"
```bash
# Verificar variable de entorno
echo $OPENAI_API_KEY

# Configurar correctamente
export OPENAI_API_KEY=sk-your-actual-key
```

### Error: "Out of memory"
```bash
# Cambiar a modelo más pequeño
export WHISPER_MODEL=tiny

# O usar API en la nube
export ASR_PROVIDER=openai
```

### Error: "File too large"
```bash
# Para OpenAI API (límite 25MB)
# Comprimir audio antes de procesar
ffmpeg -i input.mp3 -b:a 64k output.mp3
```

## 📈 Monitoreo y Métricas

### Logs de ASR
```bash
# Ver logs en tiempo real
tail -f logs/application.log | grep ASR

# Filtrar por errores
tail -f logs/application.log | grep "ERROR.*ASR"
```

### Métricas de Rendimiento
- Tiempo de transcripción por minuto de audio
- Tasa de éxito/fallo
- Uso de recursos (CPU/RAM/GPU)
- Costos de API (para OpenAI)

## 🔄 Migración entre Estrategias

### De Stub a OpenAI API:
```bash
# 1. Obtener API key
# 2. Configurar variables
export ASR_PROVIDER=openai
export OPENAI_API_KEY=sk-...

# 3. Reiniciar servicio
pnpm run start:dev
```

### De OpenAI API a Whisper Local:
```bash
# 1. Instalar Whisper
pip install openai-whisper

# 2. Configurar variables
export ASR_PROVIDER=whisper
export WHISPER_MODEL=small
export ASR_ENABLE_FALLBACK=true

# 3. Reiniciar servicio
pnpm run start:dev
```

## 💡 Consejos y Mejores Prácticas

1. **Empezar con OpenAI API** para validar el sistema
2. **Monitorear costos** si usas API en producción
3. **Usar fallback** siempre que sea posible
4. **Testear con audio real** de wayuunaiki
5. **Optimizar calidad de audio** antes de transcribir
6. **Configurar límites** de tiempo y tamaño de archivo
7. **Implementar retry logic** para APIs externas
8. **Cachear resultados** para evitar re-procesamiento

---

## 🆘 Soporte

Si encuentras problemas con la configuración de ASR:

1. Revisa los logs del sistema
2. Verifica las variables de entorno
3. Consulta la documentación oficial de Whisper
4. Abre un issue en el repositorio del proyecto

**¡El sistema está diseñado para ser robusto y funcionar con cualquier configuración de hardware!** 
# 🔑 Configuración de Hugging Face API Key

## 🚀 Pasos para Configurar la API Key

### 1. Obtener tu Token de Hugging Face
- Ve a: https://huggingface.co/settings/tokens
- Crea un nuevo token (tipo "Read" es suficiente)
- Copia tu token (debe empezar con "hf_")

### 2. Crear archivo .env en backend/
```bash
cd backend
touch .env
```

### 3. Agregar tu API Key al archivo .env
```bash
# Abre el archivo .env y agrega:
HUGGINGFACE_API_KEY=hf_tu_token_aqui
```

### 4. Variables de Entorno Alternativas
El backend acepta cualquiera de estas variables:
- `HUGGINGFACE_API_KEY`
- `HUGGING_FACE_TOKEN`
- `HF_TOKEN`

### 5. Configuración para Exportar en Terminal
```bash
# Método 1: Solo para la sesión actual
export HUGGINGFACE_API_KEY="hf_tu_token_aqui"

# Método 2: Permanente (agregar al ~/.bashrc)
echo 'export HUGGINGFACE_API_KEY="hf_tu_token_aqui"' >> ~/.bashrc
source ~/.bashrc
```

### 6. Verificar Configuración
```bash
# Verificar que la variable está configurada
echo $HUGGINGFACE_API_KEY

# Reiniciar el backend para aplicar cambios
cd backend
pnpm run start:dev
```

## 🎯 Funcionalidades que se Habilitarán

Una vez configurada la API key, tendrás acceso a:

### NLLB Translation (Wayuu ↔ Español)
- Traducciones directas sin pivot por inglés
- Soporte nativo para Wayuu (guc_Latn)
- 3-5x mejor calidad que sistemas actuales
- Endpoints: `/api/nllb/translate/*`

### Datasets de Hugging Face
- Descarga automática de diccionarios Wayuu
- Acceso a corpus paralelos
- Datasets de audio wayuu
- Endpoints: `/api/huggingface/*`

### Dashboard Mejorado
- Métricas en tiempo real
- Estadísticas de uso de NLLB
- Monitoreo de traducciones

## 🛠️ Verificación de Funcionamiento

### 1. Verificar Estado del Servicio
```bash
curl http://localhost:3002/api/nllb/service/info
```

### 2. Probar Traducción Demo
```bash
curl -X POST http://localhost:3002/api/nllb/translate/demo \
  -H "Content-Type: application/json" \
  -d '{"text": "Hola mundo", "sourceLang": "spanish", "targetLang": "wayuu"}'
```

### 3. Health Check
```bash
curl http://localhost:3002/api/nllb/service/health
```

## 🔒 Seguridad

- ✅ Nunca compartas tu API key en código público
- ✅ Usa variables de entorno, no hardcodes
- ✅ El archivo .env está en .gitignore automáticamente
- ✅ Tokens de solo lectura son suficientes para esta aplicación 
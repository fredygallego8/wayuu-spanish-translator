# Wayuu-Spanish Translator / Traductor Wayuu-Español

A web-based translator between Wayuu (Wayuunaiki) and Spanish languages, built with NestJS backend and vanilla JavaScript frontend. The translator uses the [Gaxys/wayuu_spa_dict](https://huggingface.co/datasets/Gaxys/wayuu_spa_dict) dataset from Hugging Face.

## Features / Características

### English
- **Bidirectional Translation**: Translate from Wayuu to Spanish and vice versa
- **Exact & Fuzzy Matching**: Advanced text matching algorithms for better translation accuracy
- **Alternative Suggestions**: Multiple translation options when available
- **Confidence Scoring**: Translation confidence indicators
- **Dictionary Statistics**: Real-time dataset information
- **Modern UI**: Clean, responsive interface with Tailwind CSS
- **RESTful API**: Well-documented API endpoints with Swagger
- **Real-time Translation**: Instant translation with loading indicators

### Español
- **Traducción Bidireccional**: Traduce de Wayuu a Español y viceversa
- **Coincidencia Exacta y Difusa**: Algoritmos avanzados de coincidencia de texto para mayor precisión
- **Sugerencias Alternativas**: Múltiples opciones de traducción cuando están disponibles
- **Puntuación de Confianza**: Indicadores de confianza de la traducción
- **Estadísticas del Diccionario**: Información del conjunto de datos en tiempo real
- **Interfaz Moderna**: Interfaz limpia y responsiva con Tailwind CSS
- **API RESTful**: Endpoints de API bien documentados con Swagger
- **Traducción en Tiempo Real**: Traducción instantánea con indicadores de carga

## Technology Stack / Stack Tecnológico

- **Backend**: NestJS, TypeScript, Axios
- **Frontend**: HTML5, JavaScript (ES6+), Tailwind CSS
- **Data Source**: Hugging Face Datasets API
- **Documentation**: Swagger/OpenAPI
- **Development**: Hot reload, CORS enabled

## Prerequisites / Prerrequisitos

- Node.js 16+ and pnpm
- Python 3.x (for serving frontend)

## Quick Start / Inicio Rápido

### 1. Clone the repository / Clonar el repositorio
```bash
git clone <repository-url>
cd wayuu-spanish-translator
```

### 2. Install backend dependencies / Instalar dependencias del backend
```bash
cd backend
pnpm install
```

### 3. Start the backend / Iniciar el backend
```bash
pnpm run start:dev
```
The backend will be available at `http://localhost:3001`
API documentation at `http://localhost:3001/api/docs`

### 4. Start the frontend / Iniciar el frontend
```bash
cd ../frontend
python3 -m http.server 3000
```
The frontend will be available at `http://localhost:3000`

## API Documentation / Documentación de la API

### Translation Endpoints

#### POST `/api/translation/translate`
Translate text between Wayuu and Spanish.

**Request Body:**
```json
{
  "text": "aa",
  "direction": "WAYUU_TO_SPANISH",
  "preferredDataset": "Gaxys/wayuu_spa_dict"
}
```

**Response:**
```json
{
  "originalText": "aa",
  "translatedText": "sí",
  "direction": "WAYUU_TO_SPANISH",
  "confidence": 1.0,
  "sourceDataset": "Gaxys/wayuu_spa_dict",
  "alternatives": [],
  "contextInfo": "Found 1 possible translations"
}
```

#### GET `/api/translation/health`
Check translation service health status.

#### GET `/api/translation/datasets`
Get available datasets information.

### Dataset Endpoints

#### GET `/api/datasets`
Get comprehensive dataset information.

**Response:**
```json
{
  "success": true,
  "data": {
    "datasets": [
      {
        "name": "Gaxys/wayuu_spa_dict",
        "description": "Wayuu-Spanish dictionary with over 2,000 entries",
        "entries": 2183,
        "loaded": true,
        "source": "https://huggingface.co/datasets/Gaxys/wayuu_spa_dict"
      }
    ],
    "totalEntries": 2183,
    "status": "loaded"
  }
}
```

#### GET `/api/datasets/stats`
Get detailed dictionary statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEntries": 2183,
    "uniqueWayuuWords": 1876,
    "uniqueSpanishWords": 3241,
    "averageSpanishWordsPerEntry": 1.8
  }
}
```

## Translation Directions / Direcciones de Traducción

- `WAYUU_TO_SPANISH`: Wayuu → Spanish / Wayuu → Español
- `SPANISH_TO_WAYUU`: Spanish → Wayuu / Español → Wayuu

## Dictionary Information / Información del Diccionario

The translator uses the **Gaxys/wayuu_spa_dict** dataset from Hugging Face, which contains:
- **2,183 dictionary entries**
- **Wayuu language** (ISO code: `guc`)
- **Spanish language** (ISO code: `spa`)
- **Multiple meanings** per word when applicable

### Sample Entries / Entradas de Ejemplo
- `aa` → `sí` (yes)
- `aainjaa` → `hacer, elaborar fabricar, construir` (to do, make, build)
- `aanükü` → `boca` (mouth)
- `achon` → `hijo -ja, cría, fruto fruta` (child, offspring, fruit)

## Development / Desarrollo

### Backend Development / Desarrollo del Backend
```bash
cd backend
pnpm run start:dev     # Start development server
pnpm run build         # Build for production
pnpm run test          # Run tests
pnpm run lint          # Lint code
```

### Project Structure / Estructura del Proyecto
```
wayuu-spanish-translator/
├── backend/
│   ├── src/
│   │   ├── datasets/          # Dataset service and controller
│   │   ├── translation/       # Translation service and controller
│   │   ├── common/           # Shared utilities
│   │   ├── app.module.ts     # Main application module
│   │   └── main.ts           # Application entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── index.html            # Main HTML file
│   └── script.js             # Frontend JavaScript
└── README.md
```

## Configuration / Configuración

### Backend Environment Variables / Variables de Entorno del Backend
Create a `.env` file in the `backend` directory:

```env
PORT=3001
NODE_ENV=development
API_PREFIX=api
FRONTEND_URL=http://localhost:3000
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

## Features in Detail / Características Detalladas

### Translation Algorithm / Algoritmo de Traducción
1. **Exact Match**: First attempts to find exact matches in the dictionary
2. **Fuzzy Match**: If no exact match, uses Levenshtein distance for similar words
3. **Confidence Scoring**: Provides confidence levels based on match quality
4. **Alternative Suggestions**: Shows multiple translation options when available

### Error Handling / Manejo de Errores
- **Network Errors**: Graceful handling of API failures
- **Invalid Input**: Validation of translation requests
- **Fallback Responses**: Informative messages when translations aren't found
- **Loading States**: User feedback during translation processes

### Performance / Rendimiento
- **In-Memory Dictionary**: Fast lookups with cached dataset
- **Efficient Algorithms**: Optimized string matching algorithms
- **Rate Limiting**: Protection against API abuse
- **CORS Enabled**: Secure cross-origin requests

## Contributing / Contribuir

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Data Source / Fuente de Datos

This project uses the [Gaxys/wayuu_spa_dict](https://huggingface.co/datasets/Gaxys/wayuu_spa_dict) dataset from Hugging Face. The dataset contains Wayuu-Spanish translation pairs and is automatically loaded when the application starts.

## License / Licencia

MIT License - see LICENSE file for details.

## Support / Soporte

For issues, questions, or contributions, please open an issue in the GitHub repository.

---

**Wayuu Culture Note / Nota Cultural Wayuu**: 
The Wayuu people are indigenous to the La Guajira Peninsula of northern Colombia and northwest Venezuela. Wayuunaiki (also called Guajiro) is their native language, and this translator aims to help preserve and promote this important cultural heritage.

Los wayuu son indígenas de la Península de La Guajira en el norte de Colombia y noroeste de Venezuela. El wayuunaiki (también llamado guajiro) es su idioma nativo, y este traductor tiene como objetivo ayudar a preservar y promover este importante patrimonio cultural.
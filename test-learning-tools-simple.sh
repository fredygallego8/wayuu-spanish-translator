#!/bin/bash

echo "🚀 Verificación Simple de Learning Tools"
echo "========================================"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar resultados
show_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

# Función para pausar
pause() {
    echo -e "${YELLOW}⏸️  Presiona Enter para continuar...${NC}"
    read -r
}

echo "🔧 1. Verificando Backend (puerto 3002)..."
curl -s http://localhost:3002/api/metrics/json > /dev/null
show_result "Backend NestJS responde"

echo ""
echo "🔧 2. Verificando Frontend (puerto 4001)..."
curl -s http://localhost:4001 > /dev/null
show_result "Frontend Next.js responde"

echo ""
echo "🔧 3. Verificando API de Diccionario..."
curl -s "http://localhost:3002/api/datasets/dictionary/search?query=wayuu" > /tmp/dict_test.json
if [ -s /tmp/dict_test.json ]; then
    DICT_COUNT=$(jq -r '.results | length' /tmp/dict_test.json 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ API Diccionario responde: $DICT_COUNT entradas${NC}"
else
    echo -e "${RED}❌ API Diccionario no responde${NC}"
fi

echo ""
echo "🔧 4. Verificando API de Audio..."
curl -s -I "http://localhost:3002/api/audio/files/audio_000.wav" | grep "200 OK" > /dev/null
show_result "API Audio responde (audio_000.wav)"

echo ""
echo "🔧 5. Verificando Métricas del Dataset..."
curl -s http://localhost:3002/api/metrics/json > /tmp/metrics.json
if [ -s /tmp/metrics.json ]; then
    DICT_COUNT=$(jq -r '.datasets.dictionary.count' /tmp/metrics.json 2>/dev/null || echo "0")
    AUDIO_COUNT=$(jq -r '.datasets.audio.count' /tmp/metrics.json 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ Métricas: $DICT_COUNT diccionario, $AUDIO_COUNT audio${NC}"
else
    echo -e "${RED}❌ Métricas no disponibles${NC}"
fi

echo ""
echo "📱 6. Probando URLs principales..."

URLS=(
    "http://localhost:4001"
    "http://localhost:4001/learning-tools"
    "http://localhost:3002/api/docs"
)

for url in "${URLS[@]}"; do
    echo "  🔗 $url"
    curl -s "$url" > /dev/null
    show_result "  URL accesible"
done

echo ""
echo "🧪 7. Instrucciones para Pruebas Manuales:"
echo "=========================================="
echo ""
echo "📋 Para probar las Learning Tools, abre tu navegador y sigue estos pasos:"
echo ""
echo "1️⃣  Navega a: http://localhost:4001/learning-tools"
echo "     ↳ Deberías ver la página de Herramientas Educativas"
echo ""
echo "2️⃣  Haz clic en 'Herramientas Masivas'"
echo "     ↳ Deberías ver las opciones: Traductor, Explorador, Sistema de Audio"
echo ""
echo "3️⃣  Haz clic en 'Sistema de Audio'"
echo "     ↳ Deberías ver una lista de archivos de audio cargándose"
echo "     ↳ Verifica que aparezcan archivos como 'audio_000.wav', 'audio_001.wav', etc."
echo ""
echo "4️⃣  Haz clic en el botón ▶️ de cualquier archivo de audio"
echo "     ↳ El archivo debería reproducirse sin errores"
echo "     ↳ Deberías ver una barra de progreso"
echo ""
echo "5️⃣  Ve al menu principal y haz clic en 'Ejercicios Interactivos'"
echo "     ↳ Deberías ver 8 tipos de ejercicios"
echo ""
echo "6️⃣  Haz clic en 'Vocabulario Masivo'"
echo "     ↳ Debería cargar un ejercicio con datos reales del diccionario"
echo "     ↳ Las opciones múltiples deberían ser diferentes cada vez"
echo ""
echo "7️⃣  Responde algunas preguntas"
echo "     ↳ Después del primer ejercicio debería aparecer el Dashboard de Progreso"
echo "     ↳ Deberías ver: ejercicios completados, precisión, racha de días, nivel"
echo ""

echo ""
echo "🐛 Si encuentras errores:"
echo "========================"
echo ""
echo "• Error 'AbortError': Backend sobrecargado - espera unos segundos"
echo "• Error 'ECONNREFUSED': Backend no está corriendo"
echo "• Error 'Not Found': URL incorrecta o servicio no disponible"
echo "• Audio no reproduce: Verificar que el archivo existe en backend/data/audio/"
echo ""

echo ""
echo "📊 Para ver métricas en tiempo real:"
echo "====================================="
echo "• Grafana: http://localhost:3001 (admin/wayuu2024)"
echo "• API Docs: http://localhost:3002/api/docs"
echo "• Métricas JSON: http://localhost:3002/api/metrics/json"
echo ""

# Limpiar archivos temporales
rm -f /tmp/dict_test.json /tmp/metrics.json

echo "✨ Verificación completada. ¡Ahora prueba manualmente en el navegador!" 
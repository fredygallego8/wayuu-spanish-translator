#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO DE AUDIO - Learning Tools"
echo "=================================================="

# Colores
GREEN='\\033[0;32m'
RED='\\033[0;31m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m'

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0

# Función para mostrar resultados
test_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $1${NC}"
        ((TESTS_FAILED++))
    fi
}

echo ""
echo "🔧 1. VERIFICANDO BACKEND APIs..."
echo "================================="

# Test 1: Backend Health
echo "🌐 Probando salud del backend..."
curl -s http://localhost:3002/api/docs > /dev/null
test_result "Backend responde"

# Test 2: Dictionary API
echo "🔤 Probando API de diccionario..."
DICT_RESULT=$(curl -s "http://localhost:3002/api/datasets/dictionary/search?query=wayuu&limit=3" | jq '.results | length' 2>/dev/null)
if [ "$DICT_RESULT" = "3" ]; then
    echo -e "${GREEN}✅ Dictionary API responde correctamente ($DICT_RESULT resultados)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Dictionary API falla (resultados: $DICT_RESULT)${NC}"
    ((TESTS_FAILED++))
fi

# Test 3: Audio Endpoint Básico
echo "🎵 Probando endpoint de audio básico..."
AUDIO_STATUS=$(curl -s -I "http://localhost:3002/api/audio/files/audio_000.wav" | head -1 | grep -o '200\\|404\\|500')
if [ "$AUDIO_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Audio endpoint responde (Status: $AUDIO_STATUS)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Audio endpoint falla (Status: $AUDIO_STATUS)${NC}"
    ((TESTS_FAILED++))
fi

# Test 4: Audio Content-Type
echo "🎧 Verificando Content-Type del audio..."
CONTENT_TYPE=$(curl -s -I "http://localhost:3002/api/audio/files/audio_000.wav" | grep -i content-type | cut -d' ' -f2 | tr -d '\\r\\n')
if [[ "$CONTENT_TYPE" == *"audio"* ]] || [[ "$CONTENT_TYPE" == *"wav"* ]]; then
    echo -e "${GREEN}✅ Content-Type correcto: $CONTENT_TYPE${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Content-Type incorrecto: $CONTENT_TYPE${NC}"
    ((TESTS_FAILED++))
fi

# Test 5: Audio File Size
echo "📏 Verificando tamaño de archivo de audio..."
AUDIO_SIZE=$(curl -s -I "http://localhost:3002/api/audio/files/audio_000.wav" | grep -i content-length | cut -d' ' -f2 | tr -d '\\r\\n')
if [ -n "$AUDIO_SIZE" ] && [ "$AUDIO_SIZE" -gt "1000" ]; then
    echo -e "${GREEN}✅ Archivo de audio tiene tamaño válido: $AUDIO_SIZE bytes${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Archivo de audio muy pequeño o sin content-length: $AUDIO_SIZE${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "🎮 2. PROBANDO MÚLTIPLES ARCHIVOS DE AUDIO..."
echo "============================================="

# Test 6: Múltiples archivos de audio
echo "🔄 Probando archivos audio_000 a audio_009..."
AUDIO_COUNT=0
for i in {0..9}; do
    PADDED=$(printf "%03d" $i)
    STATUS=$(curl -s -I "http://localhost:3002/api/audio/files/audio_$PADDED.wav" | head -1 | grep -o '200')
    if [ "$STATUS" = "200" ]; then
        ((AUDIO_COUNT++))
    fi
done

if [ "$AUDIO_COUNT" -ge "8" ]; then
    echo -e "${GREEN}✅ Múltiples archivos de audio disponibles ($AUDIO_COUNT/10)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Pocos archivos de audio disponibles ($AUDIO_COUNT/10)${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "🌐 3. VERIFICANDO FRONTEND..."
echo "============================"

# Test 7: Frontend Learning Tools
echo "🧠 Probando página Learning Tools..."
curl -s "http://localhost:4001/learning-tools" | grep -q "Herramientas"
test_result "Frontend Learning Tools carga"

# Test 8: Frontend API Proxy
echo "🔄 Probando proxy de métricas del frontend..."
FRONTEND_METRICS=$(curl -s "http://localhost:4001/api/metrics" | jq '.datasets.dictionary.count' 2>/dev/null)
if [ -n "$FRONTEND_METRICS" ] && [ "$FRONTEND_METRICS" != "null" ]; then
    echo -e "${GREEN}✅ Frontend proxy funciona (diccionario: $FRONTEND_METRICS)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Frontend proxy falla (resultado: $FRONTEND_METRICS)${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "🔍 4. DIAGNÓSTICO ESPECÍFICO DEL ERROR..."
echo "======================================="

# Test 9: CORS Headers
echo "🌐 Verificando headers CORS..."
CORS_HEADER=$(curl -s -I "http://localhost:3002/api/audio/files/audio_000.wav" | grep -i access-control-allow-origin)
if [ -n "$CORS_HEADER" ]; then
    echo -e "${GREEN}✅ Headers CORS presentes: $CORS_HEADER${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Headers CORS no encontrados (puede causar problemas en navegador)${NC}"
    ((TESTS_FAILED++))
fi

# Test 10: Simulación del problema del navegador
echo "🕷️ Simulando carga desde navegador..."
BROWSER_SIMULATION=$(curl -s -H "User-Agent: Mozilla/5.0" -H "Accept: audio/wav,audio/*;q=0.9,*/*;q=0.8" -H "Origin: http://localhost:4001" "http://localhost:3002/api/audio/files/audio_000.wav" | wc -c)
if [ "$BROWSER_SIMULATION" -gt "1000" ]; then
    echo -e "${GREEN}✅ Simulación de navegador exitosa ($BROWSER_SIMULATION bytes)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Simulación de navegador falla ($BROWSER_SIMULATION bytes)${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "📊 RESUMEN DE RESULTADOS"
echo "======================"
echo -e "${GREEN}✅ Pruebas exitosas: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Pruebas fallidas: $TESTS_FAILED${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
echo -e "${BLUE}📈 Tasa de éxito: $SUCCESS_RATE%${NC}"

echo ""
echo "🔧 RECOMENDACIONES PARA ERRORES:"
echo "================================"
if [ $TESTS_FAILED -gt 0 ]; then
    echo "1. ❌ Si audio endpoints fallan: Reiniciar backend"
    echo "2. ❌ Si Content-Type incorrecto: Verificar configuración NestJS"
    echo "3. ❌ Si CORS falla: Agregar headers CORS al backend"
    echo "4. ❌ Si simulación navegador falla: Problema de codificación audio"
    echo ""
    echo "🚀 COMANDO DE SOLUCIÓN RÁPIDA:"
    echo "pkill -f nest && cd backend && pnpm run start:dev"
else
    echo -e "${GREEN}🎉 ¡Todos los tests pasaron! El problema puede estar en el frontend.${NC}"
    echo ""
    echo "🔍 SIGUIENTE PASO: Verificar JavaScript en navegador"
    echo "   - Abrir DevTools en http://localhost:4001/learning-tools"
    echo "   - Buscar errores en consola JavaScript"
    echo "   - Verificar Network tab para ver requests HTTP"
fi

echo ""
echo "📱 PRUEBA MANUAL RECOMENDADA:"
echo "============================="
echo "1. Abrir: http://localhost:4001/learning-tools"
echo "2. Ir a: Ejercicios Interactivos"
echo "3. Seleccionar: Vocabulario Masivo"
echo "4. Intentar reproducir audio"
echo "5. Verificar errores en DevTools (F12)" 
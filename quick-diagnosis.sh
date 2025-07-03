#!/bin/bash

echo "🔍 Diagnóstico Rápido del Sistema Wayuu Translator"
echo "================================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_service() {
    local url=$1
    local name=$2
    local timeout=5
    
    if timeout $timeout curl -s "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $name${NC}"
        return 0
    else
        echo -e "${RED}❌ $name${NC}"
        return 1
    fi
}

echo ""
echo "📡 Verificando Servicios..."
check_service "http://localhost:3002/api/docs" "Backend NestJS (3002)"
check_service "http://localhost:4001" "Frontend Next.js (4001)"

echo ""
echo "🎵 Verificando Audio..."
if curl -s -I "http://localhost:3002/api/audio/files/audio_000.wav" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ API Audio funciona${NC}"
else
    echo -e "${RED}❌ API Audio no responde${NC}"
fi

echo ""
echo "📚 Verificando Dataset..."
if ls backend/data/audio/*.wav >/dev/null 2>&1; then
    AUDIO_COUNT=$(ls backend/data/audio/*.wav | wc -l)
    echo -e "${GREEN}✅ Archivos de audio: $AUDIO_COUNT${NC}"
else
    echo -e "${RED}❌ No se encuentran archivos de audio${NC}"
fi

echo ""
echo "🔗 URLs para Pruebas Manuales:"
echo "================================"
echo -e "${BLUE}🎓 Learning Tools:${NC} http://localhost:4001/learning-tools"
echo -e "${BLUE}📊 API Docs:${NC} http://localhost:3002/api/docs"
echo -e "${BLUE}🎵 Audio Test:${NC} http://localhost:3002/api/audio/files/audio_000.wav"
echo -e "${BLUE}📈 Grafana:${NC} http://localhost:3001 (admin/wayuu2024)"

echo ""
echo "🧪 Pasos para Probar Learning Tools:"
echo "===================================="
echo "1. Abre: http://localhost:4001/learning-tools"
echo "2. Clic en 'Herramientas Masivas' → 'Sistema de Audio'"
echo "3. Reproduce cualquier archivo de audio"
echo "4. Vuelve y clic en 'Ejercicios Interactivos' → 'Vocabulario Masivo'"
echo "5. Responde algunas preguntas para ver el Dashboard de Progreso"

echo ""
echo "💡 Si hay errores AbortError, espera 15 segundos y recarga la página."
echo "✨ Usa la guía completa: cat manual-test-guide.md" 
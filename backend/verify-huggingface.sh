#!/bin/bash

# 🔍 Script de Verificación de Hugging Face API Key
# Wayuu Spanish Translator - Backend Verification

set -e

echo "🔍 Verificación de Configuración de Hugging Face"
echo "==============================================="
echo

# Verificar que el archivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Archivo .env no encontrado"
    echo "   Ejecuta: ./setup-huggingface.sh"
    exit 1
fi

# Verificar que la API key está configurada
if ! grep -q "HUGGINGFACE_API_KEY=" .env; then
    echo "❌ HUGGINGFACE_API_KEY no encontrada en .env"
    echo "   Ejecuta: ./setup-huggingface.sh"
    exit 1
fi

# Extraer la clave (sin mostrarla completa)
api_key=$(grep "HUGGINGFACE_API_KEY=" .env | cut -d'=' -f2 | sed 's/^"//' | sed 's/"$//')
if [ ${#api_key} -gt 10 ]; then
    echo "🔑 API Key configurada: ${api_key:0:7}...${api_key: -4}"
else
    echo "🔑 API Key configurada: $api_key"
fi

# Verificar que el backend está corriendo
echo
echo "🔍 Verificando backend..."
if ! curl -s http://localhost:3002/api/nllb/service/info > /dev/null 2>&1; then
    echo "❌ Backend no está corriendo en puerto 3002"
    echo "   Inicia el backend con: pnpm run start:dev"
    exit 1
fi

echo "✅ Backend corriendo en puerto 3002"

# Verificar servicio NLLB
echo
echo "🔍 Verificando servicio NLLB..."
nllb_info=$(curl -s http://localhost:3002/api/nllb/service/info)

if echo "$nllb_info" | grep -q "available.*true"; then
    echo "✅ Servicio NLLB configurado correctamente"
else
    echo "❌ Servicio NLLB no configurado"
    echo "   Respuesta: $nllb_info"
    exit 1
fi

# Verificar que la API key funciona
echo
echo "🔍 Verificando API Key con Hugging Face..."
health_check=$(curl -s http://localhost:3002/api/nllb/service/health)

if echo "$health_check" | grep -q "healthy\|degraded"; then
    echo "✅ API Key funciona correctamente"
    if echo "$health_check" | grep -q "healthy"; then
        echo "🎯 Estado: Servicio completamente funcional"
    else
        echo "⚠️  Estado: Servicio parcialmente funcional"
    fi
else
    echo "❌ API Key no funciona o hay problemas de conectividad"
    echo "   Respuesta: $health_check"
fi

# Probar traducción demo
echo
echo "🔍 Probando traducción demo..."
demo_result=$(curl -s -X POST http://localhost:3002/api/nllb/translate/demo \
    -H "Content-Type: application/json" \
    -d '{"text": "Hola mundo", "sourceLang": "spanish", "targetLang": "wayuu"}')

if echo "$demo_result" | grep -q "translatedText"; then
    echo "✅ Traducción demo funcionando"
    translated_text=$(echo "$demo_result" | grep -o '"translatedText":"[^"]*"' | cut -d'"' -f4)
    echo "🎯 Resultado: 'Hola mundo' → '$translated_text'"
else
    echo "❌ Traducción demo falló"
    echo "   Respuesta: $demo_result"
fi

# Verificar datasets disponibles
echo
echo "🔍 Verificando datasets disponibles..."
datasets_info=$(curl -s http://localhost:3002/api/huggingface/status)

if echo "$datasets_info" | grep -q "configured.*true"; then
    echo "✅ Datasets de Hugging Face configurados"
else
    echo "⚠️  Datasets en modo offline"
fi

echo
echo "🎯 Resumen de la Verificación"
echo "============================"

# Contar verificaciones exitosas
passed=0
total=5

if [ -f ".env" ] && grep -q "HUGGINGFACE_API_KEY=" .env; then
    echo "✅ API Key configurada"
    ((passed++))
else
    echo "❌ API Key no configurada"
fi

if curl -s http://localhost:3002/api/nllb/service/info > /dev/null 2>&1; then
    echo "✅ Backend corriendo"
    ((passed++))
else
    echo "❌ Backend no corriendo"
fi

if curl -s http://localhost:3002/api/nllb/service/info | grep -q "available.*true"; then
    echo "✅ Servicio NLLB configurado"
    ((passed++))
else
    echo "❌ Servicio NLLB no configurado"
fi

if curl -s http://localhost:3002/api/nllb/service/health | grep -q "healthy\|degraded"; then
    echo "✅ API Key funcional"
    ((passed++))
else
    echo "❌ API Key no funcional"
fi

if curl -s -X POST http://localhost:3002/api/nllb/translate/demo \
    -H "Content-Type: application/json" \
    -d '{"text": "Hola mundo", "sourceLang": "spanish", "targetLang": "wayuu"}' | grep -q "translatedText"; then
    echo "✅ Traducción demo funcional"
    ((passed++))
else
    echo "❌ Traducción demo no funcional"
fi

echo
echo "📊 Resultado: $passed/$total verificaciones exitosas"

if [ $passed -eq $total ]; then
    echo "🎉 ¡Configuración completa y funcional!"
    echo
    echo "🚀 Próximos pasos:"
    echo "   • Abrir http://localhost:4001 (Frontend Next.js)"
    echo "   • Probar NLLB Translator en la interfaz web"
    echo "   • Acceder a http://localhost:3002/api/docs (API Documentation)"
elif [ $passed -ge 3 ]; then
    echo "⚠️  Configuración mayormente funcional"
    echo "   Algunas funcionalidades pueden estar limitadas"
else
    echo "❌ Configuración incompleta"
    echo "   Ejecuta: ./setup-huggingface.sh para configurar"
fi

echo 
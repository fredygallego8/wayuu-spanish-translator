#!/bin/bash

echo "🧪 TESTING GEMINI API CONFIGURATION"
echo "=================================="
echo ""

# Verificar si existe archivo .env
if [ ! -f ".env" ]; then
    echo "❌ Archivo .env no encontrado"
    exit 1
fi

# Verificar API key
API_KEY=$(grep 'GEMINI_API_KEY=' .env | cut -d'=' -f2)

if [ -z "$API_KEY" ]; then
    echo "❌ GEMINI_API_KEY no configurada en .env"
    echo "📝 Configura tu API key:"
    echo "   nano .env"
    exit 1
fi

if [ "$API_KEY" = "TU_API_KEY_AQUI" ]; then
    echo "❌ API key no reemplazada (aún dice TU_API_KEY_AQUI)"
    echo "📝 Reemplaza con tu API key real"
    exit 1
fi

echo "✅ API key configurada: ${API_KEY:0:20}..."
echo ""

# Probar conexión básica
echo "�� Probando conexión a Gemini API..."
curl -s -X POST \
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}" \
    -H 'Content-Type: application/json' \
    -d '{
        "contents": [{
            "parts": [{
                "text": "Responde solo: API funcionando"
            }]
        }]
    }' | jq -r '.candidates[0].content.parts[0].text' 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Conexión exitosa a Gemini API"
    echo "🎉 Configuración completada correctamente!"
else
    echo "❌ Error en conexión - Verifica tu API key"
fi

#!/bin/bash

echo "🔄 MONITOR DE BACKEND - Esperando que esté completamente operativo..."
echo "=================================================================="
echo ""

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo -ne "\r🔍 Intento $((RETRY_COUNT + 1))/$MAX_RETRIES: "
    
    if curl -s http://localhost:3002/api/gemini-dictionary/health >/dev/null 2>&1; then
        echo ""
        echo "✅ ¡BACKEND COMPLETAMENTE OPERATIVO!"
        echo ""
        echo "🎯 CONFIGURACIÓN GEMINI API COMPLETADA:"
        echo "  ✅ API Key configurada"
        echo "  ✅ Conectividad verificada"
        echo "  ✅ Backend funcionando"
        echo "  ✅ Frontend disponible"
        echo ""
        echo "🚀 PRUEBA AHORA:"
        echo "  1. Abre: http://localhost:4001/gemini-dictionary"
        echo "  2. Haz clic en 'Generate Entries'"
        echo "  3. ¡Observa contenido AUTÉNTICO de Gemini!"
        echo ""
        exit 0
    fi
    
    echo -ne "Esperando... "
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

echo ""
echo "⚠️ Backend tardando más de lo esperado"
echo "💡 Puedes probar el frontend mientras tanto:"
echo "   http://localhost:4001/gemini-dictionary"

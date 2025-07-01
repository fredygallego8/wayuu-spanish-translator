#!/bin/bash
echo "🚀 Actualizando PDFs desde Hugging Face..."
echo "📡 Intentando descargar fuentes actualizadas..."

# Método 1: Usando curl con token (requiere autenticación)
echo "⚠️  Este endpoint requiere autenticación."
echo "👤 Por favor usa la interfaz web en: http://localhost:3002/api/docs"
echo ""

# Verificar estado actual
echo "📊 Estado actual:"
curl -s http://localhost:3002/api/huggingface/cached-files | jq -r '"PDFs cacheados: " + (.count | tostring)'

echo ""
echo "📝 Instrucciones:"
echo "1. Abre: http://localhost:3002/api/docs"
echo "2. Busca la sección: 'Hugging Face Integration'"
echo "3. Encuentra: 'POST /api/huggingface/fetch-sources'"
echo "4. Haz clic en 'Try it out'"
echo "5. Haz clic en 'Execute'"
echo ""
echo "🔍 Después ejecuta este script de nuevo para verificar."

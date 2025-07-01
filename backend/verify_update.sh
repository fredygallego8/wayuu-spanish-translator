#!/bin/bash
echo "🔍 VERIFICANDO ACTUALIZACIÓN DE PDFs..."
echo ""

echo "📊 Estado actual de Hugging Face:"
curl -s http://localhost:3002/api/huggingface/cached-files | jq .

echo ""
echo "📂 Archivos en directorio:"
ls -la data/sources/*.pdf 2>/dev/null || echo "No se encontraron PDFs"

echo ""
echo "📈 Total de PDFs encontrados: $(ls data/sources/*.pdf 2>/dev/null | wc -l)"

echo ""
echo "🔄 Para aplicar los cambios a los datasets, ejecuta:"
echo "curl -X POST http://localhost:3002/api/datasets/reload"

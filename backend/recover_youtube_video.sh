#!/bin/bash
echo "🔄 SCRIPT DE RECUPERACIÓN DE VIDEO DE YOUTUBE"
echo "=============================================="

if [ -z "$1" ]; then
    echo "❌ Error: Necesitas proporcionar la URL del video"
    echo "📋 Uso: ./recover_youtube_video.sh 'https://www.youtube.com/watch?v=VIDEO_ID'"
    echo ""
    echo "🤔 Videos borrados que podemos recuperar:"
    echo "   • 'presentación personal en wayuunaiki' (probablemente: https://www.youtube.com/watch?v=fYUjs_dbnjs)"
    echo "   • Video con ID: 0SgVbpfEqmw (https://www.youtube.com/watch?v=0SgVbpfEqmw)"
    exit 1
fi

URL="$1"
echo "🎯 Intentando recuperar video: $URL"
echo ""

echo "📡 Enviando solicitud de procesamiento..."
curl -X POST http://localhost:3002/api/youtube-ingestion/ingest \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$URL\"}" | jq .

echo ""
echo "⏱️  El procesamiento puede tomar unos minutos..."
echo "🔍 Para verificar progreso:"
echo "   curl -s http://localhost:3002/api/youtube-ingestion/status | jq ."

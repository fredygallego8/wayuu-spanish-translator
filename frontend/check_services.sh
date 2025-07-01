#!/bin/bash
echo "🔍 VERIFICANDO ESTADO DE SERVICIOS WAYUU TRANSLATOR"
echo "=================================================="

# Verificar Backend
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "✅ Backend: FUNCIONANDO (http://localhost:3002)"
    VIDEOS=$(curl -s http://localhost:3002/api/youtube-ingestion/status | jq -r '.data.total' 2>/dev/null || echo "?")
    echo "   📹 Videos en BD: $VIDEOS"
else
    echo "❌ Backend: NO RESPONDE (http://localhost:3002)"
fi

# Verificar Frontend  
if curl -s -I http://localhost:4000 > /dev/null 2>&1; then
    echo "✅ Frontend: FUNCIONANDO (http://localhost:4000)" 
else
    echo "❌ Frontend: NO RESPONDE (http://localhost:4000)"
fi

echo ""
echo "📋 URLs principales:"
echo "   🖥️  Frontend: http://localhost:4000/index.html"
echo "   📤 Subir YouTube: http://localhost:4000/youtube-uploader.html"
echo "   🎵 Subir Audio: http://localhost:4000/audio-uploader.html"
echo "   📚 API Docs: http://localhost:3002/api/docs"

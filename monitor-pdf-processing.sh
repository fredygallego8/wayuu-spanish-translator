#!/bin/bash

# 🔍 Script de Monitoreo de Procesamiento de PDFs
# Uso: ./monitor-pdf-processing.sh

echo "🔍 Iniciando monitoreo de procesamiento de PDFs..."
echo "📋 Presiona Ctrl+C para detener"
echo ""

# Función para mostrar el estado de un PDF cuando termina
monitor_pdf_completion() {
    tail -f backend.log | while read line; do
        # Detectar inicio de procesamiento
        if echo "$line" | grep -q "Processing linguistic PDF:"; then
            filename=$(echo "$line" | sed 's/.*Processing linguistic PDF: //' | sed 's/\.pdf.*/\.pdf/')
            echo "🟡 INICIANDO: $filename $(date '+%H:%M:%S')"
        fi
        
        # Detectar finalización de PDF individual
        if echo "$line" | grep -q "Extracted.*entries from"; then
            entries=$(echo "$line" | grep -o "Extracted [0-9]* entries" | grep -o "[0-9]*")
            filename=$(echo "$line" | sed 's/.*from //' | sed 's/ (processed.*//')
            lines=$(echo "$line" | grep -o "processed [0-9]* lines" | grep -o "[0-9]*")
            echo "✅ COMPLETADO: $filename → $entries entradas ($lines líneas) $(date '+%H:%M:%S')"
        fi
        
        # Detectar finalización completa
        if echo "$line" | grep -q "Comprehensive extraction completed"; then
            total=$(echo "$line" | grep -o "[0-9]* entries" | head -1 | grep -o "[0-9]*")
            time=$(echo "$line" | grep -o "[0-9]*ms" | grep -o "[0-9]*")
            pdfs=$(echo "$line" | grep -o "from [0-9]* PDFs" | grep -o "[0-9]*")
            echo ""
            echo "🎯 PROCESO COMPLETO: $total entradas de $pdfs PDFs en ${time}ms"
            echo "📊 Promedio: $((total/pdfs)) entradas por PDF"
            echo ""
        fi
    done
}

# Ejecutar en background
monitor_pdf_completion &
MONITOR_PID=$!

# Triggear el procesamiento
echo "🚀 Iniciando procesamiento de PDFs..."
curl -s -X POST http://localhost:3002/api/pdf-processing/force-reextract > /dev/null

# Esperar un poco y mostrar resultado final
sleep 5
kill $MONITOR_PID 2>/dev/null

echo ""
echo "📈 Resultado final:"
curl -s -X POST http://localhost:3002/api/pdf-processing/force-reextract | jq '.data | {totalExtracted, bySource}' 
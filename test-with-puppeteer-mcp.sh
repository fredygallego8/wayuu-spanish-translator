#!/bin/bash

echo "🚀 Testing Learning Tools con Puppeteer MCP"
echo "============================================"

# Función para pausar entre pasos
pause() {
    echo "⏸️  Presiona Enter para continuar..."
    read -r
}

echo "📱 Navegando al frontend..."

# Primero voy a navegar y probar paso a paso
echo "1. Navegando a homepage: http://localhost:4001"
echo "2. Luego a Learning Tools: http://localhost:4001/learning-tools"
echo "3. Probando Herramientas Masivas"
echo "4. Probando Sistema de Audio"
echo "5. Probando Ejercicios Interactivos"

echo ""
echo "¿Deseas continuar con las pruebas automatizadas? (y/n)"
read -r response

if [[ "$response" != "y" ]]; then
    echo "Pruebas canceladas."
    exit 0
fi

echo "🔧 Iniciando pruebas con Puppeteer MCP..."
echo "📝 Los resultados aparecerán en screenshots-mcp/" 
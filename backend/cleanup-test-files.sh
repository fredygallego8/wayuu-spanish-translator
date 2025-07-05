#!/bin/bash

echo "🧹 Limpiando archivos temporales de testing..."

# Eliminar archivos de test temporales
rm -f test-gemini-combined-stats.js
rm -f test-gemini-config.sh
rm -f monitor-backend.sh

echo "✅ Archivos temporales eliminados"

# Mantener archivos importantes
echo "📁 Archivos conservados:"
echo "  - docs/GEMINI_METRICS_IMPLEMENTATION.md"
echo "  - .env (configuración)"
echo "  - src/ (código fuente)"

echo "🎉 Limpieza completada" 
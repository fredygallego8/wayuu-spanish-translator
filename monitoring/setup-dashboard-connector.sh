#!/bin/bash

# 🚀 Setup Script para Grafana Dashboard Connector
# Este script instala y configura todo lo necesario para usar Puppeteer con Grafana

set -e

echo "🚀 Configurando Grafana Dashboard Connector..."
echo "================================================"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloridos
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

print_success "Node.js $(node --version) encontrado"

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado. Por favor instala npm primero."
    exit 1
fi

print_success "npm $(npm --version) encontrado"

# Crear directorios necesarios
print_info "Creando directorios..."
mkdir -p screenshots
mkdir -p quick-checks
mkdir -p examples
mkdir -p logs

print_success "Directorios creados"

# Instalar dependencias
print_info "Instalando Puppeteer..."
npm install puppeteer

if [ $? -eq 0 ]; then
    print_success "Puppeteer instalado correctamente"
else
    print_error "Error instalando Puppeteer"
    exit 1
fi

# Hacer ejecutables los scripts
chmod +x grafana-dashboard-connector.js
chmod +x examples/quick-check.js

print_success "Scripts marcados como ejecutables"

# Verificar instalación
print_info "Verificando instalación..."
node -e "
const puppeteer = require('puppeteer');
console.log('✅ Puppeteer version:', puppeteer.version || 'latest');
" 2>/dev/null

if [ $? -eq 0 ]; then
    print_success "Verificación exitosa"
else
    print_warning "La verificación falló, pero la instalación debería estar OK"
fi

# Verificar servicios de Grafana
print_info "Verificando servicios..."

if curl -s http://localhost:3001 > /dev/null; then
    print_success "Grafana está ejecutándose en puerto 3001"
else
    print_warning "Grafana no responde en puerto 3001. Asegúrate de que esté ejecutándose."
fi

if curl -s http://localhost:3002/api/metrics > /dev/null; then
    print_success "Backend API responde en puerto 3002"
else
    print_warning "Backend API no responde en puerto 3002"
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo "================================================"
echo ""
echo "📋 Comandos disponibles:"
echo ""
echo "  • Verificación rápida (con interfaz gráfica):"
echo "    npm run dashboard-visual"
echo ""
echo "  • Verificación en modo silencioso:"
echo "    npm run dashboard"
echo ""
echo "  • Monitoreo automatizado:"
echo "    npm run monitor"
echo ""
echo "  • Verificación rápida personalizada:"
echo "    node examples/quick-check.js"
echo ""
echo "  • Ejecutar directamente:"
echo "    node grafana-dashboard-connector.js --basic"
echo ""
echo "  • Ver ayuda:"
echo "    npm run help"
echo ""
echo "📁 Directorios creados:"
echo "  • ./screenshots/ - Screenshots automáticos"
echo "  • ./quick-checks/ - Verificaciones rápidas"
echo "  • ./logs/ - Logs de ejecución"
echo ""
echo "🔧 Para personalizar la configuración, edita:"
echo "    grafana-dashboard-connector.js (líneas 13-25)"
echo ""

# Test rápido opcional
read -p "¿Quieres ejecutar una prueba rápida ahora? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Ejecutando prueba rápida..."
    node examples/quick-check.js
fi

print_success "¡Todo listo para usar el Grafana Dashboard Connector! 🚀" 
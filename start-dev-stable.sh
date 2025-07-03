#!/bin/bash

# Script de inicio estable para desarrollo - Wayuu Spanish Translator
# Evita bucles infinitos y maneja mejor los procesos

set -e

echo "🚀 Iniciando Wayuu Spanish Translator - Modo Desarrollo Estable"

# Función para limpiar procesos al salir
cleanup() {
    echo "🛑 Deteniendo servicios..."
    pkill -f "nest start" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    exit 0
}

# Configurar señales para limpieza
trap cleanup SIGINT SIGTERM

# Verificar y aumentar límite de file watchers
echo "📁 Verificando límite de file watchers..."
current_limit=$(cat /proc/sys/fs/inotify/max_user_watches)
if [ "$current_limit" -lt 524288 ]; then
    echo "⚠️  Límite bajo de file watchers. Se requiere configuración del sistema."
    echo "   Ejecute: echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p"
fi

# Limpiar compilaciones anteriores
echo "🧹 Limpiando compilaciones anteriores..."
cd backend && rm -rf dist .cache 2>/dev/null || true
cd ../frontend-next && rm -rf .next .cache 2>/dev/null || true
cd ..

# Verificar dependencias
echo "📦 Verificando dependencias..."
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend-next/node_modules" ]; then
    echo "⚠️  Instalando dependencias..."
    pnpm install
fi

# Función para iniciar backend
start_backend() {
    echo "🔧 Iniciando Backend (NestJS) en puerto 3002..."
    cd backend
    pnpm run build > /dev/null 2>&1
    pnpm run start:dev &
    BACKEND_PID=$!
    cd ..
    
    # Esperar a que el backend esté disponible
    echo "⏳ Esperando backend..."
    for i in {1..30}; do
        if curl -s http://localhost:3002/api/metrics > /dev/null 2>&1; then
            echo "✅ Backend disponible en http://localhost:3002"
            return 0
        fi
        sleep 1
    done
    echo "❌ Error: Backend no disponible después de 30 segundos"
    return 1
}

# Función para iniciar frontend
start_frontend() {
    echo "🎨 Iniciando Frontend Next.js en puerto 4001..."
    cd frontend-next
    pnpm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # Esperar a que el frontend esté disponible
    echo "⏳ Esperando frontend..."
    for i in {1..60}; do
        if curl -s http://localhost:4001 > /dev/null 2>&1; then
            echo "✅ Frontend disponible en http://localhost:4001"
            return 0
        fi
        sleep 1
    done
    echo "❌ Error: Frontend no disponible después de 60 segundos"
    return 1
}

# Iniciar servicios
start_backend
start_frontend

echo ""
echo "🎉 ¡Servicios iniciados correctamente!"
echo ""
echo "📍 URLs disponibles:"
echo "   🔧 Backend API: http://localhost:3002"
echo "   📊 API Docs: http://localhost:3002/api/docs"
echo "   🎨 Frontend: http://localhost:4001"
echo "   📊 Métricas: http://localhost:3002/api/metrics"
echo ""
echo "📝 Para detener los servicios, presiona Ctrl+C"
echo "🔄 Los servicios se reiniciarán automáticamente al cambiar archivos"
echo ""

# Mantener el script activo
wait 
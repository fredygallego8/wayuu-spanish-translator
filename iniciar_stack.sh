#!/bin/bash
# Archivo: iniciar_stack.sh
# Propósito: Inicio automático del stack completo Wayuu Translator

echo "🚀 INICIANDO STACK COMPLETO WAYUU TRANSLATOR"
echo "============================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorio base
BASE_DIR="$(dirname "$0")"
cd "$BASE_DIR"

# Función para mostrar proceso
show_step() {
    echo -e "\n${BLUE}📋 $1${NC}"
    echo "$(printf '=%.0s' {1..50})"
}

# Función para verificar comando
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1: Disponible${NC}"
        return 0
    else
        echo -e "${RED}❌ $1: No encontrado${NC}"
        return 1
    fi
}

show_step "VERIFICANDO PRE-REQUISITOS"

# Verificar comandos necesarios
check_command docker || { echo "❌ Instalar Docker primero"; exit 1; }
check_command docker-compose || { echo "❌ Instalar Docker Compose primero"; exit 1; }
check_command pnpm || { echo "❌ Instalar pnpm primero"; exit 1; }
check_command curl || { echo "❌ Instalar curl primero"; exit 1; }

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker no está corriendo. Iniciando...${NC}"
    sudo systemctl start docker
    sleep 5
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ No se pudo iniciar Docker${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Docker: Funcionando${NC}"

show_step "PASO 1: Iniciando Stack de Monitoring"

cd monitoring

# Verificar puertos libres
for port in 3001 9090 9093 9100; do
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Puerto $port en uso, intentando continuar...${NC}"
    fi
done

# Iniciar servicios de monitoring
echo "🐳 Iniciando servicios Docker..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Servicios de monitoring iniciados${NC}"
else
    echo -e "${RED}❌ Error iniciando servicios de monitoring${NC}"
    exit 1
fi

echo "⌛ Esperando servicios (30s)..."
sleep 30

show_step "PASO 2: Verificando Servicios de Monitoring"

# Verificar servicios
docker-compose ps

# Verificar que servicios estén UP
monitoring_ok=true
for port in 3001 9090 9100 9093; do
    if curl -s http://localhost:$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Puerto $port: Disponible${NC}"
    else
        echo -e "${RED}❌ Puerto $port: No disponible${NC}"
        monitoring_ok=false
    fi
done

if [ "$monitoring_ok" = false ]; then
    echo -e "${YELLOW}⚠️  Algunos servicios de monitoring no están listos${NC}"
    echo "   Continuando con el backend..."
fi

show_step "PASO 3: Preparando Backend NestJS"

cd ../backend

# Verificar si existe node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    pnpm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error instalando dependencias${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dependencias ya instaladas${NC}"
fi

# Verificar si existe dist
if [ ! -d "dist" ] || [ ! -f "dist/main.js" ]; then
    echo "🔨 Construyendo proyecto..."
    pnpm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error construyendo proyecto${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Proyecto ya construido${NC}"
fi

show_step "PASO 4: Iniciando Backend NestJS"

# Verificar si el puerto 3002 está libre
if lsof -i :3002 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Puerto 3002 en uso. Matando proceso...${NC}"
    lsof -ti :3002 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Iniciar backend en background
echo "🚀 Iniciando Backend NestJS..."
nohup pnpm run start:dev > ../backend.log 2>&1 &
BACKEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Logs disponibles en: backend.log"

show_step "PASO 5: Verificando Backend"

# Esperar a que el backend se inicie
echo "⌛ Esperando backend (30s)..."
for i in {1..30}; do
    if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend respondiendo después de ${i}s${NC}"
        break
    fi
    sleep 1
    echo -n "."
done

echo ""

# Verificar endpoints del backend
if curl -s http://localhost:3002/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend Health: Disponible${NC}"
    health_response=$(curl -s http://localhost:3002/api/health)
    echo "   Response: $health_response"
else
    echo -e "${RED}❌ Backend Health: No responde${NC}"
    echo "   Verificar logs: tail -f backend.log"
fi

if curl -s http://localhost:3002/api/metrics | head -1 | grep -q "#"; then
    echo -e "${GREEN}✅ Backend Metrics: Disponibles${NC}"
else
    echo -e "${RED}❌ Backend Metrics: Sin datos${NC}"
fi

show_step "PASO 6: Verificación Final"

# Ejecutar script de verificación
echo "🔍 Ejecutando verificación completa..."
cd ..
if [ -f "verificar_stack.sh" ]; then
    ./verificar_stack.sh
else
    echo -e "${YELLOW}⚠️  Script de verificación no encontrado${NC}"
fi

show_step "PASO 7: URLs de Acceso"

echo -e "${BLUE}🔗 URLs PRINCIPALES:${NC}"
echo "   📊 Grafana Dashboard: http://localhost:3001"
echo "      Usuario: admin"
echo "      Contraseña: wayuu2024"
echo ""
echo "   📈 Prometheus: http://localhost:9090"
echo "   📋 Prometheus Targets: http://localhost:9090/targets"
echo ""
echo "   🚀 Backend Health: http://localhost:3002/api/health"
echo "   📊 Backend Metrics: http://localhost:3002/api/metrics"
echo "   🔤 Translation Health: http://localhost:3002/api/translation/health"
echo "   📚 Dataset Stats: http://localhost:3002/api/datasets/stats"

echo -e "\n${BLUE}📋 INFORMACIÓN DEL SISTEMA:${NC}"
echo "   Backend PID: $BACKEND_PID"
echo "   Logs Backend: tail -f backend.log"
echo "   Detener Backend: kill $BACKEND_PID"
echo "   Detener Monitoring: cd monitoring && docker-compose down"

echo -e "\n${BLUE}⚠️  IMPORTANTE PARA GRAFANA:${NC}"
echo "   1. Accede a: http://localhost:3001"
echo "   2. Login: admin / wayuu2024"
echo "   3. ⏰ CAMBIAR Time Range a 'Last 1 hour' (no 12 hours)"
echo "   4. Si no hay datos, usar Explore con query: 'up'"

echo -e "\n${GREEN}✅ Stack iniciado completamente!${NC}"
echo -e "${GREEN}🎯 Estado: LISTO PARA USO${NC}"

# Guardar información del proceso para posterior uso
cat > stack_info.txt << EOF
Stack iniciado: $(date)
Backend PID: $BACKEND_PID
URLs:
- Grafana: http://localhost:3001 (admin/wayuu2024)
- Prometheus: http://localhost:9090
- Backend: http://localhost:3002/api/health

Para detener:
- Backend: kill $BACKEND_PID
- Monitoring: cd monitoring && docker-compose down
EOF

echo -e "\n📄 Información guardada en: stack_info.txt" 
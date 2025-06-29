#!/bin/bash
# Archivo: verificar_stack.sh
# Propósito: Verificación completa del stack Wayuu Translator

echo "🔍 VERIFICACIÓN COMPLETA DEL STACK WAYUU TRANSLATOR"
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para verificar puerto
check_port() {
    local port=$1
    local service=$2
    if curl -s http://localhost:$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service (puerto $port): UP${NC}"
        return 0
    else
        echo -e "${RED}❌ $service (puerto $port): DOWN${NC}"
        return 1
    fi
}

# Función para verificar proceso
check_process() {
    local process=$1
    local service=$2
    if ps aux | grep -E "$process" | grep -v grep > /dev/null; then
        echo -e "${GREEN}✅ $service: Proceso corriendo${NC}"
        return 0
    else
        echo -e "${RED}❌ $service: Proceso NO encontrado${NC}"
        return 1
    fi
}

# Función para mostrar sección
show_section() {
    echo -e "\n${BLUE}📋 $1${NC}"
    echo "$(printf '=%.0s' {1..50})"
}

show_section "VERIFICANDO SERVICIOS DE MONITORING"

# Verificar Docker Compose Stack
cd "$(dirname "$0")/monitoring" 2>/dev/null || cd monitoring

if docker-compose ps 2>/dev/null | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker Compose Stack: Servicios corriendo${NC}"
    docker-compose ps | grep -E "(wayuu-|Up|Down)"
else
    echo -e "${RED}❌ Docker Compose Stack: Problemas detectados${NC}"
    echo -e "${YELLOW}💡 Ejecutar: cd monitoring && docker-compose up -d${NC}"
fi

echo ""
# Verificar puertos individuales
check_port 3001 "Grafana" && echo "   🔗 http://localhost:3001 (admin/wayuu2024)"
check_port 9090 "Prometheus" && echo "   🔗 http://localhost:9090"
check_port 9100 "Node Exporter" 
check_port 9093 "AlertManager"

show_section "VERIFICANDO BACKEND NESTJS"

# Verificar Backend
if check_port 3002 "Backend NestJS"; then
    echo "   🔗 http://localhost:3002"
    
    # Verificar endpoints específicos
    if curl -s http://localhost:3002/api/health > /dev/null; then
        health_response=$(curl -s http://localhost:3002/api/health | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
        echo -e "${GREEN}✅ Backend Health: $health_response${NC}"
    else
        echo -e "${RED}❌ Backend Health: No responde${NC}"
    fi
    
    if curl -s http://localhost:3002/api/metrics | head -1 | grep -q "#"; then
        metric_count=$(curl -s http://localhost:3002/api/metrics | grep -c "^# HELP" 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ Backend Metrics: $metric_count métricas disponibles${NC}"
    else
        echo -e "${RED}❌ Backend Metrics: Sin datos${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Backend NestJS no está corriendo${NC}"
    echo -e "${YELLOW}    💡 Ejecutar: cd backend && pnpm run start:dev${NC}"
fi

show_section "VERIFICANDO INTEGRACIÓN PROMETHEUS"

# Verificar targets en Prometheus  
if curl -s 'http://localhost:9090/api/v1/query?query=up' 2>/dev/null | grep -q "wayuu-translator-backend"; then
    # Verificar si backend target está UP
    backend_status=$(curl -s 'http://localhost:9090/api/v1/query?query=up{job="wayuu-translator-backend"}' 2>/dev/null | jq -r '.data.result[0].value[1]' 2>/dev/null)
    if [ "$backend_status" = "1" ]; then
        echo -e "${GREEN}✅ Prometheus → Backend: Conectado${NC}"
        
        # Verificar métricas específicas
        wayuu_metrics=$(curl -s 'http://localhost:9090/api/v1/label/__name__/values' 2>/dev/null | jq -r '.data[]' 2>/dev/null | grep -c "wayuu_" || echo "0")
        echo -e "${GREEN}   📊 Métricas Wayuu disponibles: $wayuu_metrics${NC}"
    else
        echo -e "${RED}❌ Prometheus → Backend: Desconectado (status: $backend_status)${NC}"
    fi
else
    echo -e "${RED}❌ Prometheus: Target backend no encontrado${NC}"
    echo -e "${YELLOW}   💡 Verificar configuración en monitoring/prometheus/prometheus.yml${NC}"
fi

# Verificar todos los targets
echo -e "\n📈 Targets de Prometheus:"
if curl -s http://localhost:9090/api/v1/targets 2>/dev/null | jq -r '.data.activeTargets[] | "   \(.labels.job): \(.health)"' 2>/dev/null; then
    : # Output ya mostrado por jq
else
    echo "   ⚠️  No se pudieron obtener targets"
fi

show_section "VERIFICANDO GRAFANA"

# Verificar Grafana y datasource
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Grafana: Accesible${NC}"
    echo -e "${BLUE}   🔗 Dashboard: http://localhost:3001 (admin/wayuu2024)${NC}"
    
    # Verificar datasource Prometheus
    if curl -s -u admin:wayuu2024 http://localhost:3001/api/datasources 2>/dev/null | grep -q "prometheus"; then
        echo -e "${GREEN}✅ Datasource Prometheus: Configurado${NC}"
    else
        echo -e "${YELLOW}⚠️  Datasource Prometheus: Verificar configuración${NC}"
    fi
else
    echo -e "${RED}❌ Grafana: No accesible${NC}"
fi

show_section "RESUMEN FINAL"

# Contar servicios UP
services_up=0
total_services=5

curl -s http://localhost:3001 >/dev/null 2>&1 && ((services_up++))
curl -s http://localhost:9090 >/dev/null 2>&1 && ((services_up++))
curl -s http://localhost:9100 >/dev/null 2>&1 && ((services_up++))
curl -s http://localhost:9093 >/dev/null 2>&1 && ((services_up++))
curl -s http://localhost:3002 >/dev/null 2>&1 && ((services_up++))

echo "📊 Servicios funcionando: $services_up/$total_services"

if [ $services_up -eq $total_services ]; then
    echo -e "${GREEN}🎉 ¡TODOS LOS SERVICIOS FUNCIONANDO!${NC}"
    echo -e "${GREEN}   ✅ Stack completo operativo${NC}"
    echo -e "${GREEN}   📊 Dashboards disponibles en: http://localhost:3001${NC}"
    echo -e "${GREEN}   🎯 Estado: LISTO PARA USO${NC}"
elif [ $services_up -ge 4 ]; then
    echo -e "${YELLOW}⚠️  Stack casi completo ($services_up/5 servicios)${NC}"
    if ! curl -s http://localhost:3002 >/dev/null 2>&1; then
        echo -e "${YELLOW}   🔧 Falta: Backend NestJS${NC}"
    fi
else
    echo -e "${RED}❌ Stack con problemas significativos ($services_up/5 servicios)${NC}"
fi

echo -e "\n${BLUE}💡 PRÓXIMOS PASOS:${NC}"
if ! curl -s http://localhost:3002 >/dev/null 2>&1; then
    echo "   1. 🚀 Iniciar Backend: cd backend && pnpm run start:dev"
fi
echo "   2. 📊 Acceder a Grafana: http://localhost:3001"
echo "   3. ⏰ Verificar Time Range: Usar 'Last 1 hour' (no 12 hours)"
echo "   4. 🔍 Probar en Explore: Query 'up'"

echo -e "\n${BLUE}🔗 URLs PRINCIPALES:${NC}"
echo "   📊 Grafana:    http://localhost:3001 (admin/wayuu2024)"
echo "   📈 Prometheus: http://localhost:9090"
echo "   🚀 Backend:    http://localhost:3002/api/health"
echo "   📋 Targets:    http://localhost:9090/targets"

echo -e "\n${BLUE}📋 COMANDOS ÚTILES:${NC}"
echo "   Reiniciar monitoring: cd monitoring && docker-compose restart"
echo "   Ver logs Grafana:     cd monitoring && docker-compose logs grafana"
echo "   Ver logs Prometheus:  cd monitoring && docker-compose logs prometheus"
echo "   Iniciar backend:      cd backend && pnpm run start:dev"

echo -e "\n✅ Verificación completada - $(date)" 
# 🔍 Verificación Completa del Stack Wayuu Translator

## 📋 Guía de Verificación Paso a Paso

**Fecha**: 18 de Diciembre, 2024  
**Propósito**: Verificar y resolver problemas con el stack completo  
**Estado**: Guía actualizada con troubleshooting actual  

---

## 🎯 Resumen del Stack

### **Componentes del Sistema:**
- **Backend NestJS**: Puerto 3002 (API + Métricas)
- **Grafana**: Puerto 3001 (Dashboards)
- **Prometheus**: Puerto 9090 (Recolección métricas)
- **Node Exporter**: Puerto 9100 (Métricas sistema)
- **AlertManager**: Puerto 9093 (Alertas)

---

## 🚀 Script de Verificación Automática

### **1. Crear Script de Verificación**

```bash
#!/bin/bash
# Archivo: verificar_stack.sh

echo "🔍 VERIFICACIÓN COMPLETA DEL STACK WAYUU TRANSLATOR"
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

echo -e "\n📊 VERIFICANDO SERVICIOS DE MONITORING..."
echo "----------------------------------------"

# Verificar Docker Compose Stack
cd /home/fredy/Escritorio/wayuu-spanish-translator/monitoring
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker Compose Stack: Servicios corriendo${NC}"
else
    echo -e "${RED}❌ Docker Compose Stack: Problemas detectados${NC}"
fi

# Verificar puertos individuales
check_port 3001 "Grafana"
check_port 9090 "Prometheus"
check_port 9100 "Node Exporter"
check_port 9093 "AlertManager"

echo -e "\n🚀 VERIFICANDO BACKEND NESTJS..."
echo "--------------------------------"

# Verificar Backend
if check_port 3002 "Backend NestJS"; then
    # Verificar endpoints específicos
    if curl -s http://localhost:3002/api/health > /dev/null; then
        echo -e "${GREEN}✅ Backend Health: Disponible${NC}"
    else
        echo -e "${RED}❌ Backend Health: No responde${NC}"
    fi
    
    if curl -s http://localhost:3002/api/metrics | head -1 | grep -q "#"; then
        echo -e "${GREEN}✅ Backend Metrics: Disponibles${NC}"
    else
        echo -e "${RED}❌ Backend Metrics: Sin datos${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Backend NestJS no está corriendo${NC}"
    echo -e "${YELLOW}    Ejecutar: cd backend && pnpm run start:dev${NC}"
fi

echo -e "\n📈 VERIFICANDO INTEGRACIÓN PROMETHEUS..."
echo "----------------------------------------"

# Verificar targets en Prometheus  
if curl -s 'http://localhost:9090/api/v1/query?query=up' | grep -q "wayuu-translator-backend"; then
    # Verificar si backend target está UP
    backend_status=$(curl -s 'http://localhost:9090/api/v1/query?query=up{job="wayuu-translator-backend"}' | jq -r '.data.result[0].value[1]' 2>/dev/null)
    if [ "$backend_status" = "1" ]; then
        echo -e "${GREEN}✅ Prometheus → Backend: Conectado${NC}"
    else
        echo -e "${RED}❌ Prometheus → Backend: Desconectado${NC}"
    fi
else
    echo -e "${RED}❌ Prometheus: Target backend no encontrado${NC}"
fi

echo -e "\n📊 VERIFICANDO GRAFANA..."
echo "-------------------------"

# Verificar Grafana y datasource
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Grafana: Accesible${NC}"
    echo -e "${YELLOW}🔗 URL: http://localhost:3001 (admin/wayuu2024)${NC}"
else
    echo -e "${RED}❌ Grafana: No accesible${NC}"
fi

echo -e "\n🎯 RESUMEN FINAL"
echo "==============="

# Contar servicios UP
services_up=0
total_services=5

curl -s http://localhost:3001 > /dev/null && ((services_up++))
curl -s http://localhost:9090 > /dev/null && ((services_up++))
curl -s http://localhost:9100 > /dev/null && ((services_up++))
curl -s http://localhost:9093 > /dev/null && ((services_up++))
curl -s http://localhost:3002 > /dev/null && ((services_up++))

echo "Servicios funcionando: $services_up/$total_services"

if [ $services_up -eq $total_services ]; then
    echo -e "${GREEN}🎉 ¡TODOS LOS SERVICIOS FUNCIONANDO!${NC}"
    echo -e "${GREEN}   ✅ Stack completo operativo${NC}"
    echo -e "${GREEN}   📊 Dashboards disponibles en: http://localhost:3001${NC}"
elif [ $services_up -ge 4 ]; then
    echo -e "${YELLOW}⚠️  Stack casi completo (verificar backend)${NC}"
else
    echo -e "${RED}❌ Stack con problemas significativos${NC}"
fi

echo -e "\n💡 PRÓXIMOS PASOS:"
if ! curl -s http://localhost:3002 > /dev/null; then
    echo "   1. Iniciar Backend: cd backend && pnpm run start:dev"
fi
echo "   2. Acceder a Grafana: http://localhost:3001"
echo "   3. Verificar Time Range: Usar 'Last 1 hour'"
echo "   4. Probar en Explore: Query 'up'"
```

### **2. Hacer Script Ejecutable**

```bash
# Crear el script
cd /home/fredy/Escritorio/wayuu-spanish-translator
nano verificar_stack.sh

# Pegar el contenido del script de arriba

# Hacer ejecutable
chmod +x verificar_stack.sh

# Ejecutar
./verificar_stack.sh
```

---

## 🔧 Scripts de Inicio Automático

### **Script de Inicio Completo**

```bash
#!/bin/bash
# Archivo: iniciar_stack_completo.sh

echo "🚀 INICIANDO STACK COMPLETO WAYUU TRANSLATOR"
echo "============================================"

# Directorio base
BASE_DIR="/home/fredy/Escritorio/wayuu-spanish-translator"

# Función para mostrar proceso
show_step() {
    echo -e "\n📋 $1"
    echo "$(printf '=%.0s' {1..50})"
}

show_step "PASO 1: Iniciando Stack de Monitoring"
cd "$BASE_DIR/monitoring"

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Iniciando Docker..."
    sudo systemctl start docker
    sleep 5
fi

# Iniciar servicios de monitoring
echo "🐳 Iniciando servicios Docker..."
docker-compose up -d

echo "⌛ Esperando servicios (30s)..."
sleep 30

show_step "PASO 2: Verificando Servicios de Monitoring"
docker-compose ps

show_step "PASO 3: Iniciando Backend NestJS"
cd "$BASE_DIR/backend"

# Verificar dependencias
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    pnpm install
fi

# Construir si no existe dist
if [ ! -d "dist" ]; then
    echo "🔨 Construyendo proyecto..."
    pnpm run build
fi

# Iniciar backend
echo "🚀 Iniciando Backend NestJS..."
pnpm run start:dev &

# Guardar PID para poder matarlo después
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

show_step "PASO 4: Verificando Servicios"
sleep 20

# Verificar todo
echo "🔍 Verificando servicios..."
cd "$BASE_DIR"
./verificar_stack.sh

show_step "PASO 5: URLs de Acceso"
echo "📊 Grafana:    http://localhost:3001 (admin/wayuu2024)"
echo "📈 Prometheus: http://localhost:9090"
echo "🚀 Backend:    http://localhost:3002/api/health"

echo -e "\n✅ Stack iniciado completamente!"
echo "Para detener el backend: kill $BACKEND_PID"
```

---

## 📊 Comandos de Verificación Manual

### **Verificación Rápida de Puertos**
```bash
# Verificar todos los puertos de una vez
echo "Verificando puertos..."
for port in 3001 3002 9090 9093 9100; do
    if curl -s http://localhost:$port > /dev/null; then
        echo "✅ Puerto $port: UP"
    else
        echo "❌ Puerto $port: DOWN"
    fi
done
```

### **Verificación de Prometheus Targets**
```bash
# Ver todos los targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastError: .lastError}'

# Verificar target específico del backend
curl -s 'http://localhost:9090/api/v1/query?query=up{job="wayuu-translator-backend"}' | jq '.data.result[0].value[1]'
```

### **Verificación de Métricas Backend**
```bash
# Health check
curl http://localhost:3002/api/health | jq .

# Métricas disponibles
curl -s http://localhost:3002/api/metrics | grep -E "^# HELP|^wayuu_" | head -10

# Endpoints específicos
curl http://localhost:3002/api/translation/health
curl http://localhost:3002/api/datasets/stats
```

### **Verificación de Grafana**
```bash
# Health de Grafana
curl http://localhost:3001/api/health

# Verificar datasources
curl -u admin:wayuu2024 http://localhost:3001/api/datasources

# Probar query simple
curl -u admin:wayuu2024 'http://localhost:3001/api/datasources/proxy/1/api/v1/query?query=up'
```

---

## 🚨 Troubleshooting por Componente

### **Backend NestJS No Inicia**
```bash
# Limpiar y reinstalar
cd backend
rm -rf node_modules dist
pnpm install
pnpm run build

# Verificar logs
tail -f logs/error.log

# Verificar puerto libre
lsof -i :3002
```

### **Prometheus No Ve Backend**
```bash
# Verificar configuración
cat monitoring/prometheus/prometheus.yml | grep -A 5 wayuu-translator-backend

# Verificar conectividad
curl -s http://localhost:3002/api/metrics | head -5

# Reiniciar Prometheus
cd monitoring
docker-compose restart prometheus
```

### **Grafana Sin Datos**
```bash
# Verificar datasource
curl -u admin:wayuu2024 http://localhost:3001/api/datasources

# Verificar conectividad a Prometheus
curl -u admin:wayuu2024 'http://localhost:3001/api/datasources/proxy/1/api/v1/query?query=up'

# Reiniciar Grafana
docker-compose restart grafana
```

---

## 📋 Checklist Final

### **Pre-verificación**
- [ ] Docker instalado y corriendo
- [ ] Node.js y pnpm instalados
- [ ] Puertos 3001, 3002, 9090, 9093, 9100 libres

### **Stack de Monitoring**
- [ ] `docker-compose ps` muestra 5 servicios UP
- [ ] Grafana accesible: http://localhost:3001
- [ ] Prometheus accesible: http://localhost:9090
- [ ] Targets visibles en Prometheus

### **Backend NestJS**
- [ ] Proceso corriendo: `ps aux | grep node | grep main`
- [ ] Puerto 3002 disponible: `lsof -i :3002`
- [ ] Health endpoint: `curl http://localhost:3002/api/health`
- [ ] Métricas endpoint: `curl http://localhost:3002/api/metrics`

### **Integración Completa**
- [ ] Prometheus ve backend: Target UP
- [ ] Métricas `wayuu_*` disponibles
- [ ] Grafana conecta a Prometheus
- [ ] Dashboard muestra datos (Time Range = 1h)

---

## 🎯 Estado Objetivo Final

### **Cuando Todo Funcione:**
```bash
./verificar_stack.sh
# Salida esperada:
# ✅ Todos los servicios UP
# ✅ Backend respondiendo
# ✅ Prometheus conectado
# ✅ Grafana con datos
# 🎉 Stack completo operativo
```

### **URLs Finales:**
- **Dashboard**: http://localhost:3001 (admin/wayuu2024)
- **Backend**: http://localhost:3002/api/health
- **Prometheus**: http://localhost:9090/targets
- **Métricas**: http://localhost:3002/api/metrics

---

*Documento creado: 18 Diciembre 2024 - Verificación automatizada* 🔧 
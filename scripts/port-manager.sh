#!/bin/bash
# Archivo: scripts/port-manager.sh
# Propósito: Gestión robusta de puertos para evitar conflictos EADDRINUSE

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración de puertos por defecto
BACKEND_PORT=${BACKEND_PORT:-3002}
FRONTEND_PORT=${FRONTEND_PORT:-4001}
FRONTEND_SIMPLE_PORT=${FRONTEND_SIMPLE_PORT:-4000}
GRAFANA_PORT=${GRAFANA_PORT:-3001}
PROMETHEUS_PORT=${PROMETHEUS_PORT:-9090}
ALERTMANAGER_PORT=${ALERTMANAGER_PORT:-9093}
NODE_EXPORTER_PORT=${NODE_EXPORTER_PORT:-9100}

# Función para mostrar ayuda
show_help() {
    echo "🔧 PORT MANAGER - Gestión de puertos para Wayuu Translator"
    echo "=========================================================="
    echo ""
    echo "Uso: $0 [COMANDO] [OPCIONES]"
    echo ""
    echo "COMANDOS:"
    echo "  check [puerto]     - Verificar estado de un puerto específico o todos"
    echo "  kill [puerto]      - Matar proceso en puerto específico"
    echo "  kill-all          - Matar todos los procesos en puertos del proyecto"
    echo "  clean             - Limpiar todos los puertos del proyecto"
    echo "  status            - Mostrar estado completo de puertos"
    echo "  prepare           - Preparar puertos antes de iniciar servicios"
    echo ""
    echo "PUERTOS DEL PROYECTO:"
    echo "  3002 - Backend NestJS"
    echo "  4001 - Frontend Next.js"
    echo "  4000 - Frontend Simple"
    echo "  3001 - Grafana"
    echo "  9090 - Prometheus"
    echo "  9093 - Alertmanager"
    echo "  9100 - Node Exporter"
    echo ""
    echo "Ejemplos:"
    echo "  $0 check 3002"
    echo "  $0 kill 3002"
    echo "  $0 clean"
    echo "  $0 prepare"
}

# Función para log con timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Función para verificar un puerto específico
check_port() {
    local port=$1
    
    if [ -z "$port" ]; then
        echo -e "${RED}❌ Error: Puerto no especificado${NC}"
        return 1
    fi
    
    # Verificar si el puerto está en uso
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -z "$pids" ]; then
        echo -e "${GREEN}✅ Puerto $port: LIBRE${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Puerto $port: EN USO${NC}"
        
        # Mostrar información detallada de los procesos
        echo "   Procesos usando el puerto:"
        lsof -i:$port 2>/dev/null | grep -v "^COMMAND" | while read line; do
            local cmd=$(echo "$line" | awk '{print $1}')
            local pid=$(echo "$line" | awk '{print $2}')
            local user=$(echo "$line" | awk '{print $3}')
            echo "     - PID: $pid, Usuario: $user, Comando: $cmd"
        done
        return 1
    fi
}

# Función para matar proceso en un puerto
kill_port() {
    local port=$1
    
    if [ -z "$port" ]; then
        echo -e "${RED}❌ Error: Puerto no especificado${NC}"
        return 1
    fi
    
    log "${YELLOW}🔍 Verificando puerto $port...${NC}"
    
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -z "$pids" ]; then
        log "${GREEN}✅ Puerto $port ya está libre${NC}"
        return 0
    fi
    
    log "${YELLOW}⚠️  Puerto $port está en uso. Terminando procesos...${NC}"
    
    # Intentar terminación graceful primero
    for pid in $pids; do
        if ps -p $pid > /dev/null 2>&1; then
            log "   Terminando proceso $pid gracefully..."
            kill -TERM $pid 2>/dev/null
        fi
    done
    
    # Esperar 3 segundos para terminación graceful
    sleep 3
    
    # Verificar si aún hay procesos
    pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        log "${RED}   Terminación graceful falló. Forzando terminación...${NC}"
        for pid in $pids; do
            if ps -p $pid > /dev/null 2>&1; then
                log "   Matando proceso $pid (SIGKILL)..."
                kill -9 $pid 2>/dev/null
            fi
        done
        
        # Esperar 2 segundos más
        sleep 2
    fi
    
    # Verificación final
    pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -z "$pids" ]; then
        log "${GREEN}✅ Puerto $port liberado exitosamente${NC}"
        return 0
    else
        log "${RED}❌ Error: No se pudo liberar el puerto $port${NC}"
        return 1
    fi
}

# Función para preparar puertos antes de iniciar servicios
prepare_ports() {
    echo -e "${BLUE}🚀 PREPARANDO PUERTOS PARA INICIO DE SERVICIOS${NC}"
    echo "=============================================="
    
    # Solo limpiar puertos que estén en uso
    ports=($BACKEND_PORT $FRONTEND_PORT $FRONTEND_SIMPLE_PORT)
    names=("Backend" "Frontend-Next" "Frontend-Simple")
    
    for i in "${!ports[@]}"; do
        port=${ports[$i]}
        name=${names[$i]}
        
        if ! check_port $port >/dev/null 2>&1; then
            echo "   Liberando puerto $port ($name)..."
            kill_port $port
        fi
    done
    
    echo ""
    echo -e "${GREEN}✅ Puertos preparados para inicio de servicios${NC}"
}

# Script principal
case "$1" in
    "check")
        if [ -n "$2" ]; then
            check_port "$2"
        else
            echo -e "${BLUE}🔍 VERIFICANDO PUERTOS DEL PROYECTO${NC}"
            echo "==================================="
            
            ports=($BACKEND_PORT $FRONTEND_PORT $FRONTEND_SIMPLE_PORT $GRAFANA_PORT $PROMETHEUS_PORT $ALERTMANAGER_PORT $NODE_EXPORTER_PORT)
            names=("Backend" "Frontend-Next" "Frontend-Simple" "Grafana" "Prometheus" "Alertmanager" "NodeExporter")
            
            for i in "${!ports[@]}"; do
                port=${ports[$i]}
                name=${names[$i]}
                
                printf "%-15s (:%s) " "$name" "$port"
                
                if check_port $port >/dev/null 2>&1; then
                    echo -e "${GREEN}LIBRE${NC}"
                else
                    echo -e "${RED}EN USO${NC}"
                fi
            done
        fi
        ;;
    "kill")
        if [ -n "$2" ]; then
            kill_port "$2"
        else
            echo -e "${RED}❌ Error: Especifica un puerto${NC}"
            echo "Uso: $0 kill [puerto]"
            exit 1
        fi
        ;;
    "prepare")
        prepare_ports
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando no reconocido: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
 
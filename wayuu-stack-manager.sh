#!/bin/bash
# ==============================================================================
# WAYUU SPANISH TRANSLATOR - STACK MANAGER
# ==============================================================================
# Descripción: Script profesional para gestión completa del stack
# Autor: Fredy Gallego - Seeed Technology
# Versión: 2.0.0
# Fecha: $(date '+%Y-%m-%d')
# ==============================================================================

set -euo pipefail  # Modo estricto: exit on error, undefined vars, pipe failures

# ==============================================================================
# CONFIGURACIÓN GLOBAL
# ==============================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_DIR="${SCRIPT_DIR}/logs"
readonly PID_DIR="${SCRIPT_DIR}/pids"
readonly CONFIG_FILE="${SCRIPT_DIR}/.wayuu-stack-config"

# Colores para output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# Configuración de servicios
declare -A SERVICES=(
    ["monitoring"]="3001,9090,9093,9100"
    ["backend"]="3002"
    ["frontend-static"]="4000"
    ["frontend-nextjs"]="4001"
)

declare -A SERVICE_NAMES=(
    ["monitoring"]="Stack de Monitoring (Docker)"
    ["backend"]="Backend NestJS"
    ["frontend-static"]="Frontend Estático (Python)"
    ["frontend-nextjs"]="Frontend Next.js"
)

# URLs de health check
declare -A HEALTH_URLS=(
    ["backend"]="http://localhost:3002/api/datasets/stats"
    ["frontend-static"]="http://localhost:4000"
    ["frontend-nextjs"]="http://localhost:4001"
    ["grafana"]="http://localhost:3001/api/health"
    ["prometheus"]="http://localhost:9090/-/healthy"
)

# ==============================================================================
# FUNCIONES DE UTILIDAD
# ==============================================================================

log() {
    local level="$1"
    shift
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local color=""
    
    case "$level" in
        "INFO")  color="$GREEN" ;;
        "WARN")  color="$YELLOW" ;;
        "ERROR") color="$RED" ;;
        "DEBUG") color="$BLUE" ;;
        *)       color="$NC" ;;
    esac
    
    echo -e "${color}[$timestamp] [$level]${NC} $*" | tee -a "$LOG_DIR/stack-manager.log"
}

show_header() {
    local title="$1"
    local width=80
    echo
    echo -e "${CYAN}$(printf '=%.0s' $(seq 1 $width))${NC}"
    printf "${WHITE}%-*s${NC}\n" $width "🚀 $title"
    echo -e "${CYAN}$(printf '=%.0s' $(seq 1 $width))${NC}"
}

show_step() {
    local step="$1"
    echo
    echo -e "${BLUE}📋 $step${NC}"
    echo -e "${BLUE}$(printf '=%.0s' {1..50})${NC}"
}

check_command() {
    local cmd="$1"
    if command -v "$cmd" &> /dev/null; then
        log "INFO" "✅ $cmd: Disponible"
        return 0
    else
        log "ERROR" "❌ $cmd: No encontrado"
        return 1
    fi
}

check_port() {
    local port="$1"
    if lsof -i ":$port" > /dev/null 2>&1; then
        return 0  # Puerto en uso
    else
        return 1  # Puerto libre
    fi
}

kill_port() {
    local port="$1"
    if check_port "$port"; then
        log "WARN" "Puerto $port en uso. Liberando..."
        lsof -ti ":$port" | xargs kill -9 2>/dev/null || true
        sleep 2
        if check_port "$port"; then
            log "ERROR" "No se pudo liberar el puerto $port"
            return 1
        fi
        log "INFO" "Puerto $port liberado"
    fi
    return 0
}

wait_for_url() {
    local url="$1"
    local timeout="${2:-30}"
    local interval="${3:-2}"
    local name="${4:-servicio}"
    
    log "INFO" "⌛ Esperando $name en $url (timeout: ${timeout}s)..."
    
    for (( i=0; i<timeout; i+=interval )); do
        if curl -s --connect-timeout 5 "$url" > /dev/null 2>&1; then
            log "INFO" "✅ $name respondiendo después de ${i}s"
            return 0
        fi
        sleep "$interval"
        printf "."
    done
    
    echo
    log "ERROR" "❌ $name no responde después de ${timeout}s"
    return 1
}

save_pid() {
    local service="$1"
    local pid="$2"
    echo "$pid" > "$PID_DIR/${service}.pid"
    log "INFO" "PID $pid guardado para $service"
}

load_pid() {
    local service="$1"
    local pid_file="$PID_DIR/${service}.pid"
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "$pid"
            return 0
        else
            rm -f "$pid_file"
        fi
    fi
    
    return 1
}

create_directories() {
    mkdir -p "$LOG_DIR" "$PID_DIR"
    log "INFO" "Directorios de trabajo creados"
}

# ==============================================================================
# FUNCIONES DE VERIFICACIÓN
# ==============================================================================

check_prerequisites() {
    show_step "VERIFICANDO PRE-REQUISITOS"
    
    local missing_tools=()
    
    # Verificar herramientas esenciales
    for tool in docker docker-compose pnpm curl lsof; do
        if ! check_command "$tool"; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log "ERROR" "Herramientas faltantes: ${missing_tools[*]}"
        log "ERROR" "Instale las herramientas faltantes antes de continuar"
        exit 1
    fi
    
    # Verificar que Docker esté corriendo
    if ! docker info > /dev/null 2>&1; then
        log "WARN" "Docker no está corriendo. Iniciando..."
        sudo systemctl start docker
        sleep 5
        if ! docker info > /dev/null 2>&1; then
            log "ERROR" "No se pudo iniciar Docker"
            exit 1
        fi
    fi
    
    log "INFO" "✅ Todos los pre-requisitos están listos"
}

# ==============================================================================
# FUNCIONES DE SERVICIOS
# ==============================================================================

start_monitoring() {
    show_step "INICIANDO STACK DE MONITORING"
    
    cd "$SCRIPT_DIR/monitoring"
    
    # Verificar y liberar puertos
    for port in 3001 9090 9093 9100; do
        kill_port "$port" || return 1
    done
    
    log "INFO" "🐳 Iniciando servicios Docker..."
    if docker-compose up -d; then
        log "INFO" "✅ Servicios de monitoring iniciados"
    else
        log "ERROR" "❌ Error iniciando servicios de monitoring"
        return 1
    fi
    
    # Esperar a que los servicios estén listos
    log "INFO" "⌛ Esperando servicios (30s)..."
    sleep 30
    
    # Verificar servicios
    local services_ok=true
    for port in 3001 9090 9100 9093; do
        if wait_for_url "http://localhost:$port" 10 1 "Puerto $port"; then
            log "INFO" "✅ Puerto $port: Disponible"
        else
            log "ERROR" "❌ Puerto $port: No disponible"
            services_ok=false
        fi
    done
    
    if [[ "$services_ok" == "false" ]]; then
        log "WARN" "⚠️  Algunos servicios de monitoring no están listos"
        return 1
    fi
    
    cd "$SCRIPT_DIR"
    return 0
}

prepare_backend() {
    show_step "PREPARANDO BACKEND NESTJS"
    
    cd "$SCRIPT_DIR/backend"
    
    # Verificar/instalar dependencias
    if [[ ! -d "node_modules" ]]; then
        log "INFO" "📦 Instalando dependencias..."
        if pnpm install; then
            log "INFO" "✅ Dependencias instaladas"
        else
            log "ERROR" "❌ Error instalando dependencias"
            return 1
        fi
    else
        log "INFO" "✅ Dependencias ya instaladas"
    fi
    
    # Verificar/construir proyecto
    if [[ ! -d "dist" ]] || [[ ! -f "dist/main.js" ]]; then
        log "INFO" "🔨 Construyendo proyecto..."
        if pnpm run build; then
            log "INFO" "✅ Proyecto construido"
        else
            log "ERROR" "❌ Error construyendo proyecto"
            return 1
        fi
    else
        log "INFO" "✅ Proyecto ya construido"
    fi
    
    cd "$SCRIPT_DIR"
    return 0
}

start_backend() {
    show_step "INICIANDO BACKEND NESTJS"
    
    kill_port 3002 || return 1
    
    cd "$SCRIPT_DIR/backend"
    
    log "INFO" "🚀 Iniciando Backend NestJS..."
    nohup pnpm run start:dev > "$LOG_DIR/backend.log" 2>&1 &
    local backend_pid=$!
    
    save_pid "backend" "$backend_pid"
    log "INFO" "Backend PID: $backend_pid"
    
    # Verificar que el backend responda
    if wait_for_url "${HEALTH_URLS[backend]}" 45 2 "Backend NestJS"; then
        log "INFO" "✅ Backend NestJS funcionando correctamente"
    else
        log "ERROR" "❌ Backend NestJS no responde"
        log "ERROR" "Ver logs: tail -f $LOG_DIR/backend.log"
        return 1
    fi
    
    cd "$SCRIPT_DIR"
    return 0
}

start_frontend_static() {
    show_step "INICIANDO FRONTEND ESTÁTICO"
    
    kill_port 4000 || return 1
    
    cd "$SCRIPT_DIR/frontend"
    
    # Verificar Python
    local python_cmd=""
    if command -v python3 &> /dev/null; then
        python_cmd="python3"
    elif command -v python &> /dev/null; then
        python_cmd="python"
    else
        log "ERROR" "❌ Python no encontrado"
        return 1
    fi
    
    log "INFO" "🌐 Iniciando Frontend Estático con $python_cmd..."
    nohup $python_cmd -m http.server 4000 > "$LOG_DIR/frontend-static.log" 2>&1 &
    local frontend_pid=$!
    
    save_pid "frontend-static" "$frontend_pid"
    log "INFO" "Frontend Estático PID: $frontend_pid"
    
    # Verificar que responda
    if wait_for_url "${HEALTH_URLS[frontend-static]}" 15 1 "Frontend Estático"; then
        log "INFO" "✅ Frontend Estático funcionando"
    else
        log "ERROR" "❌ Frontend Estático no responde"
        return 1
    fi
    
    cd "$SCRIPT_DIR"
    return 0
}

prepare_frontend_nextjs() {
    show_step "PREPARANDO FRONTEND NEXT.JS"
    
    cd "$SCRIPT_DIR/frontend-next"
    
    # Verificar/instalar dependencias
    if [[ ! -d "node_modules" ]]; then
        log "INFO" "📦 Instalando dependencias Next.js..."
        if pnpm install; then
            log "INFO" "✅ Dependencias Next.js instaladas"
        else
            log "ERROR" "❌ Error instalando dependencias Next.js"
            return 1
        fi
    else
        log "INFO" "✅ Dependencias Next.js ya instaladas"
    fi
    
    cd "$SCRIPT_DIR"
    return 0
}

start_frontend_nextjs() {
    show_step "INICIANDO FRONTEND NEXT.JS"
    
    kill_port 4001 || return 1
    
    cd "$SCRIPT_DIR/frontend-next"
    
    log "INFO" "⚛️  Iniciando Frontend Next.js..."
    nohup pnpm run dev > "$LOG_DIR/frontend-nextjs.log" 2>&1 &
    local nextjs_pid=$!
    
    save_pid "frontend-nextjs" "$nextjs_pid"
    log "INFO" "Frontend Next.js PID: $nextjs_pid"
    
    # Next.js toma más tiempo en iniciar
    if wait_for_url "${HEALTH_URLS[frontend-nextjs]}" 60 3 "Frontend Next.js"; then
        log "INFO" "✅ Frontend Next.js funcionando"
    else
        log "ERROR" "❌ Frontend Next.js no responde"
        log "ERROR" "Ver logs: tail -f $LOG_DIR/frontend-nextjs.log"
        return 1
    fi
    
    cd "$SCRIPT_DIR"
    return 0
}

# ==============================================================================
# FUNCIONES DE VERIFICACIÓN Y REPORTING
# ==============================================================================

verify_services() {
    show_step "VERIFICACIÓN FINAL DE SERVICIOS"
    
    local all_ok=true
    
    # Verificar cada servicio
    for service in monitoring backend frontend-static frontend-nextjs; do
        local service_name="${SERVICE_NAMES[$service]}"
        log "INFO" "🔍 Verificando $service_name..."
        
        case "$service" in
            "monitoring")
                if docker-compose -f monitoring/docker-compose.yml ps --filter status=running | grep -q wayuu; then
                    log "INFO" "✅ $service_name: Funcionando"
                else
                    log "ERROR" "❌ $service_name: No funcionando"
                    all_ok=false
                fi
                ;;
            *)
                if load_pid "$service" >/dev/null; then
                    log "INFO" "✅ $service_name: Funcionando (PID: $(load_pid "$service"))"
                else
                    log "ERROR" "❌ $service_name: No funcionando"
                    all_ok=false
                fi
                ;;
        esac
    done
    
    if [[ "$all_ok" == "true" ]]; then
        log "INFO" "🎉 ¡TODOS LOS SERVICIOS FUNCIONANDO CORRECTAMENTE!"
        return 0
    else
        log "ERROR" "⚠️  Algunos servicios presentan problemas"
        return 1
    fi
}

show_urls() {
    show_step "URLs DE ACCESO"
    
    echo -e "${WHITE}🔗 URLS PRINCIPALES:${NC}"
    echo
    echo -e "${GREEN}   Frontend Applications:${NC}"
    echo "   🌐 Frontend Estático:  http://localhost:4000"
    echo "      └─ Principal:       http://localhost:4000/index.html"
    echo "      └─ Herramientas:    http://localhost:4000/learning-tools.html"
    echo "      └─ Demo:            http://localhost:4000/demo.html"
    echo
    echo -e "   ⚛️  Frontend Next.js:   http://localhost:4001"
    echo "      └─ Herramientas:    http://localhost:4001/learning-tools"
    echo
    echo -e "${GREEN}   Backend Services:${NC}"
    echo "   🚀 Backend API:        http://localhost:3002"
    echo "   📊 API Metrics:       http://localhost:3002/api/metrics"
    echo "   📚 Dataset Stats:     http://localhost:3002/api/datasets/stats"
    echo "   🔤 Translation:       http://localhost:3002/api/translation/health"
    echo "   📖 API Docs:          http://localhost:3002/api/docs"
    echo
    echo -e "${GREEN}   Monitoring Stack:${NC}"
    echo "   📊 Grafana:           http://localhost:3001 (admin/wayuu2024)"
    echo "   📈 Prometheus:        http://localhost:9090"
    echo "   🎯 Prometheus Targets: http://localhost:9090/targets"
    echo "   🚨 AlertManager:      http://localhost:9093"
}

show_management_info() {
    show_step "INFORMACIÓN DE GESTIÓN"
    
    echo -e "${WHITE}📋 PIDs de Servicios:${NC}"
    for service in backend frontend-static frontend-nextjs; do
        if pid=$(load_pid "$service" 2>/dev/null); then
            echo "   ${SERVICE_NAMES[$service]}: $pid"
        fi
    done
    
    echo
    echo -e "${WHITE}📄 Archivos de Log:${NC}"
    echo "   Backend:         tail -f $LOG_DIR/backend.log"
    echo "   Frontend Static: tail -f $LOG_DIR/frontend-static.log"
    echo "   Frontend Next.js: tail -f $LOG_DIR/frontend-nextjs.log"
    echo "   Stack Manager:   tail -f $LOG_DIR/stack-manager.log"
    
    echo
    echo -e "${WHITE}🛠️  Comandos de Control:${NC}"
    echo "   Detener todo:    $0 stop"
    echo "   Reiniciar todo:  $0 restart"
    echo "   Ver estado:      $0 status"
    echo "   Ver logs:        $0 logs [servicio]"
}

create_stack_info() {
    local info_file="$SCRIPT_DIR/stack_info.txt"
    
    cat > "$info_file" << EOF
Wayuu Spanish Translator - Stack Information
============================================
Iniciado: $(date)
Versión: 2.0.0

PIDs de Servicios:
EOF

    for service in backend frontend-static frontend-nextjs; do
        if pid=$(load_pid "$service" 2>/dev/null); then
            echo "- ${SERVICE_NAMES[$service]}: $pid" >> "$info_file"
        fi
    done

    cat >> "$info_file" << EOF

URLs Principales:
- Frontend Estático:  http://localhost:4000
- Frontend Next.js:   http://localhost:4001
- Backend API:        http://localhost:3002
- Grafana Dashboard:  http://localhost:3001 (admin/wayuu2024)
- Prometheus:         http://localhost:9090

Comandos de Control:
- Detener servicios:  $0 stop
- Ver estado:         $0 status
- Ver logs:           $0 logs [servicio]

Logs:
- Stack Manager:      $LOG_DIR/stack-manager.log
- Backend:            $LOG_DIR/backend.log
- Frontend Static:    $LOG_DIR/frontend-static.log
- Frontend Next.js:   $LOG_DIR/frontend-nextjs.log
EOF

    log "INFO" "📄 Información guardada en: $info_file"
}

# ==============================================================================
# FUNCIONES DE GESTIÓN DE SERVICIOS
# ==============================================================================

stop_service() {
    local service="$1"
    local service_name="${SERVICE_NAMES[$service]}"
    
    log "INFO" "🛑 Deteniendo $service_name..."
    
    case "$service" in
        "monitoring")
            cd "$SCRIPT_DIR/monitoring"
            if docker-compose down; then
                log "INFO" "✅ $service_name detenido"
            else
                log "ERROR" "❌ Error deteniendo $service_name"
                return 1
            fi
            cd "$SCRIPT_DIR"
            ;;
        *)
            if pid=$(load_pid "$service" 2>/dev/null); then
                if kill "$pid" 2>/dev/null; then
                    log "INFO" "✅ $service_name detenido (PID: $pid)"
                    rm -f "$PID_DIR/${service}.pid"
                else
                    log "WARN" "⚠️  Forzando detención de $service_name"
                    kill -9 "$pid" 2>/dev/null || true
                    rm -f "$PID_DIR/${service}.pid"
                fi
            else
                log "INFO" "ℹ️  $service_name no está ejecutándose"
            fi
            ;;
    esac
    
    return 0
}

stop_all_services() {
    show_header "DETENIENDO TODOS LOS SERVICIOS"
    
    for service in frontend-nextjs frontend-static backend monitoring; do
        stop_service "$service"
    done
    
    log "INFO" "🎯 Todos los servicios han sido detenidos"
}

show_status() {
    show_header "ESTADO DE SERVICIOS"
    
    local all_running=true
    
    for service in monitoring backend frontend-static frontend-nextjs; do
        local service_name="${SERVICE_NAMES[$service]}"
        printf "%-30s" "$service_name:"
        
        case "$service" in
            "monitoring")
                if docker-compose -f monitoring/docker-compose.yml ps --filter status=running | grep -q wayuu; then
                    echo -e "${GREEN}✅ Funcionando${NC}"
                else
                    echo -e "${RED}❌ Detenido${NC}"
                    all_running=false
                fi
                ;;
            *)
                if pid=$(load_pid "$service" 2>/dev/null); then
                    if kill -0 "$pid" 2>/dev/null; then
                        echo -e "${GREEN}✅ Funcionando (PID: $pid)${NC}"
                    else
                        echo -e "${RED}❌ PID inválido${NC}"
                        rm -f "$PID_DIR/${service}.pid"
                        all_running=false
                    fi
                else
                    echo -e "${RED}❌ Detenido${NC}"
                    all_running=false
                fi
                ;;
        esac
    done
    
    echo
    if [[ "$all_running" == "true" ]]; then
        echo -e "${GREEN}🎉 Todos los servicios están funcionando${NC}"
    else
        echo -e "${YELLOW}⚠️  Algunos servicios están detenidos${NC}"
        echo -e "   Ejecute: ${WHITE}$0 start${NC} para iniciar todos los servicios"
    fi
}

show_logs() {
    local service="${1:-}"
    
    if [[ -z "$service" ]]; then
        echo -e "${YELLOW}Servicios disponibles para logs:${NC}"
        echo "  - backend"
        echo "  - frontend-static"
        echo "  - frontend-nextjs"
        echo "  - stack-manager"
        echo "  - monitoring"
        echo
        echo -e "Uso: ${WHITE}$0 logs [servicio]${NC}"
        return 1
    fi
    
    local log_file=""
    case "$service" in
        "backend")          log_file="$LOG_DIR/backend.log" ;;
        "frontend-static")  log_file="$LOG_DIR/frontend-static.log" ;;
        "frontend-nextjs")  log_file="$LOG_DIR/frontend-nextjs.log" ;;
        "stack-manager")    log_file="$LOG_DIR/stack-manager.log" ;;
        "monitoring")
            echo -e "${BLUE}📋 Logs de Monitoring (Docker Compose):${NC}"
            cd "$SCRIPT_DIR/monitoring"
            docker-compose logs --tail=50 -f
            return 0
            ;;
        *)
            log "ERROR" "Servicio desconocido: $service"
            return 1
            ;;
    esac
    
    if [[ -f "$log_file" ]]; then
        echo -e "${BLUE}📋 Logs de $service:${NC}"
        tail -f "$log_file"
    else
        log "ERROR" "Archivo de log no encontrado: $log_file"
        return 1
    fi
}

# ==============================================================================
# FUNCIÓN PRINCIPAL DE INICIO
# ==============================================================================

start_all_services() {
    show_header "WAYUU SPANISH TRANSLATOR - STACK MANAGER v2.0.0"
    
    create_directories
    log "INFO" "🚀 Iniciando stack completo Wayuu Translator"
    
    # Verificar pre-requisitos
    check_prerequisites || exit 1
    
    # Iniciar servicios en orden
    start_monitoring || { log "ERROR" "Fallo en monitoring"; exit 1; }
    prepare_backend || { log "ERROR" "Fallo preparando backend"; exit 1; }
    start_backend || { log "ERROR" "Fallo iniciando backend"; exit 1; }
    start_frontend_static || { log "ERROR" "Fallo iniciando frontend estático"; exit 1; }
    prepare_frontend_nextjs || { log "ERROR" "Fallo preparando frontend Next.js"; exit 1; }
    start_frontend_nextjs || { log "ERROR" "Fallo iniciando frontend Next.js"; exit 1; }
    
    # Verificación final
    verify_services || { log "WARN" "Algunos servicios presentan problemas"; }
    
    # Mostrar información
    show_urls
    show_management_info
    create_stack_info
    
    log "INFO" "🎉 ¡Stack iniciado completamente!"
    log "INFO" "🎯 Estado: LISTO PARA USO"
}

# ==============================================================================
# FUNCIÓN DE AYUDA
# ==============================================================================

show_help() {
    cat << EOF
$(echo -e "${WHITE}Wayuu Spanish Translator - Stack Manager v2.0.0${NC}")

$(echo -e "${GREEN}DESCRIPCIÓN:${NC}")
  Script profesional para gestión completa del stack Wayuu Translator.
  Incluye backend NestJS, frontend Next.js, frontend estático y monitoring.

$(echo -e "${GREEN}USO:${NC}")
  $0 [COMANDO] [OPCIONES]

$(echo -e "${GREEN}COMANDOS:${NC}")
  start      Iniciar todos los servicios
  stop       Detener todos los servicios  
  restart    Reiniciar todos los servicios
  status     Mostrar estado de servicios
  logs       Ver logs de un servicio específico
  help       Mostrar esta ayuda

$(echo -e "${GREEN}EJEMPLOS:${NC}")
  $0 start                    # Iniciar stack completo
  $0 stop                     # Detener todos los servicios
  $0 status                   # Ver estado actual
  $0 logs backend             # Ver logs del backend
  $0 logs frontend-nextjs     # Ver logs del frontend Next.js

$(echo -e "${GREEN}SERVICIOS GESTIONADOS:${NC}")
  - Stack de Monitoring (Docker): Grafana, Prometheus, AlertManager
  - Backend NestJS (puerto 3002): API principal
  - Frontend Estático (puerto 4000): Interface básica con Python
  - Frontend Next.js (puerto 4001): Interface avanzada con React

$(echo -e "${GREEN}URLS PRINCIPALES:${NC}")
  - Frontend Next.js:   http://localhost:4001
  - Frontend Estático:  http://localhost:4000
  - Backend API:        http://localhost:3002
  - Grafana:           http://localhost:3001 (admin/wayuu2024)
  - Prometheus:        http://localhost:9090

$(echo -e "${GREEN}ARCHIVOS:${NC}")
  - Logs:     ./logs/
  - PIDs:     ./pids/
  - Info:     ./stack_info.txt

$(echo -e "${GREEN}AUTOR:${NC}")
  Fredy Gallego - Seeed Technology
  
EOF
}

# ==============================================================================
# FUNCIÓN PRINCIPAL
# ==============================================================================

main() {
    local command="${1:-start}"
    
    case "$command" in
        "start")
            start_all_services
            ;;
        "stop")
            stop_all_services
            ;;
        "restart")
            stop_all_services
            sleep 3
            start_all_services
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "${2:-}"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo -e "${RED}Comando desconocido: $command${NC}"
            echo -e "Ejecute: ${WHITE}$0 help${NC} para ver la ayuda"
            exit 1
            ;;
    esac
}

# ==============================================================================
# EJECUCIÓN PRINCIPAL
# ==============================================================================

# Verificar que se ejecute desde el directorio correcto
cd "$SCRIPT_DIR"

# Ejecutar función principal con todos los argumentos
main "$@" 
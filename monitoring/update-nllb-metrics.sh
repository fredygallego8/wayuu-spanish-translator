#!/bin/bash

# =============================================================================
# Script para Actualizar Métricas de NLLB Automáticamente
# =============================================================================

# Configuración
BACKEND_URL="http://localhost:3002"
METRICS_ENDPOINT="$BACKEND_URL/api/metrics/nllb/update"
LOG_FILE="/var/log/nllb-metrics-update.log"
RETRY_COUNT=3
RETRY_DELAY=10
SUCCESS_COUNT=0
FAILURE_COUNT=0

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Función para mostrar mensajes con colores
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
    log "$message"
}

# Función para verificar si el backend está disponible
check_backend_health() {
    local health_endpoint="$BACKEND_URL/api/health"
    
    print_message $BLUE "🔍 Verificando salud del backend..."
    
    if curl -s "$health_endpoint" > /dev/null 2>&1; then
        print_message $GREEN "✅ Backend está disponible"
        return 0
    else
        print_message $RED "❌ Backend no está disponible en $BACKEND_URL"
        return 1
    fi
}

# Función para actualizar métricas con reintentos
update_metrics_with_retry() {
    local attempt=1
    
    while [ $attempt -le $RETRY_COUNT ]; do
        print_message $BLUE "📊 Actualizando métricas NLLB (Intento $attempt/$RETRY_COUNT)..."
        
        # Realizar la petición HTTP
        response=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -w "|||%{http_code}" \
            "$METRICS_ENDPOINT" 2>&1)
        
        http_code=$(echo "$response" | grep -o '[0-9]*$')
        response_body=$(echo "$response" | sed 's/|||[0-9]*$//')
        
        if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
            print_message $GREEN "✅ Métricas NLLB actualizadas exitosamente"
            
            # Parsear y mostrar información relevante
            if command -v jq &> /dev/null; then
                total_translations=$(echo "$response_body" | jq -r '.nllb_analytics.total_translations // "N/A"')
                avg_confidence=$(echo "$response_body" | jq -r '.nllb_analytics.average_confidence // "N/A"')
                cache_hit_rate=$(echo "$response_body" | jq -r '.nllb_analytics.cache_hit_rate // "N/A"')
                overall_quality=$(echo "$response_body" | jq -r '.nllb_analytics.overall_quality // "N/A"')
                
                print_message $GREEN "📈 Estadísticas Actualizadas:"
                print_message $GREEN "   • Total de traducciones: $total_translations"
                print_message $GREEN "   • Confianza promedio: $avg_confidence"
                print_message $GREEN "   • Tasa de cache hits: $cache_hit_rate%"
                print_message $GREEN "   • Calidad general: $overall_quality"
            fi
            
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            return 0
        else
            print_message $RED "❌ Error HTTP $http_code al actualizar métricas"
            log "Response body: $response_body"
            
            if [ $attempt -lt $RETRY_COUNT ]; then
                print_message $YELLOW "⏳ Esperando $RETRY_DELAY segundos antes del siguiente intento..."
                sleep $RETRY_DELAY
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    print_message $RED "❌ Falló la actualización de métricas después de $RETRY_COUNT intentos"
    return 1
}

# Función para mostrar estadísticas
show_statistics() {
    print_message $BLUE "📊 Estadísticas de ejecución:"
    print_message $GREEN "   • Actualizaciones exitosas: $SUCCESS_COUNT"
    print_message $RED "   • Actualizaciones fallidas: $FAILURE_COUNT"
    print_message $BLUE "   • Total de intentos: $((SUCCESS_COUNT + FAILURE_COUNT))"
}

# Función principal
main() {
    print_message $BLUE "🚀 Iniciando actualización de métricas NLLB..."
    print_message $BLUE "   • Endpoint: $METRICS_ENDPOINT"
    print_message $BLUE "   • Log file: $LOG_FILE"
    print_message $BLUE "   • Reintentos: $RETRY_COUNT"
    
    # Verificar que el backend esté disponible
    if ! check_backend_health; then
        print_message $RED "❌ No se puede continuar sin el backend disponible"
        exit 1
    fi
    
    # Actualizar métricas
    if update_metrics_with_retry; then
        print_message $GREEN "✅ Actualización completada exitosamente"
        exit 0
    else
        print_message $RED "❌ La actualización falló"
        exit 1
    fi
}

# Función para modo daemon/continuo
daemon_mode() {
    local interval=${1:-300} # 5 minutos por defecto
    
    print_message $BLUE "🔄 Iniciando modo daemon con intervalo de $interval segundos"
    
    while true; do
        main
        show_statistics
        print_message $BLUE "⏰ Esperando $interval segundos hasta la próxima actualización..."
        sleep $interval
    done
}

# Manejo de argumentos
case "${1:-}" in
    "daemon")
        daemon_mode ${2:-300}
        ;;
    "once")
        main
        ;;
    "help"|"-h"|"--help")
        echo "Uso: $0 [comando] [opciones]"
        echo ""
        echo "Comandos:"
        echo "  once              Ejecutar una sola vez (por defecto)"
        echo "  daemon [interval] Ejecutar continuamente cada [interval] segundos (por defecto: 300)"
        echo "  help              Mostrar esta ayuda"
        echo ""
        echo "Ejemplos:"
        echo "  $0                    # Ejecutar una vez"
        echo "  $0 once               # Ejecutar una vez"
        echo "  $0 daemon             # Ejecutar cada 5 minutos"
        echo "  $0 daemon 120         # Ejecutar cada 2 minutos"
        ;;
    *)
        main
        ;;
esac 
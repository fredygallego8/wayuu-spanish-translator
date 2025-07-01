# 📊 Stack de Monitoreo - Wayuu Translator

Este directorio contiene la configuración completa del stack de monitoreo para la aplicación Wayuu Translator, incluyendo Prometheus, Grafana, Node Exporter y Alertmanager.

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose instalados
- El backend del traductor Wayuu ejecutándose en `localhost:3002`

### Iniciar el Stack de Monitoreo

```bash
# Desde el directorio monitoring/
docker-compose up -d
```

### Verificar que todos los servicios estén corriendo

```bash
docker-compose ps
```

## 🌐 Acceso a los Servicios

| Servicio | URL | Credenciales | Descripción |
|----------|-----|--------------|-------------|
| **Grafana** | http://localhost:3001 | admin / wayuu2024 | Dashboards y visualizaciones |
| **Prometheus** | http://localhost:9090 | N/A | Base de datos de métricas |
| **Node Exporter** | http://localhost:9100 | N/A | Métricas del sistema |
| **Alertmanager** | http://localhost:9093 | N/A | Gestión de alertas |

## 📈 Dashboard Principal

El dashboard principal del traductor Wayuu incluye:

- **🔄 Tasa de Traducciones**: Traducciones por minuto por dirección
- **📊 Total de Traducciones**: Contador total acumulado
- **⚡ Tiempo de Respuesta**: Percentiles P50 y P95 de latencia
- **📚 Búsquedas en Diccionario**: Distribución de tipos de búsqueda
- **🌐 Tráfico HTTP**: Requests por endpoint y código de estado
- **💻 CPU y 🧠 Memoria**: Métricas del sistema

## 🔧 Configuración

### Prometheus
- **Configuración**: `prometheus/prometheus.yml`
- **Intervalo de scraping**: 15s (backend), 30s (otros)
- **Retención**: 30 días, máximo 10GB

### Grafana
- **Datasources**: Configurado automáticamente para Prometheus
- **Dashboards**: Provisioned automáticamente desde `grafana/dashboards/`
- **Plugins instalados**: piechart, worldmap, clock

### Métricas Personalizadas

El backend expone las siguientes métricas custom:

```
# Traducciones
wayuu_translations_total{direction, source_lang, target_lang, status}
wayuu_translation_duration_seconds{direction, source_lang, target_lang}
wayuu_translation_errors_total{error_type, direction}

# Diccionario
wayuu_dictionary_lookups_total{lookup_type, found}

# HTTP
wayuu_http_requests_total{method, route, status_code}
wayuu_http_request_duration_seconds{method, route, status_code}

# Sistema
wayuu_active_users
wayuu_sessions_total{session_type}
```

## 📊 Queries Útiles de Prometheus

### Tasa de Traducciones por Minuto
```promql
rate(wayuu_translations_total[5m])
```

### Latencia P95 de Traducciones
```promql
histogram_quantile(0.95, rate(wayuu_translation_duration_seconds_bucket[5m]))
```

### Tasa de Éxito de Traducciones
```promql
rate(wayuu_translations_total{status="success"}[5m]) / rate(wayuu_translations_total[5m]) * 100
```

### Requests HTTP por Segundo
```promql
rate(wayuu_http_requests_total[5m])
```

## 🛠️ Comandos Útiles

### Reiniciar solo Prometheus (después de cambiar configuración)
```bash
docker-compose restart prometheus
```

### Ver logs de Grafana
```bash
docker-compose logs -f grafana
```

### Detener todo el stack
```bash
docker-compose down
```

### Detener y eliminar volúmenes (CUIDADO: borra datos)
```bash
docker-compose down -v
```

### Actualizar configuración de Prometheus sin reiniciar
```bash
curl -X POST http://localhost:9090/-/reload
```

## 📱 Alertas (Opcional)

Para configurar alertas:

1. Crear reglas en `prometheus/rules/`
2. Configurar notificaciones en `alertmanager/alertmanager.yml`
3. Reiniciar los servicios

### Ejemplo de Regla de Alerta

```yaml
# prometheus/rules/wayuu-alerts.yml
groups:
  - name: wayuu-translator
    rules:
      - alert: HighTranslationLatency
        expr: histogram_quantile(0.95, rate(wayuu_translation_duration_seconds_bucket[5m])) > 2
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Alta latencia en traducciones"
          description: "P95 de latencia: {{ $value }}s"
```

## 🔍 Troubleshooting

### Prometheus no puede conectar al backend
- Verificar que el backend esté corriendo en puerto 3002
- Verificar que `/api/metrics` responda: `curl http://localhost:3002/api/metrics`

### Grafana no muestra datos
- Verificar que Prometheus esté recibiendo métricas: http://localhost:9090/targets
- Verificar la configuración del datasource en Grafana

### Permisos de Docker
```bash
sudo usermod -aG docker $USER
newgrp docker
```

## 📚 Recursos Adicionales

- [Documentación de Prometheus](https://prometheus.io/docs/)
- [Documentación de Grafana](https://grafana.com/docs/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)

---

**Nota**: Este stack está configurado para desarrollo. Para producción, considera:
- Configurar autenticación robusta
- Usar HTTPS
- Configurar respaldos de datos
- Implementar alta disponibilidad e
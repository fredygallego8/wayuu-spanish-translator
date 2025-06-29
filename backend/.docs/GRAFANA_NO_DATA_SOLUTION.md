# 🚨 Solución: "No data" en Grafana Dashboard - ACTUALIZADO

## 🎯 Problema Identificado: **EN PROGRESO** ⚠️

**Fecha**: 18 de Diciembre, 2024  
**Estado**: Stack de monitoring funcionando, falta aplicación backend  
**Causa Principal**: NestJS Backend no está corriendo  

---

## ✅ Estado Actual Verificado

### 🔍 **Servicios de Monitoring Verificados:**
- **📊 Grafana**: ✅ Funcionando (http://localhost:3001)
- **📈 Prometheus**: ✅ Funcionando (http://localhost:9090)  
- **📦 Node Exporter**: ✅ Funcionando (http://localhost:9100)
- **🚨 AlertManager**: ✅ Funcionando (http://localhost:9093)
- **🚀 NestJS Backend**: ❌ **NO CORRIENDO** (puerto 3002)

### 📊 **Puertos Confirmados:**
```bash
# Stack de Monitoring
Grafana:      http://localhost:3001  (admin/wayuu2024)
Prometheus:   http://localhost:9090
Node Exporter: http://localhost:9100
AlertManager: http://localhost:9093

# Aplicación Principal
Backend:      http://localhost:3002  ❌ NO DISPONIBLE
```

---

## 🔧 SOLUCIÓN PASO A PASO

### **Paso 1: Verificar Estado del Stack**

```bash
# Desde el directorio monitoring
cd /home/fredy/Escritorio/wayuu-spanish-translator/monitoring
docker-compose ps
```

**Resultado Esperado:**
```
wayuu-grafana         ✅ Up 
wayuu-prometheus      ✅ Up 
wayuu-node-exporter   ✅ Up 
wayuu-alertmanager    ✅ Up 
wayuu-renderer        ✅ Up 
```

### **Paso 2: Iniciar Aplicación Backend**

```bash
# Cambiar al directorio backend
cd /home/fredy/Escritorio/wayuu-spanish-translator/backend

# Verificar dependencias
pnpm install

# Construir proyecto
pnpm run build

# Iniciar aplicación
pnpm run start:dev
```

### **Paso 3: Verificar Aplicación Backend**

```bash
# Verificar proceso corriendo
ps aux | grep node | grep main

# Verificar puerto disponible
lsof -i :3002

# Probar endpoints
curl http://localhost:3002/api/health
curl http://localhost:3002/api/metrics | head -10
```

### **Paso 4: Verificar Prometheus Recolección**

```bash
# Verificar targets
curl -s 'http://localhost:9090/api/v1/query?query=up' | jq '.data.result[] | select(.metric.job=="wayuu-translator-backend")'

# Verificar métricas específicas
curl -s 'http://localhost:9090/api/v1/query?query=wayuu_translations_total'
```

### **Paso 5: Verificar Grafana Dashboard**

1. **Acceder a Grafana**: http://localhost:3001
2. **Login**: admin / wayuu2024
3. **Ajustar Time Range**: Last 1 hour (no 12 hours)
4. **Verificar en Explore**: http://localhost:3001/explore
5. **Query de prueba**: `up{job="wayuu-translator-backend"}`

---

## 🚨 Troubleshooting Específico

### **Error: pnpm run start:dev falla**

```bash
# Limpiar cache y reinstalar
cd backend
rm -rf node_modules dist
pnpm install
pnpm run build
pnpm run start:dev
```

### **Error: Puerto 3002 en uso**

```bash
# Encontrar proceso usando puerto
lsof -i :3002
# Matar proceso si necesario
kill -9 <PID>
```

### **Error: Prometheus no ve backend**

Verificar configuración en `monitoring/prometheus/prometheus.yml`:
```yaml
- job_name: 'wayuu-translator-backend'
  static_configs:
    - targets: ['localhost:3002']  # Debe ser localhost, no IP
```

### **Error: Grafana "No data"**

1. **Time Range**: Cambiar a "Last 1 hour"
2. **Refresh**: Configurar a "5s"
3. **Verificar datasource**: Settings → Data Sources → Prometheus
4. **URL correcta**: http://localhost:9090

---

## 📋 Checklist Completo de Verificación

### **Pre-requisitos**
- [ ] Docker y Docker Compose instalados
- [ ] Node.js y pnpm instalados
- [ ] Puertos 3001, 3002, 9090, 9093, 9100 libres

### **Stack de Monitoring**
- [ ] `docker-compose ps` muestra todos los servicios UP
- [ ] Grafana accesible en http://localhost:3001
- [ ] Prometheus accesible en http://localhost:9090
- [ ] Targets visibles en http://localhost:9090/targets

### **Aplicación Backend**
- [ ] `pnpm install` ejecutado sin errores
- [ ] `pnpm run build` exitoso
- [ ] `pnpm run start:dev` corriendo
- [ ] http://localhost:3002/api/health responde
- [ ] http://localhost:3002/api/metrics tiene datos

### **Integración Prometheus-Backend**
- [ ] Target `wayuu-translator-backend` UP en Prometheus
- [ ] Query `up{job="wayuu-translator-backend"}` = 1
- [ ] Métricas `wayuu_*` disponibles en Prometheus

### **Dashboard Grafana**
- [ ] Login exitoso (admin/wayuu2024)
- [ ] Time Range configurado a 1 hora
- [ ] Paneles muestran datos
- [ ] Explore funciona con queries básicas

---

## 🎯 Comandos Rápidos de Verificación

```bash
# Script de verificación completa
#!/bin/bash
echo "🔍 Verificando Stack Completo..."

# 1. Monitoring Stack
echo "📊 Checking Monitoring Stack..."
cd /home/fredy/Escritorio/wayuu-spanish-translator/monitoring
docker-compose ps

# 2. Backend Status
echo "🚀 Checking Backend..."
ps aux | grep node | grep main || echo "❌ Backend no corriendo"
curl -s http://localhost:3002/api/health && echo "✅ Backend respondiendo" || echo "❌ Backend no responde"

# 3. Prometheus Integration
echo "📈 Checking Prometheus..."
curl -s http://localhost:9090/api/v1/query?query=up | grep wayuu-translator-backend

# 4. Grafana Access
echo "📊 Checking Grafana..."
curl -s http://localhost:3001/api/health && echo "✅ Grafana UP" || echo "❌ Grafana DOWN"

echo "✅ Verificación completa"
```

---

## 💡 URLs de Acceso Rápido

### 📊 **Dashboards y Monitoring**
- **Grafana Dashboard**: http://localhost:3001 (admin/wayuu2024)
- **Grafana Explore**: http://localhost:3001/explore
- **Prometheus**: http://localhost:9090
- **Prometheus Targets**: http://localhost:9090/targets

### 🚀 **Aplicación Backend**
- **Health Check**: http://localhost:3002/api/health
- **Metrics**: http://localhost:3002/api/metrics
- **Translation Health**: http://localhost:3002/api/translation/health
- **Dataset Stats**: http://localhost:3002/api/datasets/stats

---

## 🎉 Estado Objetivo

### **✅ CUANDO TODO FUNCIONE CORRECTAMENTE:**

**Prometheus Targets:**
```
wayuu-translator-backend  ✅ UP
node-exporter            ✅ UP  
prometheus               ✅ UP
```

**Grafana Dashboard:**
```
- Request Rate: Datos visibles
- Response Time: Gráficos poblados
- System Metrics: Métricas del sistema
- Business Metrics: Contadores de traducción
```

**Backend Health:**
```json
{
  "status": "ok",
  "uptime": "120s",
  "metrics_available": true,
  "datasets_loaded": true
}
```

---

*Documento actualizado: 18 Diciembre 2024 - Troubleshooting en progreso* 🔧 
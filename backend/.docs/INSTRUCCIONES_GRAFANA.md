# 🚀 Guía Rápida: Resolver "No Data" en Grafana

## 🎯 Problema: Dashboard de Grafana muestra "No data"

### ✅ **SOLUCIÓN RÁPIDA** (2 minutos)

#### **1. Ejecutar Verificación Automática**
```bash
# Desde la raíz del proyecto
./verificar_stack.sh
```

#### **2. Si Backend NO está corriendo:**
```bash
# Iniciar backend
cd backend
pnpm run start:dev
```

#### **3. Acceder a Grafana con Time Range Correcto**
```
URL: http://localhost:3001
Usuario: admin
Contraseña: wayuu2024

⚠️ IMPORTANTE: Cambiar Time Range a "Last 1 hour" (no 12 hours)
```

---

## 🔧 **SOLUCIÓN AUTOMÁTICA COMPLETA**

### **Opción A: Inicio Automático** ⚡
```bash
# Inicia todo el stack automáticamente
./iniciar_stack.sh
```

### **Opción B: Paso a Paso** 🔍
```bash
# 1. Verificar estado actual
./verificar_stack.sh

# 2. Si servicios DOWN, iniciar monitoring
cd monitoring
docker-compose up -d

# 3. Iniciar backend
cd ../backend
pnpm run start:dev

# 4. Verificar nuevamente
cd ..
./verificar_stack.sh
```

---

## 📊 **URLs de Acceso**

| Servicio | URL | Credenciales |
|----------|-----|-------------|
| **🎯 Grafana** | http://localhost:3001 | admin / wayuu2024 |
| **📈 Prometheus** | http://localhost:9090 | - |
| **🚀 Backend** | http://localhost:3002/api/health | - |
| **📋 Targets** | http://localhost:9090/targets | - |

---

## ⚠️ **CAUSA PRINCIPAL: Time Range Incorrecto**

### **El problema más común:**
- Grafana muestra "Last 12 hours" por defecto
- Pero los datos son recientes (últimos minutos)
- **Solución**: Cambiar a "Last 1 hour" o "Last 30 minutes"

### **Pasos en Grafana:**
1. Acceder: http://localhost:3001
2. Login: admin / wayuu2024
3. **Click en Time Range** (esquina superior derecha)
4. **Seleccionar "Last 1 hour"**
5. **Refresh: "5s"**

---

## 🔍 **Verificación Rápida**

### **Comando de Diagnóstico:**
```bash
# Verificar todos los puertos
for port in 3001 3002 9090 9093 9100; do
  curl -s http://localhost:$port >/dev/null && echo "✅ $port UP" || echo "❌ $port DOWN"
done
```

### **Verificar Backend Específicamente:**
```bash
# Health check
curl http://localhost:3002/api/health

# Métricas disponibles
curl http://localhost:3002/api/metrics | head -10
```

### **Verificar Prometheus Targets:**
```bash
# Ver targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[].labels.job'

# Verificar backend específico
curl -s 'http://localhost:9090/api/v1/query?query=up{job="wayuu-translator-backend"}'
```

---

## 🚨 **Troubleshooting Rápido**

### **Si Backend no inicia:**
```bash
cd backend
rm -rf node_modules dist
pnpm install
pnpm run build
pnpm run start:dev
```

### **Si Prometheus no ve Backend:**
```bash
# Verificar configuración
cat monitoring/prometheus/prometheus.yml | grep -A 3 wayuu-translator-backend

# Reiniciar Prometheus
cd monitoring
docker-compose restart prometheus
```

### **Si Grafana sin datos:**
```bash
# Verificar datasource
curl -u admin:wayuu2024 http://localhost:3001/api/datasources

# Usar Explore para debugging
# URL: http://localhost:3001/explore
# Query: up
```

---

## 📋 **Checklist Rápido**

- [ ] ✅ `./verificar_stack.sh` muestra 5/5 servicios UP
- [ ] ✅ Backend responde: `curl http://localhost:3002/api/health`
- [ ] ✅ Prometheus ve backend: Target UP en http://localhost:9090/targets
- [ ] ✅ Grafana accesible: http://localhost:3001 (admin/wayuu2024)
- [ ] ✅ Time Range configurado a "Last 1 hour"
- [ ] ✅ Dashboard muestra datos

---

## 🎉 **Estado Final Esperado**

### **Cuando todo funciona:**
```bash
./verificar_stack.sh
# Output esperado:
# 🎉 ¡TODOS LOS SERVICIOS FUNCIONANDO!
# ✅ Stack completo operativo
# 📊 Dashboards disponibles en: http://localhost:3001
```

### **Dashboard con Datos:**
- Gráficos poblados con métricas
- Paneles mostrando datos en tiempo real
- Sin mensajes de "No data"

---

## 💡 **Documentación Completa**

- **Verificación Detallada**: `backend/.docs/VERIFICACION_STACK_COMPLETA.md`
- **Solución Completa**: `backend/.docs/GRAFANA_NO_DATA_SOLUTION.md`
- **Setup Original**: `backend/.docs/GRAFANA_MONITORING_SETUP_COMPLETE.md`

---

*Guía actualizada: 18 Diciembre 2024* 🔧 
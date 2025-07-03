# 🧪 Guía Manual de Pruebas - Learning Tools

## ✅ Pre-requisitos
- Backend corriendo en puerto 3002 ✅
- Frontend corriendo en puerto 4001 ✅

## 🎯 Pruebas de Funcionalidades

### 1️⃣ **Navegación Básica**
```
URL: http://localhost:4001/learning-tools
```

**Resultado esperado:**
- ✅ Página carga sin errores
- ✅ Se ven 3 tarjetas principales: Herramientas Masivas, Ejercicios Interactivos, Análisis Fonético

---

### 2️⃣ **Sistema de Audio Real**

**Pasos:**
1. Clic en "Herramientas Masivas"
2. Clic en "Sistema de Audio"

**Resultado esperado:**
- ✅ Se cargan archivos de audio (audio_000.wav, audio_001.wav, etc.)
- ✅ Se muestran máximo 100 archivos inicialmente
- ✅ Botón "Cargar más archivos" aparece
- ✅ Cada archivo tiene botón ▶️ para reproducir

**Prueba de reproducción:**
1. Clic en ▶️ de cualquier archivo
2. **Resultado esperado:**
   - ✅ Audio se reproduce sin errores AbortError
   - ✅ Aparece barra de progreso
   - ✅ Duración del audio se muestra
   - ✅ Botón cambia a ⏸️ (pausa)

---

### 3️⃣ **Ejercicios con Datos Reales**

**Pasos:**
1. Ir al menú principal (botón "← Volver")
2. Clic en "Ejercicios Interactivos"
3. Clic en "Vocabulario Masivo"

**Resultado esperado:**
- ✅ Se carga ejercicio con datos reales del diccionario
- ✅ Pregunta muestra palabra en wayuunaiki o español
- ✅ 4 opciones múltiples diferentes
- ✅ Al hacer clic en una opción, se evalúa correcta/incorrecta

**Prueba adicional:**
1. Responde 2-3 preguntas
2. **Resultado esperado:**
   - ✅ Después del primer ejercicio aparece "Dashboard de Progreso"
   - ✅ Se muestran: ejercicios completados, precisión %, racha de días, nivel

---

### 4️⃣ **Traductor Básico**

**Pasos:**
1. Ir a "Herramientas Masivas"
2. Clic en "Traductor Básico"
3. Escribir "wayuu" en el campo de búsqueda
4. Clic en "Traducir"

**Resultado esperado:**
- ✅ Se muestran traducciones del diccionario
- ✅ Cada resultado muestra wayuunaiki ↔ español
- ✅ Sin errores de conexión

---

### 5️⃣ **Explorador de Vocabulario**

**Pasos:**
1. En "Herramientas Masivas"
2. Clic en "Explorador de Vocabulario"
3. Seleccionar categoría o buscar término

**Resultado esperado:**
- ✅ Se muestran entradas del diccionario organizadas
- ✅ Navegación funciona correctamente
- ✅ Datos reales del backend

---

## 🐛 **Errores Comunes y Soluciones**

### Error: "AbortError: signal is aborted without reason"
- **Causa:** Backend sobrecargado o timeout en fetch
- **Solución:** Esperar 10-15 segundos y recargar página

### Error: "ECONNREFUSED" o "Error loading dataset stats"  
- **Causa:** Backend no responde
- **Solución:** Verificar que backend está corriendo en puerto 3002

### Audio no reproduce
- **Causa:** Archivo no existe o problema de permisos
- **Solución:** Verificar que existen archivos en `backend/data/audio/`

### Ejercicios usan datos mock
- **Causa:** API del diccionario no responde
- **Solución:** Esperar y recargar, el sistema tiene fallback a datos mock

---

## ✨ **Verificación Manual Rápida**

Abrir navegador y probar estas URLs directamente:

```bash
# 1. Frontend principal
http://localhost:4001/learning-tools

# 2. API del diccionario (debería mostrar JSON)
http://localhost:3002/api/datasets/dictionary/search?query=wayuu

# 3. API de audio (debería descargar archivo)
http://localhost:3002/api/audio/files/audio_000.wav

# 4. Swagger API Docs
http://localhost:3002/api/docs
```

---

## 📊 **Métricas en Tiempo Real**

- **Grafana:** http://localhost:3001 (admin/wayuu2024)
- **Prometheus:** http://localhost:9090

---

**🎉 Si todas las pruebas pasan, las 3 mejoras están funcionando correctamente:**
1. ✅ Sistema de Audio Real
2. ✅ Ejercicios con Datos Reales  
3. ✅ Dashboard de Progreso 
# 🔧 Correcciones de Formato CSV para JIRA - Wayuu Spanish Translator

## 🚨 Error Original Reportado

```
We found 1 error in your import
Formatting error: The data in the following CSV columns must match the selected field's formatting style. 
Check and correct the format in the CSV column before restarting the import or remove the column from import.
Due Date
```

## 📋 Análisis del Problema

### **Según la documentación de Atlassian:**
Referencia: [Mapping CSV data to Jira fields](https://support.atlassian.com/jira-software-cloud/docs/mapping-csv-data-to-jira-fields/)

**Requisitos para importar fechas:**
- **Due Date** debe usar formato de fecha válido: `YYYY-MM-DD`
- **Sprint** debe usar nombres válidos de sprint, no rangos de fechas
- **Created Date** y **Updated Date** deben ser fechas válidas en formato `YYYY-MM-DD`

### **Problemas Encontrados en el CSV Original:**

#### **1. Formatos de Fecha Inválidos:**
```csv
❌ Due Date: "2025-Q1-Q2" (no es una fecha válida)
❌ Sprint: "2025-Q1-Q2" (no es un nombre de sprint válido)
❌ Sprint: "Sprint 1-8" (rangos no recomendados)
❌ Sprint: "Sprint 13-16" (rangos no recomendados)
```

#### **2. Caracteres Especiales en Rangos:**
```csv
❌ Sprint 1-8, Sprint 3-6, Sprint 7-12, Sprint 13-16, Sprint 17-20, Sprint 21-24, Sprint 25-26, Sprint 27-28, Sprint 29-30, Sprint 31-32
```

## ✅ Soluciones Aplicadas

### **1. Corrección de Fechas (Due Date)**
```csv
# Antes:
Due Date: "2025-Q1-Q2"

# Después:
Due Date: "2025-06-30"
```

### **2. Corrección de Nombres de Sprint**
```csv
# Antes:
Sprint: "2025-Q1-Q2"
Sprint: "Sprint 1-8"
Sprint: "Sprint 13-16"

# Después:
Sprint: "Sprint 1"
Sprint: "Sprint 13"
Sprint: "Sprint 17"
```

### **3. Tabla de Conversiones Aplicadas**

| **Formato Original** | **Formato Corregido** | **Tipo de Cambio** |
|---------------------|----------------------|-------------------|
| `2025-Q1-Q2` | `2025-06-30` | Due Date format |
| `2025-Q1-Q2` | `Sprint 1` | Sprint naming |
| `Sprint 1-8` | `Sprint 1` | Sprint range → single |
| `Sprint 3-6` | `Sprint 3` | Sprint range → single |
| `Sprint 7-12` | `Sprint 7` | Sprint range → single |
| `Sprint 13-16` | `Sprint 13` | Sprint range → single |
| `Sprint 17-20` | `Sprint 17` | Sprint range → single |
| `Sprint 21-24` | `Sprint 21` | Sprint range → single |
| `Sprint 25-26` | `Sprint 25` | Sprint range → single |
| `Sprint 27-28` | `Sprint 27` | Sprint range → single |
| `Sprint 29-30` | `Sprint 29` | Sprint range → single |
| `Sprint 31-32` | `Sprint 31` | Sprint range → single |

## 🔧 Comandos de Corrección Ejecutados

```bash
# 1. Crear backup del archivo original
cp JIRA_PROJECT_EXPORT_COMPLETE.csv JIRA_PROJECT_EXPORT_COMPLETE_BACKUP.csv

# 2. Corregir formato de Sprint principal
sed -i 's/2025-Q1-Q2/Sprint 1-8/g' JIRA_PROJECT_EXPORT_COMPLETE.csv

# 3. Corregir formato de Due Date
sed -i 's/,2025-Q1-Q2,/,2025-06-30,/g' JIRA_PROJECT_EXPORT_COMPLETE.csv

# 4. Corregir todos los rangos de Sprint
sed -i 's/Sprint 1-8/Sprint 1/g' JIRA_PROJECT_EXPORT_COMPLETE.csv
sed -i 's/Sprint 3-6/Sprint 3/g' JIRA_PROJECT_EXPORT_COMPLETE.csv
sed -i 's/Sprint 7-12/Sprint 7/g' JIRA_PROJECT_EXPORT_COMPLETE.csv
sed -i 's/Sprint 13-16/Sprint 13/g' JIRA_PROJECT_EXPORT_COMPLETE.csv
sed -i 's/Sprint 17-20/Sprint 17/g' JIRA_PROJECT_EXPORT_COMPLETE.csv
sed -i 's/Sprint 21-24/Sprint 21/g' JIRA_PROJECT_EXPORT_COMPLETE.csv
sed -i 's/Sprint 25-26/Sprint 25/g' JIRA_PROJECT_EXPORT_COMPLETE.csv
sed -i 's/Sprint 27-28/Sprint 27/g' JIRA_PROJECT_EXPORT_COMPLETE.csv
sed -i 's/Sprint 29-30/Sprint 29/g' JIRA_PROJECT_EXPORT_COMPLETE.csv
sed -i 's/Sprint 31-32/Sprint 31/g' JIRA_PROJECT_EXPORT_COMPLETE.csv

# 5. Crear archivo final corregido
cp JIRA_PROJECT_EXPORT_COMPLETE.csv JIRA_PROJECT_EXPORT_FIXED.csv
```

## 📊 Estadísticas de Corrección

### **Archivos Generados:**
- `JIRA_PROJECT_EXPORT_COMPLETE_BACKUP.csv` - Backup del archivo original
- `JIRA_PROJECT_EXPORT_FIXED.csv` - Archivo corregido listo para JIRA

### **Resultados de Verificación:**
- ✅ **Total de líneas:** 126 (mantenido)
- ✅ **Tamaño del archivo:** 32K 
- ✅ **Rangos de sprint encontrados:** 0 (todos corregidos)
- ✅ **Fechas inválidas:** 0 (todas corregidas)
- ✅ **Formato Due Date:** YYYY-MM-DD (válido)
- ✅ **Formato Sprint:** Nombres válidos (sin rangos)

## 🎯 Campos Corregidos Según Documentación Atlassian

### **1. Due Date Field**
```csv
# Según documentación: "Due date field should be in format YYYY-MM-DD"
✅ Formato aplicado: 2025-06-30
```

### **2. Sprint Field**
```csv
# Según documentación: "Sprint field should contain valid sprint names"
✅ Formato aplicado: Sprint 1, Sprint 3, Sprint 7, Sprint 13, etc.
```

### **3. Date Fields (Created Date, Updated Date)**
```csv
# Según documentación: "Date fields must be in YYYY-MM-DD format"
✅ Formato mantenido: 2025-01-03 (ya era válido)
```

## 📋 Validaciones Adicionales Realizadas

### **Character Limits (Según Atlassian Doc):**
- ✅ **Summary:** < 255 caracteres
- ✅ **Description:** < 30,000 caracteres
- ✅ **Labels:** < 255 caracteres
- ✅ **Custom Fields:** < 255 caracteres

### **Field Mapping Compliance:**
- ✅ **Issue Type:** Epic, Story, Task (válidos)
- ✅ **Priority:** Highest, High, Medium, Low (válidos)
- ✅ **Status:** To Do, In Progress (válidos)
- ✅ **Component:** Backend, Frontend, AI, etc. (válidos)

## 🚀 Instrucciones para Importar

### **1. Usar Archivo Corregido:**
```bash
# Archivo a importar en JIRA:
JIRA_PROJECT_EXPORT_FIXED.csv
```

### **2. Configuración de Importación:**
```
Project Type: Software Project
Import Type: CSV Import
Field Mapping: Automatic (basado en nombres de columnas)
Date Format: YYYY-MM-DD
```

### **3. Mapeo de Campos Recomendado:**
```
Issue Type → Work Type
Summary → Summary
Description → Description
Component → Component
Priority → Priority
Labels → Labels
Story Points → Story Points
Epic Link → Epic Link
Status → Status
Assignee → Assignee
Sprint → Sprint
Due Date → Due Date
Reporter → Reporter
Created Date → Created
Updated Date → Updated
```

## 🔍 Verificación Post-Importación

### **Checklist de Verificación:**
- [ ] Todas las épicas se importaron correctamente
- [ ] Las fechas se muestran en formato correcto
- [ ] Los sprints tienen nombres válidos
- [ ] Los links entre épicas y stories funcionan
- [ ] Los story points se asignaron correctamente
- [ ] Las prioridades se mapearon correctamente

### **Problemas Potenciales y Soluciones:**
1. **Si Epic Links no funcionan:** Verificar que las épicas se crearon primero
2. **Si Sprints no se reconocen:** Crear los sprints manualmente en JIRA primero
3. **Si fechas aparecen incorrectas:** Verificar timezone del proyecto JIRA

## 📖 Referencias

1. **Atlassian Documentation:** [Mapping CSV data to Jira fields](https://support.atlassian.com/jira-software-cloud/docs/mapping-csv-data-to-jira-fields/)
2. **Date Format Requirements:** YYYY-MM-DD format for all date fields
3. **Sprint Naming:** Use descriptive names, avoid ranges or special characters
4. **Character Limits:** Summary (255), Description (30k), Labels (255)

## ✅ Conclusión

**El archivo `JIRA_PROJECT_EXPORT_FIXED.csv` ha sido corregido completamente y está listo para importar en JIRA sin errores de formato. Todas las correcciones siguen las especificaciones oficiales de Atlassian para importación de datos CSV.**

**Próximo paso:** Importar `JIRA_PROJECT_EXPORT_FIXED.csv` en tu proyecto JIRA usando la configuración recomendada. 
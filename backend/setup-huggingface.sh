#!/bin/bash

# 🔑 Script de Configuración de Hugging Face API Key
# Wayuu Spanish Translator - Backend Setup

set -e

echo "🔑 Configuración de Hugging Face API Key"
echo "========================================"
echo

# Verificar si ya existe un archivo .env
if [ -f ".env" ]; then
    echo "📄 Archivo .env encontrado"
    
    # Verificar si ya existe la API key
    if grep -q "HUGGINGFACE_API_KEY=" .env; then
        echo "🔍 HUGGINGFACE_API_KEY ya existe en .env"
        
        # Extraer la clave actual (sin mostrarla completa)
        current_key=$(grep "HUGGINGFACE_API_KEY=" .env | cut -d'=' -f2 | sed 's/^"//' | sed 's/"$//')
        if [ ${#current_key} -gt 10 ]; then
            echo "🔑 Clave actual: ${current_key:0:7}...${current_key: -4}"
        else
            echo "🔑 Clave actual: $current_key"
        fi
        
        echo
        read -p "¿Deseas actualizar la clave? (y/N): " update_key
        if [[ $update_key =~ ^[Yy]$ ]]; then
            echo "🔄 Actualizando clave..."
        else
            echo "✅ Manteniendo clave actual"
            exit 0
        fi
    else
        echo "➕ Agregando HUGGINGFACE_API_KEY al archivo .env existente"
    fi
else
    echo "📝 Creando nuevo archivo .env"
    touch .env
fi

echo
echo "🌐 Para obtener tu token de Hugging Face:"
echo "   1. Ve a: https://huggingface.co/settings/tokens"
echo "   2. Crea un nuevo token (tipo 'Read' es suficiente)"
echo "   3. Copia tu token (debe empezar con 'hf_')"
echo

# Solicitar la API key de forma segura
echo -n "🔑 Ingresa tu Hugging Face API Key: "
read -s api_key
echo

# Validar formato básico
if [[ ! $api_key =~ ^hf_ ]]; then
    echo "⚠️  ADVERTENCIA: El token debería empezar con 'hf_'"
    echo "   Verifica que hayas copiado correctamente el token"
    echo
    read -p "¿Continuar de todos modos? (y/N): " continue_anyway
    if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
        echo "❌ Cancelado por el usuario"
        exit 1
    fi
fi

# Validar longitud mínima
if [ ${#api_key} -lt 20 ]; then
    echo "⚠️  ADVERTENCIA: El token parece demasiado corto"
    echo "   Los tokens de Hugging Face suelen ser más largos"
    echo
    read -p "¿Continuar de todos modos? (y/N): " continue_anyway
    if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
        echo "❌ Cancelado por el usuario"
        exit 1
    fi
fi

# Configurar la API key en el archivo .env
if grep -q "HUGGINGFACE_API_KEY=" .env; then
    # Actualizar clave existente
    sed -i "s/HUGGINGFACE_API_KEY=.*/HUGGINGFACE_API_KEY=$api_key/" .env
    echo "🔄 Clave actualizada en .env"
else
    # Agregar nueva clave
    echo "HUGGINGFACE_API_KEY=$api_key" >> .env
    echo "➕ Clave agregada a .env"
fi

# Verificar configuración
echo
echo "✅ Configuración completada"
echo "🔑 Token configurado: ${api_key:0:7}...${api_key: -4}"

# Verificar si el backend está corriendo
if curl -s http://localhost:3002/api/nllb/service/info > /dev/null 2>&1; then
    echo "🔄 Backend detectado corriendo - reiniciando para aplicar cambios..."
    
    # Intentar reiniciar el backend
    if pgrep -f "nest start" > /dev/null; then
        echo "🛑 Deteniendo procesos existentes..."
        pkill -f "nest start" || true
        pkill -f "node.*dist" || true
        sleep 2
    fi
    
    echo "🚀 Iniciando backend con nueva configuración..."
    pnpm run start:dev &
    sleep 5
    
    # Verificar que el servicio esté funcionando
    echo "🔍 Verificando servicio NLLB..."
    if curl -s http://localhost:3002/api/nllb/service/info | grep -q "nllb"; then
        echo "✅ Servicio NLLB funcionando correctamente"
    else
        echo "⚠️  El servicio se está iniciando - puede tardar unos momentos"
    fi
else
    echo "🚀 Para iniciar el backend con la nueva configuración:"
    echo "   pnpm run start:dev"
fi

echo
echo "🛠️  Para verificar la configuración:"
echo "   curl http://localhost:3002/api/nllb/service/info"
echo
echo "🎯 Para probar una traducción demo:"
echo "   curl -X POST http://localhost:3002/api/nllb/translate/demo \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"text\": \"Hola mundo\", \"sourceLang\": \"spanish\", \"targetLang\": \"wayuu\"}'"
echo

# Limpiar la variable de la memoria
unset api_key 
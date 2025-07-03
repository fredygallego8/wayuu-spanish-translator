#!/usr/bin/env node

/**
 * 🔍 Script de Verificación de Métricas - Wayuu Spanish Translator
 * 
 * Este script verifica el estado de las métricas y las recupera automáticamente si están en 0.
 * Útil para diagnóstico y recuperación manual.
 * 
 * Uso:
 *   node scripts/verify-metrics.js
 *   npm run metrics:verify
 */

const http = require('http');

const BASE_URL = 'http://localhost:3002';

// Función helper para hacer peticiones HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            data: res.headers['content-type']?.includes('application/json') 
              ? JSON.parse(data) 
              : data
          };
          resolve(result);
        } catch (error) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Verificar si el backend está corriendo
async function checkBackendHealth() {
  console.log('🔍 Verificando estado del backend...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/docs`);
    if (response.statusCode === 200) {
      console.log('✅ Backend está corriendo');
      return true;
    } else {
      console.log('❌ Backend no está respondiendo correctamente');
      return false;
    }
  } catch (error) {
    console.log('❌ Backend no está accesible:', error.message);
    return false;
  }
}

// Verificar métricas específicas
async function checkMetricsHealth() {
  console.log('🩺 Verificando estado de métricas de crecimiento...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/metrics/growth/health`);
    
    if (response.statusCode === 200 && response.data) {
      const health = response.data;
      
      console.log(`📊 Estado: ${health.status}`);
      console.log(`⏰ Última actualización: ${health.last_update}`);
      console.log(`🔢 Métricas actuales:`);
      console.log(`   - Palabras Wayuu: ${health.metrics_status.wayuu_words}`);
      console.log(`   - Palabras Español: ${health.metrics_status.spanish_words}`);
      console.log(`   - Minutos de Audio: ${health.metrics_status.audio_minutes}`);
      console.log(`   - Frases: ${health.metrics_status.phrases}`);
      console.log(`   - Transcripciones: ${health.metrics_status.transcribed}`);
      console.log(`   - Entradas Diccionario: ${health.metrics_status.dictionary_entries}`);
      console.log(`   - Archivos Audio: ${health.metrics_status.audio_files}`);
      
      if (health.warnings.length > 0) {
        console.log('⚠️ Advertencias:');
        health.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
      
      return health.is_healthy;
    } else {
      console.log('❌ Error obteniendo estado de métricas');
      return false;
    }
  } catch (error) {
    console.log('❌ Error verificando métricas:', error.message);
    return false;
  }
}

// Actualizar métricas de crecimiento
async function updateGrowthMetrics() {
  console.log('🔄 Actualizando métricas de crecimiento...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/metrics/growth/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.statusCode === 200 && response.data) {
      const result = response.data;
      console.log('✅ Métricas actualizadas exitosamente:');
      console.log(`   - Palabras Wayuu: ${result.metrics.total_wayuu_words}`);
      console.log(`   - Palabras Español: ${result.metrics.total_spanish_words}`);
      console.log(`   - Minutos Audio: ${result.metrics.total_audio_minutes}`);
      console.log(`   - Frases: ${result.metrics.total_phrases}`);
      console.log(`   - Transcripciones: ${result.metrics.total_transcribed}`);
      console.log(`   - Entradas Diccionario: ${result.metrics.total_dictionary_entries}`);
      console.log(`   - Archivos Audio: ${result.metrics.total_audio_files}`);
      return true;
    } else {
      console.log('❌ Error actualizando métricas');
      return false;
    }
  } catch (error) {
    console.log('❌ Error en actualización:', error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 === Verificación de Métricas Wayuu Spanish Translator ===\n');
  
  // 1. Verificar backend
  const backendOk = await checkBackendHealth();
  if (!backendOk) {
    console.log('\n❌ No se puede continuar sin el backend. Inicia el servidor con:');
    console.log('   cd backend && pnpm run start:dev');
    process.exit(1);
  }
  
  console.log('');
  
  // 2. Verificar métricas
  const metricsHealthy = await checkMetricsHealth();
  
  console.log('');
  
  // 3. Si las métricas no están saludables, intentar recuperarlas
  if (!metricsHealthy) {
    console.log('⚠️ Métricas no están saludables. Intentando recuperación...\n');
    
    const updateSuccess = await updateGrowthMetrics();
    
    if (updateSuccess) {
      console.log('\n✅ Recuperación exitosa. Verificando nuevamente...\n');
      
      // Esperar un momento para que se propaguen los cambios
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalCheck = await checkMetricsHealth();
      
      if (finalCheck) {
        console.log('\n🎉 ¡Métricas completamente recuperadas y funcionando!');
      } else {
        console.log('\n⚠️ Métricas parcialmente recuperadas. Puede necesitar más tiempo.');
      }
    } else {
      console.log('\n❌ No se pudo recuperar las métricas automáticamente.');
      console.log('💡 Intenta manualmente:');
      console.log('   curl -X POST http://localhost:3002/api/metrics/growth/update');
    }
  } else {
    console.log('🎉 ¡Todas las métricas están funcionando correctamente!');
  }
  
  console.log('\n📍 URLs útiles:');
  console.log(`   - Métricas Prometheus: ${BASE_URL}/api/metrics`);
  console.log(`   - Estado de Salud: ${BASE_URL}/api/metrics/growth/health`);
  console.log(`   - Dashboard Grafana: http://localhost:3001/d/wayuu-growth/wayuu-growth-dashboard`);
  console.log(`   - API Docs: ${BASE_URL}/api/docs`);
}

// Ejecutar script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  });
}

module.exports = { checkBackendHealth, checkMetricsHealth, updateGrowthMetrics };
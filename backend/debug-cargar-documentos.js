#!/usr/bin/env node

/**
 * Script de diagnóstico para el botón "Cargar Documentos"
 * Simula exactamente lo que hace el botón en el navegador
 */

const http = require('http');
const url = require('url');

console.log('🔍 DIAGNÓSTICO DEL BOTÓN "CARGAR DOCUMENTOS"');
console.log('=' .repeat(50));

// Simular la función fetch como lo haría el navegador
function fetch(urlString, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(urlString);
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 80,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = http.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    headers: res.headers,
                    json: async () => JSON.parse(data),
                    text: async () => data
                });
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// Simular exactamente lo que hace la función loadDocuments()
async function simulateLoadDocuments() {
    console.log('\n🎯 SIMULANDO FUNCIÓN loadDocuments()');
    console.log('-' .repeat(30));
    
    const API_BASE = 'http://localhost:3002/api/pdf-processing';
    
    console.log(`📡 Realizando petición a: ${API_BASE}/documents`);
    
    try {
        const response = await fetch(`${API_BASE}/documents`);
        
        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        console.log(`📊 Headers:`, response.headers);
        
        if (!response.ok) {
            console.log(`❌ Error HTTP: ${response.status}`);
            const text = await response.text();
            console.log(`📝 Response body: ${text}`);
            return;
        }
        
        const data = await response.json();
        
        console.log(`✅ Respuesta recibida exitosamente`);
        console.log(`📄 Success: ${data.success}`);
        console.log(`📄 Message: ${data.message}`);
        console.log(`📄 Document count: ${data.data?.count || 0}`);
        
        if (data.success && data.data?.documents) {
            console.log('\n📚 DOCUMENTOS ENCONTRADOS:');
            data.data.documents.forEach((doc, index) => {
                console.log(`  ${index + 1}. ${doc.title}`);
                console.log(`     📄 Archivo: ${doc.fileName}`);
                console.log(`     📊 Páginas: ${doc.pageCount}`);
                console.log(`     🗣️ Frases Wayuu: ${doc.wayuuPhrases}`);
                console.log(`     📈 Porcentaje: ${doc.wayuuPercentage}%`);
                console.log('');
            });
            
            console.log('🎉 ¡EL BOTÓN DEBERÍA FUNCIONAR CORRECTAMENTE!');
            console.log('');
            console.log('Si el botón no funciona en el navegador, puede ser:');
            console.log('1. ❌ Problema de CORS');
            console.log('2. ❌ JavaScript deshabilitado');
            console.log('3. ❌ Error en consola del navegador');
            console.log('4. ❌ Caché del navegador');
        } else {
            console.log('❌ La respuesta no contiene documentos válidos');
        }
        
    } catch (error) {
        console.log(`❌ Error de conexión: ${error.message}`);
        console.log('');
        console.log('Posibles causas:');
        console.log('1. ❌ Backend no está ejecutándose');
        console.log('2. ❌ Puerto 3002 no está disponible');
        console.log('3. ❌ Problema de red');
    }
}

// Verificar servicios adicionales
async function checkServices() {
    console.log('\n🔧 VERIFICANDO SERVICIOS');
    console.log('-' .repeat(30));
    
    // Verificar backend health
    try {
        const healthResponse = await fetch('http://localhost:3002/api/pdf-processing/health');
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log(`✅ Backend health: ${healthData.message}`);
        } else {
            console.log(`❌ Backend health: ${healthResponse.status}`);
        }
    } catch (error) {
        console.log(`❌ Backend health: ${error.message}`);
    }
    
    // Verificar frontend
    try {
        const frontendResponse = await fetch('http://localhost:4000/pdf-processing-viewer.html');
        console.log(`✅ Frontend: Status ${frontendResponse.status}`);
    } catch (error) {
        console.log(`❌ Frontend: ${error.message}`);
    }
}

// Ejecutar diagnóstico completo
async function runDiagnosis() {
    await checkServices();
    await simulateLoadDocuments();
    
    console.log('\n🌐 INSTRUCCIONES PARA VERIFICAR EN EL NAVEGADOR:');
    console.log('1. Abre: http://localhost:4000/pdf-processing-viewer.html');
    console.log('2. Abre Developer Tools (F12)');
    console.log('3. Ve a la pestaña "Console"');
    console.log('4. Haz clic en el botón "📄 Cargar Documentos"');
    console.log('5. Verifica si aparecen errores en la consola');
    console.log('');
    console.log('Si hay errores, pueden ser:');
    console.log('- CORS policy errors');
    console.log('- Network errors');
    console.log('- JavaScript errors');
}

runDiagnosis(); 
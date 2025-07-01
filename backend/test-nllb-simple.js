#!/usr/bin/env node

/**
 * 🚀 WAYUU-SPANISH TRANSLATOR - NLLB SIMPLE TEST
 * 
 * Tests básicos para verificar el funcionamiento de NLLB-200
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const API_BASE = `${BASE_URL}/api/nllb`;

async function testEndpoint(name, method, endpoint, data = null) {
  try {
    console.log(`🧪 Testing ${name}...`);
    
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    console.log(`✅ ${name} - SUCCESS`);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));
    console.log('---');

    return { success: true, data: response.data };

  } catch (error) {
    console.log(`❌ ${name} - FAILED`);
    console.log(`Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Response:`, JSON.stringify(error.response.data, null, 2));
    }
    console.log('---');

    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting NLLB Simple Tests...');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('='.repeat(60));

  let passed = 0;
  let total = 0;

  // Test 1: Service Health Check
  total++;
  const health = await testEndpoint('Service Health Check', 'GET', '/service/health');
  if (health.success) passed++;

  // Test 2: Service Info
  total++;
  const info = await testEndpoint('Service Information', 'GET', '/service/info');
  if (info.success) passed++;

  // Test 3: Language Detection - Wayuu
  total++;
  const detectWayuu = await testEndpoint(
    'Language Detection (Wayuu)',
    'POST',
    '/detect-language',
    { text: 'Taya wayuu eekai süchon wane' }
  );
  if (detectWayuu.success) passed++;

  // Test 4: Language Detection - Spanish
  total++;
  const detectSpanish = await testEndpoint(
    'Language Detection (Spanish)',
    'POST',
    '/detect-language',
    { text: 'Hola, ¿cómo estás?' }
  );
  if (detectSpanish.success) passed++;

  // Test 5: Direct Translation (si el modelo está disponible)
  total++;
  const translateDirect = await testEndpoint(
    'Direct Translation (Wayuu → Spanish)',
    'POST',
    '/translate/direct',
    {
      text: 'Taya wayuu',
      sourceLang: 'wayuu',
      targetLang: 'spanish'
    }
  );
  if (translateDirect.success) passed++;

  // Resultados finales
  console.log('='.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`📊 Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED!');
  } else {
    console.log('⚠️  Some tests failed - check above for details');
  }
}

// Ejecutar tests
runTests().catch(console.error); 
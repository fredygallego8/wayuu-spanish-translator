#!/usr/bin/env node

/**
 * 🆓 WAYUU-SPANISH TRANSLATOR - FREE TRANSLATION TEST
 * 
 * Tests gratuitos para Google Translate y LibreTranslate
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const API_BASE = `${BASE_URL}/api/free-translate`;

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

async function runFreeTranslationTests() {
  console.log('🆓 Starting FREE Translation Tests...');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('='.repeat(60));

  let passed = 0;
  let total = 0;

  // Test 1: Check Available Services
  total++;
  const services = await testEndpoint('Available Services', 'GET', '/services');
  if (services.success) passed++;

  // Test 2: Health Check
  total++;
  const health = await testEndpoint('Health Check', 'GET', '/health');
  if (health.success) passed++;

  // Test 3: Language Detection (Wayuu)
  total++;
  const detectWayuu = await testEndpoint(
    'Language Detection (Wayuu)',
    'POST',
    '/detect-language',
    { text: 'Kasa püshukua wayuu eekai süchon wane' }
  );
  if (detectWayuu.success) passed++;

  // Test 4: Language Detection (Spanish)
  total++;
  const detectSpanish = await testEndpoint(
    'Language Detection (Spanish)',
    'POST',
    '/detect-language',
    { text: 'Hola, ¿cómo estás hoy?' }
  );
  if (detectSpanish.success) passed++;

  // Test 5: Google Translate - Wayuu to Spanish
  total++;
  const googleWayuuEs = await testEndpoint(
    'Google Translate (Wayuu → Spanish)',
    'POST',
    '/translate',
    {
      text: 'Kasa wayuu',
      sourceLang: 'wayuu',
      targetLang: 'spanish',
      service: 'google'
    }
  );
  if (googleWayuuEs.success) passed++;

  // Test 6: Google Translate - Spanish to Wayuu
  total++;
  const googleEsWayuu = await testEndpoint(
    'Google Translate (Spanish → Wayuu)',
    'POST',
    '/translate',
    {
      text: 'Hola hermano',
      sourceLang: 'spanish',
      targetLang: 'wayuu',
      service: 'google'
    }
  );
  if (googleEsWayuu.success) passed++;

  // Test 7: LibreTranslate - Wayuu to Spanish
  total++;
  const libreWayuuEs = await testEndpoint(
    'LibreTranslate (Wayuu → Spanish)',
    'POST',
    '/translate',
    {
      text: 'Kasa wayuu püshukua',
      sourceLang: 'wayuu',
      targetLang: 'spanish',
      service: 'libre'
    }
  );
  if (libreWayuuEs.success) passed++;

  // Test 8: Auto Translation (Best Available)
  total++;
  const autoTranslate = await testEndpoint(
    'Auto Translation (Best Available)',
    'POST',
    '/translate',
    {
      text: 'Taya wayuu eekai Maicao',
      sourceLang: 'wayuu',
      targetLang: 'spanish',
      service: 'auto'
    }
  );
  if (autoTranslate.success) passed++;

  // Resultados finales
  console.log('='.repeat(60));
  console.log('📊 FREE TRANSLATION RESULTS SUMMARY');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`📊 Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('🎉 ALL FREE TRANSLATION TESTS PASSED!');
    console.log('🆓 You can now translate Wayuu ↔ Spanish for FREE!');
    console.log('💡 Use /api/free-translate/translate for translations');
  } else if (passed > 0) {
    console.log('🎯 PARTIAL SUCCESS - Some free services are working!');
    console.log('💡 Check which services are available and use those');
  } else {
    console.log('❌ ALL SERVICES FAILED - Check internet connection');
  }

  console.log('\n🆓 FREE SERVICES SUMMARY:');
  console.log('- Google Translate: Free up to 500K chars/month');
  console.log('- LibreTranslate: Completely free, open source');
  console.log('- No API keys required!');
  console.log('- Ready to process your 809 audio files!');
}

// Ejecutar tests
runFreeTranslationTests().catch(console.error); 
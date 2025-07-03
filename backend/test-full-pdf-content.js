/**
 * Test script to analyze full PDF content and find dictionary sections
 */

// Función para hacer request HTTP simple
const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testFullPDFContent() {
  try {
    console.log('🔍 Fetching full PDF content analysis...\n');
    
    const response = await makeRequest('/api/pdf-processing/debug/extraction-analysis?fileName=WayuuDict_45801.pdf');
    
    if (!response.success) {
      throw new Error(response.message);
    }

    const fullText = response.data.textSample; // Solo tenemos acceso a la muestra
    console.log(`📄 PDF: ${response.data.pdfInfo.fileName}`);
    console.log(`📊 Total text length: ${response.data.pdfInfo.textLength} characters`);
    console.log(`📝 Sample length: ${fullText.length} characters`);
    console.log(`📚 Detected wayuu phrases: ${response.data.pdfInfo.wayuuPhrases}`);
    
    // Buscar indicadores de que llegamos al diccionario
    const dictionaryIndicators = [
      'DICCIONARIO WAYUUNAIKI-ESPAÑOL',
      'aküjaa',
      'anashi', 
      'wayuu - persona',
      'müshii',
      'abajar - bajar'
    ];
    
    console.log('\n🔍 Searching for dictionary indicators in sample:');
    for (const indicator of dictionaryIndicators) {
      const found = fullText.toLowerCase().includes(indicator.toLowerCase());
      console.log(`   ${found ? '✅' : '❌'} "${indicator}": ${found ? 'FOUND' : 'NOT FOUND'}`);
    }
    
    // Analizar patrones en la muestra disponible
    console.log('\n🔍 Testing extraction patterns on available sample:');
    
    // Patrón 1: Guión (academic pattern)
    const dashPattern = /([a-züÜ'ꞌ]+(?:\s+[a-züÜ'ꞌ]+)*)\s*[–—-]\s*([a-záéíóúñüÁÉÍÓÚÑÜ]+(?:\s+[a-záéíóúñüÁÉÍÓÚÑÜ\s,\.]*)*)/gi;
    const dashMatches = Array.from(fullText.matchAll(dashPattern));
    console.log(`   Dash pattern (-): ${dashMatches.length} matches`);
    if (dashMatches.length > 0) {
      console.log(`   Sample: "${dashMatches[0][1]}" → "${dashMatches[0][2]}"`);
    }
    
    // Patrón 2: Dos puntos
    const colonPattern = /([a-züÜ'ꞌ]+(?:\s+[a-züÜ'ꞌ]+)*)\s*:\s*([a-záéíóúñüÁÉÍÓÚÑÜ][^:\n]{3,100})/gi;
    const colonMatches = Array.from(fullText.matchAll(colonPattern));
    console.log(`   Colon pattern (:): ${colonMatches.length} matches`);
    if (colonMatches.length > 0) {
      console.log(`   Sample: "${colonMatches[0][1]}" → "${colonMatches[0][2]}"`);
    }
    
    // Buscar palabras wayuu características
    const wayuuWords = fullText.match(/[a-züÜ'ꞌ]{3,}/gi) || [];
    const uniqueWayuuWords = [...new Set(wayuuWords)].slice(0, 10);
    console.log(`\n📝 Sample wayuu words found: ${uniqueWayuuWords.join(', ')}`);
    
    // Verificar si necesitamos acceso a más contenido
    console.log('\n📋 Analysis conclusion:');
    if (fullText.includes('Diccionario Wayuunaiki-Español.....................13')) {
      console.log('✅ Found table of contents - dictionary starts at page 13');
      console.log('❌ Current sample only shows introduction/TOC');
      console.log('🔧 Need to access content from page 13 onwards');
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Extract content from page 13+ where actual dictionary begins');
    console.log('2. Test patterns on real dictionary entries, not introduction');
    console.log('3. Verify extraction algorithms work on actual wayuu-spanish pairs');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFullPDFContent(); 
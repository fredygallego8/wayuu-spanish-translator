/**
 * Test script to debug dictionary extraction patterns
 */

// Sample dictionary text from WayuuDict_45801.pdf (typical dictionary entries)
const sampleText = `
aküjaa - caballo, yegua
anashi - pineapple, piña
wayuu: persona
müshii - gato
palajana - plátano
süülia: mujer
shiirua - caracol
paala - mar, océano
wuchii: perro
jintulu - estrella
süka - carne
wayuunaiki: idioma wayuu
kaashii - luna
`;

// Our regex patterns from the service
const patterns = {
  academicPattern1: /([a-züÜ'ꞌ]+(?:\s+[a-züÜ'ꞌ]+)*)\s*[–—-]\s*([a-záéíóúñüÁÉÍÓÚÑÜ]+(?:\s+[a-záéíóúñüÁÉÍÓÚÑÜ\s,\.]*)*)/gi,
  definitionPattern: /([a-züÜ'ꞌ]+(?:\s+[a-züÜ'ꞌ]+){0,2})\s*:\s*([a-záéíóúñüÁÉÍÓÚÑÜ][^:\n]{3,100})/gi,
  tablePattern: /([a-züÜ'ꞌ]+(?:\s+[a-züÜ'ꞌ]+)*)\s*[\|\t]\s*([a-záéíóúñüÁÉÍÓÚÑÜ]+(?:\s+[a-záéíóúñüÁÉÍÓÚÑÜ\s,]*)*)/gi,
  parenthesesPattern: /([a-züÜ'ꞌ]+(?:\s+[a-züÜ'ꞌ]+)*)\s*\(([a-záéíóúñüÁÉÍÓÚÑÜ]+(?:\s+[a-záéíóúñüÁÉÍÓÚÑÜ\s,]*)*)\)/gi,
  numberedListPattern: /\d+[\.)\s]\s*([a-züÜ'ꞌ]+(?:\s+[a-züÜ'ꞌ]+)*)\s*[–—:.-]\s*([a-záéíóúñüÁÉÍÓÚÑÜ]+(?:\s+[a-záéíóúñüÁÉÍÓÚÑÜ\s,]*)*)/gi
};

console.log('🔍 Testing dictionary extraction patterns...\n');

Object.entries(patterns).forEach(([patternName, regex]) => {
  console.log(`--- ${patternName} ---`);
  
  let match;
  let count = 0;
  const regexCopy = new RegExp(regex.source, regex.flags); // Reset regex state
  
  while ((match = regexCopy.exec(sampleText)) !== null) {
    count++;
    const wayuu = match[1].trim();
    const spanish = match[2].trim();
    console.log(`  ${count}. "${wayuu}" → "${spanish}"`);
  }
  
  if (count === 0) {
    console.log('  No matches found');
  }
  
  console.log('');
});

console.log('🎯 Testing with actual PDF API...'); 
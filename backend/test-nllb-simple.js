/**
 * Test simple para debuggear los nuevos algoritmos de extracción
 */

// Simulación del contenido real del diccionario que encontramos
const realDictionaryContent = `
akumajaa
akurulaa
akurulaav.i.tener frío.
akutkujawaa
akutkujawaav.i.temblar.
aküjaa
aküjaav.t.1.contar.2.confesar.
aküjaa achiküacusar, denunciar.
akünülaa
akünülaav.t.masticar.
a'ajaa
a'ajaav.t.quemar.
a'aka
a'akaadv.allí.
`;

console.log('🔍 Testing new dictionary extraction algorithms...\n');

// Simular los métodos que implementé
function isWayuuWordOnly(line) {
  if (!line || line.length < 3) return false;
  
  const wordPattern = /^[a-züÜ'ꞌ]+$/;
  const wayuuCharacteristics = /[üÜꞌ']|[aeioujkstnmplrw]{3,}/i;
  
  return wordPattern.test(line) && wayuuCharacteristics.test(line);
}

function isAcademicDefinition(line) {
  if (!line || line.length < 5) return false;
  
  const academicPatterns = [
    /v\.t\./i,  // verbo transitivo
    /v\.i\./i,  // verbo intransitivo
    /n\./i,     // sustantivo
    /adj\./i,   // adjetivo
    /adv\./i,   // adverbio
    /prep\./i,  // preposición
    /\d+\./     // numeración (1., 2., etc.)
  ];
  
  return academicPatterns.some(pattern => pattern.test(line)) && 
         line.length > 10;
}

function extractSpanishFromAcademicDefinition(line) {
  if (!line) return '';
  
  // Encontrar el inicio del texto en español después de los marcadores académicos
  let spanish = line;
  
  // Buscar y remover la parte académica inicial (ej: "aküjaav.t.")
  const academicStartPattern = /^[a-züÜ'ꞌ]+\s*(v\.t\.|v\.i\.|n\.|adj\.|adv\.|prep\.)\s*/i;
  spanish = spanish.replace(academicStartPattern, '');
  
  // Remover numeraciones (1., 2., etc.) pero mantener el contenido
  spanish = spanish.replace(/\d+\./g, '');
  
  // Extraer definiciones múltiples si existen (ej: "1.contar.2.confesar.")
  const definitions = spanish.split(/\d+\./).filter(def => def.trim().length > 0);
  
  if (definitions.length > 0) {
    // Tomar la primera definición y limpiarla
    spanish = definitions[0].trim();
    
    // Si hay múltiples definiciones, combinarlas
    if (definitions.length > 1) {
      spanish = definitions.map(def => def.trim().replace(/\.$/, '')).join(', ');
    }
  }
  
  // Limpiar espacios múltiples y puntuación final
  spanish = spanish
    .replace(/\s+/g, ' ')
    .replace(/\.+$/, '') // Remover puntos finales múltiples
    .replace(/^[.,\s]+/, '') // Remover puntuación/espacios al inicio
    .trim();
  
  return spanish;
}

// Testear con el contenido real
const lines = realDictionaryContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
const foundEntries = [];

console.log(`📝 Processing ${lines.length} lines from real dictionary content:\n`);

for (let i = 0; i < lines.length - 1; i++) {
  const currentLine = lines[i];
  const nextLine = lines[i + 1];
  
  console.log(`Line ${i + 1}: "${currentLine}"`);
  console.log(`  - Is Wayuu word only: ${isWayuuWordOnly(currentLine)}`);
  console.log(`Line ${i + 2}: "${nextLine}"`);
  console.log(`  - Is Academic definition: ${isAcademicDefinition(nextLine)}`);
  
  if (isWayuuWordOnly(currentLine) && isAcademicDefinition(nextLine)) {
    const wayuu = currentLine;
    const spanish = extractSpanishFromAcademicDefinition(nextLine);
    
    console.log(`  ✅ MATCH FOUND: "${wayuu}" → "${spanish}"`);
    foundEntries.push({ wayuu, spanish });
  } else {
    console.log(`  ❌ No match`);
  }
  
  console.log('');
}

console.log(`\n🎯 Results:`);
console.log(`📊 Total entries found: ${foundEntries.length}`);
console.log(`📝 Extracted entries:`);
foundEntries.forEach((entry, index) => {
  console.log(`   ${index + 1}. ${entry.wayuu} → ${entry.spanish}`);
});

if (foundEntries.length === 0) {
  console.log('\n❌ No entries found - algorithm needs adjustment');
} else {
  console.log('\n✅ Algorithm working! Found real dictionary entries');
} 
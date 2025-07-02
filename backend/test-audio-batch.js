#!/usr/bin/env node

/**
 * 🎵 WAYUU AUDIO BATCH PROCESSOR - FREE TRANSLATION
 * 
 * Procesa los 809 archivos de audio wayuu usando servicios gratuitos
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function getAudioDataset() {
  try {
    const response = await axios.get(`${BASE_URL}/api/datasets/audio/entries?limit=50`);
    return response.data.data?.entries || [];
  } catch (error) {
    console.error('❌ Error getting audio dataset:', error.message);
    return [];
  }
}

async function translateBatch(texts, service = 'auto') {
  try {
    console.log(`🔄 Translating ${texts.length} texts with ${service}...`);
    
    const response = await axios.post(`${BASE_URL}/api/free-translate/translate/batch`, {
      texts,
      sourceLang: 'wayuu',
      targetLang: 'spanish',
      service
    });

    return response.data;
  } catch (error) {
    console.error(`❌ Batch translation failed: ${error.message}`);
    return null;
  }
}

async function processAudioFiles() {
  console.log('🎵 WAYUU AUDIO BATCH PROCESSOR');
  console.log('🆓 Using FREE translation services');
  console.log('=' .repeat(60));

  // 1. Obtener dataset de audio
  console.log('📚 Loading Wayuu audio dataset...');
  const audioFiles = await getAudioDataset();
  
  if (audioFiles.length === 0) {
    console.log('❌ No audio files found');
    return;
  }

  console.log(`✅ Found ${audioFiles.length} audio files`);
  
  // 2. Filtrar solo archivos con transcripción wayuu
  const wayuuTexts = audioFiles
    .filter(file => file.transcription && file.transcription.trim().length > 0)
    .map(file => ({
      id: file.id,
      wayuu: file.transcription,
      spanish: file.spanish || null,
      duration: file.audioDuration
    }));

  console.log(`🎯 Found ${wayuuTexts.length} files with Wayuu transcriptions`);

  if (wayuuTexts.length === 0) {
    console.log('❌ No Wayuu transcriptions found');
    return;
  }

  // 3. Procesar en lotes de 10 para no saturar
  const batchSize = 10;
  const totalBatches = Math.ceil(wayuuTexts.length / batchSize);
  let processedCount = 0;
  let successCount = 0;

  console.log(`📦 Processing ${wayuuTexts.length} files in ${totalBatches} batches of ${batchSize}`);
  console.log('-'.repeat(60));

  for (let i = 0; i < totalBatches; i++) {
    const batch = wayuuTexts.slice(i * batchSize, (i + 1) * batchSize);
    const batchTexts = batch.map(item => item.wayuu);
    
    console.log(`\n🔄 Batch ${i + 1}/${totalBatches} - Processing ${batch.length} files...`);
    
    // Mostrar archivos de este lote
    batch.forEach((item, idx) => {
      console.log(`  📄 ${item.id}: "${item.wayuu.substring(0, 50)}..."`);
    });

    // Traducir lote con LibreTranslate (más rápido para lotes)
    const result = await translateBatch(batchTexts, 'libre');
    
    if (result && result.results) {
      const batchSuccess = result.successCount || 0;
      successCount += batchSuccess;
      processedCount += batch.length;

      console.log(`✅ Batch ${i + 1} completed: ${batchSuccess}/${batch.length} successful`);
      
      // Mostrar algunas traducciones de ejemplo
      result.results.slice(0, 3).forEach((translation, idx) => {
        if (translation.translatedText) {
          console.log(`  🔄 "${batchTexts[idx]}" → "${translation.translatedText}"`);
        }
      });

      // Pausa entre lotes para ser respetuoso con servicios gratuitos
      if (i < totalBatches - 1) {
        console.log('⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } else {
      console.log(`❌ Batch ${i + 1} failed`);
      processedCount += batch.length;
    }
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 BATCH PROCESSING SUMMARY');
  console.log(`📄 Total files processed: ${processedCount}`);
  console.log(`✅ Successful translations: ${successCount}`);
  console.log(`❌ Failed translations: ${processedCount - successCount}`);
  console.log(`📊 Success rate: ${Math.round((successCount/processedCount) * 100)}%`);

  if (successCount > 0) {
    console.log('\n🎉 SUCCESS! Your Wayuu audio files are being translated!');
    console.log('🆓 Using completely FREE services');
    console.log('💾 Translations can be saved to database');
    console.log('📈 Ready for linguistic analysis and preservation');
  }

  return {
    totalProcessed: processedCount,
    successful: successCount,
    successRate: (successCount/processedCount) * 100
  };
}

// Ejecutar procesamiento
if (require.main === module) {
  processAudioFiles().catch(console.error);
}

module.exports = { processAudioFiles }; 
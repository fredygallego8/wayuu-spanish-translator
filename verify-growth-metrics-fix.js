const axios = require('axios');

async function verifyGrowthMetricsFix() {
  const BACKEND_URL = 'http://localhost:3002/api';
  
  console.log('🔍 Verificando corrección de métricas de crecimiento...\n');
  
  try {
    // 1. Test manual update endpoint
    console.log('🧪 Testing manual update endpoint...');
    const updateResponse = await axios.post(`${BACKEND_URL}/metrics/growth/update`);
    console.log('Update Response:', JSON.stringify(updateResponse.data, null, 2));
    
    // 2. Get current metrics
    console.log('\n📊 Getting current metrics from Prometheus endpoint...');
    const metricsResponse = await axios.get(`${BACKEND_URL}/metrics`);
    const metricsText = metricsResponse.data;
    
    // Parse specific growth metrics
    const growthMetrics = {
      wayuu_words: extractMetricValue(metricsText, 'wayuu_total_words_wayuu'),
      spanish_words: extractMetricValue(metricsText, 'wayuu_total_words_spanish'),
      audio_minutes: extractMetricValue(metricsText, 'wayuu_total_audio_minutes'),
      phrases: extractMetricValue(metricsText, 'wayuu_total_phrases'),
      transcribed: extractMetricValue(metricsText, 'wayuu_total_transcribed'),
      dictionary_entries: extractMetricValue(metricsText, 'wayuu_total_dictionary_entries'),
      audio_files: extractMetricValue(metricsText, 'wayuu_total_audio_files'),
      last_update: extractMetricValue(metricsText, 'wayuu_growth_last_update_timestamp')
    };
    
    console.log('Current Growth Metrics:');
    console.log('- Wayuu Words:', growthMetrics.wayuu_words);
    console.log('- Spanish Words:', growthMetrics.spanish_words);
    console.log('- Audio Minutes:', growthMetrics.audio_minutes);
    console.log('- Phrases:', growthMetrics.phrases);
    console.log('- Transcribed:', growthMetrics.transcribed);
    console.log('- Dictionary Entries:', growthMetrics.dictionary_entries);
    console.log('- Audio Files:', growthMetrics.audio_files);
    console.log('- Last Update:', growthMetrics.last_update ? new Date(growthMetrics.last_update).toISOString() : 'N/A');
    
    // 3. Check if any metrics are zero (this would indicate the problem still exists)
    console.log('\n⚠️  Zero Values Check:');
    const zeroMetrics = Object.entries(growthMetrics).filter(([key, value]) => value === 0 && key !== 'last_update');
    if (zeroMetrics.length > 0) {
      console.log('❌ Found zero values in:', zeroMetrics.map(([key]) => key).join(', '));
      console.log('❌ This indicates metrics are still being reset to 0!');
      
      // Try to update again to see if it fixes the issue
      console.log('\n🔄 Trying another update to see if default values are applied...');
      const secondUpdate = await axios.post(`${BACKEND_URL}/metrics/growth/update`);
      console.log('Second Update Response:', JSON.stringify(secondUpdate.data, null, 2));
      
    } else {
      console.log('✅ No zero values found in growth metrics');
      console.log('✅ Metrics preservation appears to be working correctly!');
    }
    
    // 4. Test metric health endpoint
    console.log('\n🩺 Testing metrics health endpoint...');
    const healthResponse = await axios.get(`${BACKEND_URL}/metrics/growth/health`);
    console.log('Health Status:', JSON.stringify(healthResponse.data, null, 2));
    
    // 5. Test metric types in Prometheus format
    console.log('\n🧪 Testing metric types...');
    const metricTypes = {
      wayuu_words: checkMetricType(metricsText, 'wayuu_total_words_wayuu'),
      spanish_words: checkMetricType(metricsText, 'wayuu_total_words_spanish'),
      audio_minutes: checkMetricType(metricsText, 'wayuu_total_audio_minutes'),
      phrases: checkMetricType(metricsText, 'wayuu_total_phrases'),
      transcribed: checkMetricType(metricsText, 'wayuu_total_transcribed'),
      dictionary_entries: checkMetricType(metricsText, 'wayuu_total_dictionary_entries'),
      audio_files: checkMetricType(metricsText, 'wayuu_total_audio_files')
    };
    
    console.log('Metric types detected:');
    Object.entries(metricTypes).forEach(([key, type]) => {
      const typeIcon = type === 'counter' ? '📊' : type === 'gauge' ? '🔢' : '❓';
      console.log(`${typeIcon} ${key}: ${type}`);
    });
    
    // 6. Test growth dashboard endpoint
    console.log('\n📈 Testing growth dashboard endpoint...');
    const dashboardResponse = await axios.get(`${BACKEND_URL}/metrics/growth`);
    console.log('Dashboard Data:', JSON.stringify(dashboardResponse.data, null, 2));
    
    // 7. Simulate the spanNulls behavior
    console.log('\n🔗 Testing spanNulls behavior simulation...');
    console.log('With spanNulls: true in Grafana, metrics should now maintain their values instead of dropping to 0');
    console.log('This means that when Prometheus scrapes metrics, if there is no new data,');
    console.log('the previous value should be preserved rather than showing a gap.');
    
    // 8. Final verification
    console.log('\n✅ Verification Summary:');
    const allMetricsValid = Object.entries(growthMetrics)
      .filter(([key]) => key !== 'last_update')
      .every(([key, value]) => value > 0);
    
    if (allMetricsValid) {
      console.log('✅ ALL GROWTH METRICS ARE NON-ZERO');
      console.log('✅ Grafana dashboard should now show continuous lines instead of dropping to 0');
      console.log('✅ spanNulls: true configuration will connect data points properly');
    } else {
      console.log('❌ Some metrics are still zero - further investigation needed');
    }
    
    // 9. Test the new preservation logic
    console.log('\n🛡️  Testing preservation logic...');
    const hasPreservationInfo = updateResponse.data.hasOwnProperty('preserved_values');
    if (hasPreservationInfo) {
      console.log('✅ Update response includes preservation information');
      console.log(`- Preserved values: ${updateResponse.data.preserved_values}`);
      console.log(`- Sources with data: ${updateResponse.data.sources_with_data || 'N/A'}`);
      console.log(`- Sources with error: ${updateResponse.data.sources_with_error || 'N/A'}`);
    } else {
      console.log('⚠️  Update response does not include preservation information');
    }
    
    console.log('\n🎉 Growth metrics verification completed!');
    
  } catch (error) {
    console.error('❌ Error verifying growth metrics fix:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // If backend is not running, provide instructions
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend no está ejecutándose. Para probar:');
      console.log('1. cd backend');
      console.log('2. pnpm run dev:safe');
      console.log('3. Ejecutar este script nuevamente');
    }
  }
}

function extractMetricValue(metricsText, metricName) {
  const regex = new RegExp(`${metricName}\\s+(\\d+\\.?\\d*)`);
  const match = metricsText.match(regex);
  return match ? parseFloat(match[1]) : 0;
}

function checkMetricType(metricsText, metricName) {
  // Look for TYPE declarations in Prometheus format
  const typeRegex = new RegExp(`# TYPE ${metricName} (counter|gauge|histogram|summary)`);
  const match = metricsText.match(typeRegex);
  return match ? match[1] : 'unknown';
}

// Run the verification
verifyGrowthMetricsFix().catch(console.error); 
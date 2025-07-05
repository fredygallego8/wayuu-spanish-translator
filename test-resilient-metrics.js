
const axios = require('axios');

async function testResilientMetrics() {
  console.log('🧪 TESTING RESILIENT METRICS...');
  console.log('=' .repeat(50));

  const GRAFANA_URL = 'http://localhost:3001';
  const PROMETHEUS_URL = 'http://localhost:9090';

  try {
    // 1. Test Prometheus queries
    console.log('\n📊 Testing Prometheus queries...');
    const testQueries = [
      'wayuu_total_words_wayuu',
      '(wayuu_total_words_wayuu or last_over_time(wayuu_total_words_wayuu[1h]))',
      'up{job="wayuu-translator-backend"}'
    ];

    for (const query of testQueries) {
      try {
        const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
          params: { query }
        });
        console.log(`✅ Query: ${query.substring(0, 50)}...`);
        console.log(`   Result: ${response.data.data.result.length} series`);
      } catch (error) {
        console.log(`❌ Query failed: ${query.substring(0, 50)}...`);
      }
    }

    // 2. Test Grafana dashboard
    console.log('\n📈 Testing Grafana dashboard...');
    try {
      const response = await axios.get(`${GRAFANA_URL}/api/dashboards/uid/wayuu-growth`);
      console.log('✅ Dashboard accessible');
      console.log(`   Panels: ${response.data.dashboard.panels.length}`);
    } catch (error) {
      console.log('❌ Dashboard not accessible');
    }

    // 3. Instructions for manual testing
    console.log('\n🔧 MANUAL TESTING INSTRUCTIONS:');
    console.log('=' .repeat(50));
    console.log('1. Start backend: cd backend && pnpm run dev');
    console.log('2. Check metrics are visible in Grafana');
    console.log('3. Stop backend: kill backend process');
    console.log('4. Verify metrics DON\'T drop to 0 in Grafana');
    console.log('5. Wait 5-10 minutes and check again');
    console.log('6. Restart backend and verify metrics resume');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testResilientMetrics();
}

module.exports = { testResilientMetrics };

#!/usr/bin/env node

/**
 * 📊 PERFORMANCE TESTING SUITE - WAYUU SPANISH TRANSLATOR
 * Dataset Ampliado: 4,713 entradas
 */

const { performance } = require('perf_hooks');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class PerformanceTester {
  constructor() {
    this.baseUrl = 'http://localhost:3002/api';
    this.results = {
      startup: {},
      endpoints: {},
      datasets: {},
      memory: {},
      concurrent: {}
    };
  }

  // 🕐 Tiempo de respuesta de endpoints
  async testEndpointPerformance() {
    console.log('🚀 Testing endpoint performance...');
    
    const endpoints = [
      { name: 'stats', url: '/datasets/stats' },
      { name: 'search_casa', url: '/datasets/dictionary/search?q=casa&direction=spanish_to_wayuu' },
      { name: 'search_wayuu', url: '/datasets/dictionary/search?q=wayuu' },
      { name: 'audio_stats', url: '/datasets/audio/stats' },
      { name: 'free_translate', url: '/free-translate/services', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      const times = [];
      
      // 5 mediciones por endpoint
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        
        try {
          const response = await fetch(`${this.baseUrl}${endpoint.url}`);
          const data = await response.json();
          
          const end = performance.now();
          times.push(end - start);
          
          if (i === 0) console.log(`  ✅ ${endpoint.name}: ${(end - start).toFixed(2)}ms`);
        } catch (error) {
          console.log(`  ❌ ${endpoint.name}: ${error.message}`);
        }
      }
      
      this.results.endpoints[endpoint.name] = {
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        times
      };
    }
  }

  // 🔍 Testing de búsquedas con diferentes patrones
  async testSearchPerformance() {
    console.log('🔍 Testing search performance...');
    
    const searchTerms = [
      'casa', 'agua', 'madre', 'wayuu', 'taya',
      'miichi', 'eekai', 'asa', 'wüin', 'Maleiwa'
    ];

    const searchTimes = [];
    
    for (const term of searchTerms) {
      const start = performance.now();
      
      try {
        const response = await fetch(
          `${this.baseUrl}/datasets/dictionary/search?q=${term}&direction=spanish_to_wayuu`
        );
        const data = await response.json();
        
        const end = performance.now();
        const time = end - start;
        searchTimes.push(time);
        
        console.log(`  🔎 "${term}": ${time.toFixed(2)}ms (${data.success ? 'found' : 'not found'})`);
      } catch (error) {
        console.log(`  ❌ "${term}": ${error.message}`);
      }
    }

    this.results.datasets.search = {
      avg: searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length,
      min: Math.min(...searchTimes),
      max: Math.max(...searchTimes),
      terms: searchTerms.length
    };
  }

  // 🚀 Testing de carga concurrente
  async testConcurrentLoad() {
    console.log('⚡ Testing concurrent load...');
    
    const concurrentRequests = 10;
    const promises = [];
    
    const start = performance.now();
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        fetch(`${this.baseUrl}/datasets/dictionary/search?q=casa&direction=spanish_to_wayuu`)
          .then(r => r.json())
      );
    }
    
    try {
      const results = await Promise.all(promises);
      const end = performance.now();
      
      console.log(`  ✅ ${concurrentRequests} concurrent requests: ${(end - start).toFixed(2)}ms`);
      console.log(`  📊 Average per request: ${((end - start) / concurrentRequests).toFixed(2)}ms`);
      
      this.results.concurrent = {
        requests: concurrentRequests,
        totalTime: end - start,
        avgPerRequest: (end - start) / concurrentRequests,
        successfulRequests: results.filter(r => r.success).length
      };
    } catch (error) {
      console.log(`  ❌ Concurrent test failed: ${error.message}`);
    }
  }

  // 📊 Testing de dataset size impact
  async testDatasetSize() {
    console.log('📚 Testing dataset size impact...');
    
    try {
      const response = await fetch(`${this.baseUrl}/datasets/stats`);
      const data = await response.json();
      
      if (data.success) {
        const stats = data.data;
        
        console.log(`  📊 Total entries: ${stats.totalEntries}`);
        console.log(`  🔤 Wayuu words: ${stats.uniqueWayuuWords}`);
        console.log(`  🔤 Spanish words: ${stats.uniqueSpanishWords}`);
        console.log(`  🎵 Audio entries: ${stats.totalAudioEntries}`);
        
        this.results.datasets.stats = {
          totalEntries: stats.totalEntries,
          wayuuWords: stats.uniqueWayuuWords,
          spanishWords: stats.uniqueSpanishWords,
          audioEntries: stats.totalAudioEntries,
          avgWordsPerEntry: stats.averageSpanishWordsPerEntry
        };
      }
    } catch (error) {
      console.log(`  ❌ Dataset stats failed: ${error.message}`);
    }
  }

  // 📋 Reporte final
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE REPORT - WAYUU SPANISH TRANSLATOR');
    console.log('='.repeat(60));
    
    console.log('\n🚀 ENDPOINT PERFORMANCE:');
    Object.entries(this.results.endpoints).forEach(([name, data]) => {
      console.log(`  ${name}: ${data.avg.toFixed(2)}ms avg (${data.min.toFixed(1)}-${data.max.toFixed(1)}ms)`);
    });

    console.log('\n🔍 SEARCH PERFORMANCE:');
    if (this.results.datasets.search) {
      const search = this.results.datasets.search;
      console.log(`  Average: ${search.avg.toFixed(2)}ms`);
      console.log(`  Range: ${search.min.toFixed(1)}-${search.max.toFixed(1)}ms`);
      console.log(`  Terms tested: ${search.terms}`);
    }

    console.log('\n📚 DATASET METRICS:');
    if (this.results.datasets.stats) {
      const stats = this.results.datasets.stats;
      console.log(`  Total entries: ${stats.totalEntries}`);
      console.log(`  Dataset efficiency: ${(stats.totalEntries / 1000).toFixed(1)}k entries`);
      console.log(`  Memory impact: ~${(stats.totalEntries * 0.1).toFixed(1)}KB estimated`);
    }

    console.log('\n⚡ CONCURRENT PERFORMANCE:');
    if (this.results.concurrent.requests) {
      const conc = this.results.concurrent;
      console.log(`  ${conc.requests} requests: ${conc.totalTime.toFixed(2)}ms total`);
      console.log(`  Average per request: ${conc.avgPerRequest.toFixed(2)}ms`);
      console.log(`  Success rate: ${((conc.successfulRequests / conc.requests) * 100).toFixed(1)}%`);
    }

    console.log('\n🎯 OPTIMIZATION RECOMMENDATIONS:');
    this.generateOptimizationRecommendations();
    
    console.log('\n' + '='.repeat(60));
  }

  generateOptimizationRecommendations() {
    const recommendations = [];
    
    // Análisis de tiempo de respuesta
    const avgResponseTime = Object.values(this.results.endpoints)
      .reduce((sum, data) => sum + data.avg, 0) / Object.keys(this.results.endpoints).length;
    
    if (avgResponseTime > 50) {
      recommendations.push('⚡ Add response caching for frequent queries');
    }
    
    if (this.results.datasets.stats?.totalEntries > 5000) {
      recommendations.push('📚 Implement pagination for large dataset responses');
      recommendations.push('🔍 Add search indexing for faster lookups');
    }
    
    if (this.results.concurrent?.avgPerRequest > this.results.endpoints.search_casa?.avg * 1.5) {
      recommendations.push('🚀 Optimize for concurrent load with connection pooling');
    }
    
    recommendations.push('💾 Consider Redis caching for hot paths');
    recommendations.push('🗜️ Implement response compression');
    recommendations.push('📊 Add monitoring and metrics collection');
    
    recommendations.forEach(rec => console.log(`  ${rec}`));
  }

  async runAllTests() {
    console.log('🧪 PERFORMANCE TESTING SUITE STARTING...\n');
    
    await this.testDatasetSize();
    await this.testEndpointPerformance();
    await this.testSearchPerformance();
    await this.testConcurrentLoad();
    
    this.generateReport();
  }
}

// 🏃‍♂️ Ejecutar si se llama directamente
if (require.main === module) {
  const tester = new PerformanceTester();
  
  tester.runAllTests().catch(error => {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceTester; 
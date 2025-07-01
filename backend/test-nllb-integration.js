#!/usr/bin/env node

/**
 * 🚀 WAYUU-SPANISH TRANSLATOR - NLLB INTEGRATION TEST
 * 
 * Este script verifica la implementación completa de NLLB-200
 * con soporte nativo para traducción directa wayuu ↔ español
 */

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:3002';
const API_BASE = `${BASE_URL}/nllb`;

// Textos de prueba en wayuu y español
const TEST_CASES = {
  wayuu: [
    'Kasa püshukua wayuu',
    'Anaa wayuu eekai süchon wane',
    'Süchon wayuu anain',
    'Wayuu kasa tü kaikanaasü'
  ],
  spanish: [
    'Hola, ¿cómo estás?',
    'Los wayuu son un pueblo indígena',
    'La cultura wayuu es muy rica',
    'Necesitamos preservar el idioma wayuu'
  ]
};

class NllbIntegrationTest {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': chalk.blue('ℹ️'),
      'success': chalk.green('✅'),
      'warning': chalk.yellow('⚠️'),
      'error': chalk.red('❌'),
      'test': chalk.cyan('🧪')
    }[level] || '📋';

    console.log(`${prefix} [${timestamp}] ${message}`);
    if (data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  async testEndpoint(name, method, endpoint, data = null) {
    try {
      this.log('test', `Testing ${name}...`);
      
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
      
      this.log('success', `${name} - SUCCESS`, {
        status: response.status,
        data: response.data
      });
      
      this.results.passed++;
      this.results.tests.push({
        name,
        status: 'PASSED',
        response: response.data
      });

      return response.data;

    } catch (error) {
      const errorData = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      };

      this.log('error', `${name} - FAILED`, errorData);
      
      this.results.failed++;
      this.results.tests.push({
        name,
        status: 'FAILED',
        error: errorData
      });

      return null;
    }
  }

  async runAllTests() {
    this.log('info', '🚀 Starting NLLB Integration Tests...');
    this.log('info', `Testing against: ${BASE_URL}`);

    // Test 1: Service Health Check
    await this.testEndpoint(
      'Service Health Check',
      'GET',
      '/service/health'
    );

    // Test 2: Service Info
    await this.testEndpoint(
      'Service Information',
      'GET',
      '/service/info'
    );

    // Test 3: Language Detection - Wayuu
    await this.testEndpoint(
      'Language Detection (Wayuu)',
      'POST',
      '/detect-language',
      {
        text: TEST_CASES.wayuu[0]
      }
    );

    // Test 4: Language Detection - Spanish
    await this.testEndpoint(
      'Language Detection (Spanish)',
      'POST',
      '/detect-language',
      {
        text: TEST_CASES.spanish[0]
      }
    );

    // Test 5: Direct Translation Wayuu → Spanish
    await this.testEndpoint(
      'Direct Translation (Wayuu → Spanish)',
      'POST',
      '/translate/direct',
      {
        text: TEST_CASES.wayuu[0],
        sourceLang: 'wayuu',
        targetLang: 'spanish'
      }
    );

    // Test 6: Direct Translation Spanish → Wayuu
    await this.testEndpoint(
      'Direct Translation (Spanish → Wayuu)',
      'POST',
      '/translate/direct',
      {
        text: TEST_CASES.spanish[0],
        sourceLang: 'spanish',
        targetLang: 'wayuu'
      }
    );

    // Test 7: Back Translation Quality Check
    await this.testEndpoint(
      'Back Translation Quality Check',
      'POST',
      '/translate/back-translate',
      {
        wayuuText: TEST_CASES.wayuu[1]
      }
    );

    // Test 8: Batch Translation
    await this.testEndpoint(
      'Batch Translation (Wayuu → Spanish)',
      'POST',
      '/translate/batch',
      {
        texts: TEST_CASES.wayuu.slice(0, 2),
        sourceLang: 'wayuu',
        targetLang: 'spanish',
        batchSize: 2
      }
    );

    // Resumen final
    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(80));
    this.log('info', '📊 NLLB INTEGRATION TEST RESULTS');
    console.log('='.repeat(80));

    this.log('info', `Total Tests: ${this.results.passed + this.results.failed}`);
    this.log('success', `Passed: ${this.results.passed}`);
    
    if (this.results.failed > 0) {
      this.log('error', `Failed: ${this.results.failed}`);
    }

    const successRate = ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1);
    this.log('info', `Success Rate: ${successRate}%`);

    console.log('\n📋 DETAILED RESULTS:');
    this.results.tests.forEach((test, index) => {
      const status = test.status === 'PASSED' ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED');
      console.log(`${index + 1}. ${test.name}: ${status}`);
    });

    if (this.results.failed === 0) {
      console.log('\n' + chalk.green.bold('🎉 ALL TESTS PASSED! NLLB INTEGRATION IS WORKING CORRECTLY!'));
      console.log(chalk.cyan('📚 Ready to process 809 Wayuu audio files with direct translation!'));
    } else {
      console.log('\n' + chalk.yellow.bold('⚠️  SOME TESTS FAILED - CHECK CONFIGURATION'));
      console.log(chalk.gray('💡 Common issues:'));
      console.log(chalk.gray('   - HUGGINGFACE_API_KEY not configured'));
      console.log(chalk.gray('   - Backend not running on port 3002'));
      console.log(chalk.gray('   - Network connectivity issues'));
    }
  }
}

// Función principal
async function main() {
  console.log(chalk.bold.blue('\n🚀 WAYUU-SPANISH TRANSLATOR - NLLB INTEGRATION TEST\n'));
  
  const tester = new NllbIntegrationTest();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error(chalk.red('\n💥 Test suite failed to run:'), error.message);
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { NllbIntegrationTest };
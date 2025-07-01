#!/usr/bin/env node

/**
 * 🚀 Quick Dashboard Check
 * Script simple para verificación rápida del dashboard de Grafana
 */

const GrafanaDashboardConnector = require('../grafana-dashboard-connector.js');

async function quickDashboardCheck() {
  console.log('🚀 Iniciando verificación rápida del dashboard...\n');
  
  const connector = new GrafanaDashboardConnector({
    headless: false, // Mostrar navegador para ver el proceso
    screenshotDir: './quick-checks'
  });

  try {
    const result = await connector.connectAndCapture({
      waitBeforeCapture: 2000,
      filename: `quick-check-${Date.now()}.png`,
      saveMetrics: true
    });

    console.log('\n🎉 ¡Verificación completada exitosamente!');
    console.log(`📸 Screenshot: ${result.screenshot}`);
    console.log(`📊 Métricas extraídas: ${result.metrics.extracted_values.length} valores`);
    console.log(`⏰ Timestamp: ${result.timestamp}`);
    
    // Mostrar algunas métricas importantes
    console.log('\n📈 Métricas encontradas:');
    result.metrics.extracted_values.forEach((metric, index) => {
      if (metric.numeric_value > 0) {
        console.log(`  ${index + 1}. ${metric.raw_text} (${metric.numeric_value})`);
      }
    });

  } catch (error) {
    console.error('\n❌ Error en verificación:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  quickDashboardCheck();
}

module.exports = quickDashboardCheck; 
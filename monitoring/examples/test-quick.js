#!/usr/bin/env node

/**
 * 🚀 Test Rápido de Grafana Dashboard
 * Versión que funciona con Chrome disponible
 */

const puppeteer = require('puppeteer');

async function testGrafanaConnection() {
  console.log('🚀 Probando conexión a Grafana...');
  
  let browser;
  try {
    // Usar configuración que no requiere versión específica de Chrome
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpio',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      ignoreDefaultArgs: ['--disable-extensions'],
      timeout: 60000
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('🔑 Conectando a Grafana...');
    
    // Ir a Grafana
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('📄 Página cargada, verificando contenido...');
    
    // Verificar que Grafana está funcionando
    const title = await page.title();
    console.log(`📊 Título de la página: ${title}`);
    
    // Verificar si ya está logueado o necesita login
    const loginForm = await page.$('input[name="user"], input[placeholder*="email"]');
    
    if (loginForm) {
      console.log('🔐 Haciendo login...');
      await page.type('input[name="user"], input[placeholder*="email"]', 'admin');
      await page.type('input[name="password"], input[type="password"]', 'wayuu2024');
      await page.click('button[type="submit"]');
      
      // Esperar a que cargue
      await page.waitForTimeout(3000);
    } else {
      console.log('✅ Ya está logueado');
    }
    
    // Ir al dashboard
    console.log('🎯 Navegando al dashboard...');
    await page.goto('http://localhost:3001/d/wayuu-growth/wayuu-growth-dashboard?orgId=1&refresh=30s&from=now-3h&to=now', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    await page.waitForTimeout(5000); // Esperar a que carguen los datos
    
    // Extraer información básica
    const dashboardInfo = await page.evaluate(() => {
      const panels = document.querySelectorAll('[data-testid*="Panel"], .panel-container');
      const statValues = document.querySelectorAll('.stat-panel-value, .singlestat-panel-value');
      
      return {
        url: window.location.href,
        panels_count: panels.length,
        stat_values: Array.from(statValues).map(el => el.textContent?.trim()).filter(Boolean)
      };
    });
    
    console.log('✅ ¡Conexión exitosa!');
    console.log('📊 Información del dashboard:');
    console.log(`   - URL: ${dashboardInfo.url}`);
    console.log(`   - Paneles encontrados: ${dashboardInfo.panels_count}`);
    console.log(`   - Valores de métricas: ${dashboardInfo.stat_values.join(', ')}`);
    
    return dashboardInfo;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Ejecutar test
testGrafanaConnection()
  .then(() => {
    console.log('🎉 ¡Test completado exitosamente!');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Test falló:', err.message);
    process.exit(1);
  }); 
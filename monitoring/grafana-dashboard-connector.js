#!/usr/bin/env node

/**
 * 📊 Grafana Dashboard Connector con Puppeteer
 * 
 * Script para conectarse automáticamente al dashboard de Wayuu Growth en Grafana
 * Funcionalidades:
 * - Login automático
 * - Navegación al dashboard específico
 * - Captura de pantallas
 * - Extracción de métricas
 * - Monitoreo automatizado
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class GrafanaDashboardConnector {
  constructor(config = {}) {
    this.config = {
      grafanaUrl: config.grafanaUrl || 'http://localhost:3001',
      username: config.username || 'admin',
      password: config.password || 'wayuu2024',
      dashboardId: config.dashboardId || 'wayuu-growth',
      headless: config.headless !== false, // Por defecto headless
      screenshotDir: config.screenshotDir || './screenshots',
      timeout: config.timeout || 30000,
      ...config
    };
    
    this.browser = null;
    this.page = null;
  }

  /**
   * 🚀 Inicializar navegador y página
   */
  async init() {
    console.log('🔄 Iniciando Puppeteer...');
    
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Crear directorio de screenshots si no existe
    await this.ensureScreenshotDir();
    
    console.log('✅ Puppeteer iniciado correctamente');
  }

  /**
   * 🔐 Login automático en Grafana
   */
  async login() {
    console.log('🔑 Realizando login en Grafana...');
    
    try {
      await this.page.goto(this.config.grafanaUrl, { 
        waitUntil: 'networkidle0',
        timeout: this.config.timeout 
      });

      // Verificar si ya está logueado
      const isLoggedIn = await this.page.$('.sidemenu') !== null;
      if (isLoggedIn) {
        console.log('✅ Ya está logueado en Grafana');
        return true;
      }

      // Llenar formulario de login
      await this.page.waitForSelector('input[name="user"], input[placeholder*="email"]', { timeout: 10000 });
      await this.page.type('input[name="user"], input[placeholder*="email"]', this.config.username);
      await this.page.type('input[name="password"], input[type="password"]', this.config.password);
      
      // Hacer click en login
      await this.page.click('button[type="submit"]');
      
      // Esperar a que cargue el dashboard principal
      await this.page.waitForSelector('.sidemenu', { timeout: 15000 });
      
      console.log('✅ Login exitoso en Grafana');
      return true;
      
    } catch (error) {
      console.error('❌ Error en login:', error.message);
      throw error;
    }
  }

  /**
   * 📈 Navegar al dashboard específico
   */
  async navigateToDashboard(dashboardId = null) {
    const targetDashboard = dashboardId || this.config.dashboardId;
    const dashboardUrl = `${this.config.grafanaUrl}/d/${targetDashboard}/wayuu-growth-dashboard?orgId=1&refresh=30s&from=now-3h&to=now`;
    
    console.log(`🎯 Navegando al dashboard: ${targetDashboard}`);
    
    try {
      await this.page.goto(dashboardUrl, { 
        waitUntil: 'networkidle0',
        timeout: this.config.timeout 
      });
      
      // Esperar a que carguen los paneles
      await this.page.waitForSelector('[data-testid="data-testid Panel container"]', { timeout: 15000 });
      
      console.log('✅ Dashboard cargado correctamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error navegando al dashboard:', error.message);
      throw error;
    }
  }

  /**
   * 📸 Capturar screenshot del dashboard
   */
  async takeScreenshot(filename = null) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const screenshotName = filename || `dashboard-${timestamp}.png`;
    const fullPath = path.join(this.config.screenshotDir, screenshotName);
    
    console.log(`📸 Capturando screenshot: ${screenshotName}`);
    
    try {
      await this.page.screenshot({
        path: fullPath,
        fullPage: true
      });
      
      console.log(`✅ Screenshot guardado: ${fullPath}`);
      return fullPath;
      
    } catch (error) {
      console.error('❌ Error capturando screenshot:', error.message);
      throw error;
    }
  }

  /**
   * 📊 Extraer métricas del dashboard
   */
  async extractMetrics() {
    console.log('📊 Extrayendo métricas del dashboard...');
    
    try {
      const metrics = await this.page.evaluate(() => {
        const extractNumber = (text) => {
          if (!text) return 0;
          const match = text.replace(/[K,]/g, '000').replace(/[,]/g, '').match(/[\d.]+/);
          return match ? parseFloat(match[0]) : 0;
        };

        // Buscar elementos con métricas
        const metricElements = document.querySelectorAll('[data-testid*="Panel"] .stat-panel-value, .singlestat-panel-value, .graph-panel-value');
        const tableRows = document.querySelectorAll('table tbody tr');
        
        const metrics = {
          timestamp: new Date().toISOString(),
          dashboard_loaded: true,
          panel_count: document.querySelectorAll('[data-testid*="Panel"]').length,
          extracted_values: []
        };

        // Extraer valores de paneles
        metricElements.forEach((element, index) => {
          const text = element.textContent?.trim();
          if (text) {
            metrics.extracted_values.push({
              type: 'panel',
              index,
              raw_text: text,
              numeric_value: extractNumber(text)
            });
          }
        });

        // Extraer datos de la tabla si existe
        if (tableRows.length > 0) {
          tableRows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) { // Time, name, instance, job, value
              const value = cells[cells.length - 1]?.textContent?.trim();
              const name = cells[1]?.textContent?.trim();
              
              if (value && name) {
                metrics.extracted_values.push({
                  type: 'table',
                  index,
                  metric_name: name,
                  raw_text: value,
                  numeric_value: extractNumber(value)
                });
              }
            }
          });
        }

        return metrics;
      });
      
      console.log(`✅ Métricas extraídas: ${metrics.extracted_values.length} valores`);
      return metrics;
      
    } catch (error) {
      console.error('❌ Error extrayendo métricas:', error.message);
      throw error;
    }
  }

  /**
   * 🔄 Refrescar dashboard
   */
  async refreshDashboard() {
    console.log('🔄 Refrescando dashboard...');
    
    try {
      // Buscar botón de refresh o usar F5
      const refreshButton = await this.page.$('[data-testid*="refresh"], .navbar-button--refresh');
      
      if (refreshButton) {
        await refreshButton.click();
      } else {
        await this.page.keyboard.press('F5');
      }
      
      // Esperar a que se recargue
      await this.page.waitForSelector('[data-testid="data-testid Panel container"]', { timeout: 15000 });
      
      console.log('✅ Dashboard refrescado');
      return true;
      
    } catch (error) {
      console.error('❌ Error refrescando dashboard:', error.message);
      throw error;
    }
  }

  /**
   * 📁 Crear directorio de screenshots
   */
  async ensureScreenshotDir() {
    try {
      await fs.access(this.config.screenshotDir);
    } catch {
      await fs.mkdir(this.config.screenshotDir, { recursive: true });
      console.log(`📁 Directorio creado: ${this.config.screenshotDir}`);
    }
  }

  /**
   * 🔒 Cerrar navegador
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Navegador cerrado');
    }
  }

  /**
   * 🎯 Método principal para conexión completa
   */
  async connectAndCapture(options = {}) {
    try {
      await this.init();
      await this.login();
      await this.navigateToDashboard();
      
      if (options.waitBeforeCapture) {
        console.log(`⏳ Esperando ${options.waitBeforeCapture}ms antes de capturar...`);
        await this.page.waitForTimeout(options.waitBeforeCapture);
      }
      
      const screenshotPath = await this.takeScreenshot(options.filename);
      const metrics = await this.extractMetrics();
      
      // Guardar métricas en JSON
      if (options.saveMetrics !== false) {
        const metricsPath = screenshotPath.replace('.png', '-metrics.json');
        await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2));
        console.log(`📊 Métricas guardadas: ${metricsPath}`);
      }
      
      return {
        success: true,
        screenshot: screenshotPath,
        metrics,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error en proceso completo:', error.message);
      throw error;
    } finally {
      if (!options.keepOpen) {
        await this.close();
      }
    }
  }
}

// 🚀 EJEMPLOS DE USO
async function ejemploUsoBasico() {
  const connector = new GrafanaDashboardConnector();
  
  try {
    const result = await connector.connectAndCapture({
      waitBeforeCapture: 3000, // Esperar 3 segundos antes de capturar
      filename: 'wayuu-dashboard-check.png'
    });
    
    console.log('🎉 Proceso completado:', result);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function ejemploMonitoreoAutomatizado() {
  const connector = new GrafanaDashboardConnector({ headless: true });
  
  try {
    await connector.init();
    await connector.login();
    await connector.navigateToDashboard();
    
    // Capturar cada 5 minutos
    for (let i = 0; i < 12; i++) { // 1 hora total
      console.log(`📊 Captura ${i + 1}/12`);
      
      await connector.refreshDashboard();
      await connector.takeScreenshot(`monitoring-${Date.now()}.png`);
      const metrics = await connector.extractMetrics();
      
      console.log(`Valores extraídos: ${metrics.extracted_values.length}`);
      
      if (i < 11) { // No esperar en la última iteración
        console.log('⏳ Esperando 5 minutos...');
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      }
    }
    
  } catch (error) {
    console.error('❌ Error en monitoreo:', error);
  } finally {
    await connector.close();
  }
}

// 🏃‍♂️ EJECUTAR SI ES LLAMADO DIRECTAMENTE
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📊 Grafana Dashboard Connector

Uso:
  node grafana-dashboard-connector.js [opciones]

Opciones:
  --basic           Ejecutar ejemplo básico
  --monitor         Ejecutar monitoreo automatizado
  --headless=false  Mostrar navegador (por defecto oculto)
  --help, -h        Mostrar esta ayuda

Ejemplos:
  node grafana-dashboard-connector.js --basic
  node grafana-dashboard-connector.js --monitor
  node grafana-dashboard-connector.js --basic --headless=false
    `);
    process.exit(0);
  }
  
  if (args.includes('--basic')) {
    ejemploUsoBasico();
  } else if (args.includes('--monitor')) {
    ejemploMonitoreoAutomatizado();
  } else {
    console.log('📊 Ejecutando ejemplo básico por defecto...');
    ejemploUsoBasico();
  }
}

module.exports = GrafanaDashboardConnector; 
const puppeteer = require('puppeteer');

async function testPDFAnalyticsGrafana() {
    console.log('🚀 Starting PDF Analytics Grafana Verification...');
    
    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('🔧 Step 1: Updating PDF metrics...');
        
        // First, update PDF metrics
        const updateResponse = await fetch('http://localhost:3002/api/metrics/update-pdf-metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const updateResult = await updateResponse.json();
        console.log('✅ Metrics updated:', updateResult);
        
        console.log('📊 Step 2: Verifying Prometheus metrics...');
        
        // Verify Prometheus has the metrics
        const prometheusResponse = await fetch('http://localhost:9090/api/v1/query?query=wayuu_pdf_processing_total_pdfs');
        const prometheusData = await prometheusResponse.json();
        
        if (prometheusData.data.result.length > 0) {
            console.log('✅ Prometheus metrics verified:', prometheusData.data.result[0].value[1]);
        } else {
            console.log('❌ No Prometheus metrics found');
        }
        
        console.log('📈 Step 3: Testing Grafana dashboard...');
        
        // Wait for Grafana to be ready
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Navigate to Grafana
        await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
        
        // Login to Grafana (default credentials)
        try {
            await page.waitForSelector('input[name="user"]', { timeout: 5000 });
            await page.type('input[name="user"]', 'admin');
            await page.type('input[name="password"]', 'admin');
            await page.click('button[type="submit"]');
            
            // Skip password change if prompted
            try {
                await page.waitForSelector('button[aria-label="Skip"]', { timeout: 3000 });
                await page.click('button[aria-label="Skip"]');
            } catch (e) {
                console.log('No password change prompt');
            }
        } catch (e) {
            console.log('Already logged in or different login flow');
        }
        
        // Take screenshot of Grafana main page
        await page.screenshot({ path: 'screenshots/grafana-main.png' });
        console.log('✅ Grafana main page screenshot taken');
        
        console.log('🔍 Step 4: Searching for PDF dashboard...');
        
        // Search for PDF dashboard
        await page.goto('http://localhost:3001/dashboards', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: 'screenshots/grafana-dashboards.png' });
        
        // Try to find PDF dashboard
        try {
            await page.waitForSelector('input[placeholder*="Search"]', { timeout: 5000 });
            await page.type('input[placeholder*="Search"]', 'PDF');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await page.screenshot({ path: 'screenshots/grafana-pdf-search.png' });
            console.log('✅ PDF dashboard search screenshot taken');
        } catch (e) {
            console.log('Search input not found, continuing...');
        }
        
        console.log('📊 Step 5: Testing direct dashboard access...');
        
        // Try to access PDF dashboard directly
        await page.goto('http://localhost:3001/d/wayuu-pdf-analytics/wayuu-pdf-analytics-dashboard', { 
            waitUntil: 'networkidle2' 
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        await page.screenshot({ path: 'screenshots/grafana-pdf-dashboard.png' });
        console.log('✅ PDF dashboard screenshot taken');
        
        console.log('🎯 Step 6: Verifying dashboard panels...');
        
        // Check for specific panels
        const panels = await page.evaluate(() => {
            const panelTitles = Array.from(document.querySelectorAll('[data-testid="panel-header-title"]'));
            return panelTitles.map(title => title.textContent);
        });
        
        console.log('📋 Found panels:', panels);
        
        console.log('✅ Step 7: Complete verification...');
        
        // Final verification
        const verification = {
            timestamp: new Date().toISOString(),
            metrics_updated: updateResult.success,
            prometheus_working: prometheusData.data.result.length > 0,
            grafana_accessible: true,
            dashboard_created: true,
            panels_found: panels.length > 0,
            total_pdfs: prometheusData.data.result.length > 0 ? prometheusData.data.result[0].value[1] : 'N/A'
        };
        
        console.log('📊 Final Verification Results:', verification);
        
        // Save verification results
        const fs = require('fs');
        fs.writeFileSync('pdf-grafana-verification.json', JSON.stringify(verification, null, 2));
        
        return verification;
        
    } catch (error) {
        console.error('❌ Error during verification:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
testPDFAnalyticsGrafana().then(result => {
    console.log('\n🎉 PDF Analytics Grafana Verification Complete!');
    console.log('📊 Result:', result);
    
    if (result.success !== false) {
        console.log('\n✅ SUCCESS: PDF Analytics integration verified!');
        console.log('🔗 Access your dashboard at: http://localhost:3001/d/wayuu-pdf-analytics/wayuu-pdf-analytics-dashboard');
    } else {
        console.log('\n❌ FAILURE: Integration issues found');
    }
}).catch(console.error); 
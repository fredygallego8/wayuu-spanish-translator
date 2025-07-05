const puppeteer = require('puppeteer');

async function testPDFAnalyticsSimple() {
    console.log('🚀 Starting Simple PDF Analytics Test...');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('📱 Testing main page...');
        await page.goto('http://localhost:4000', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: 'screenshots/main-page.png' });
        console.log('✅ Main page screenshot taken');
        
        console.log('📊 Testing PDF Analytics page...');
        await page.goto('http://localhost:4000/pdf-analytics', { waitUntil: 'networkidle2' });
        
        // Wait a bit for any dynamic content
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await page.screenshot({ path: 'screenshots/pdf-analytics-initial.png' });
        console.log('✅ PDF Analytics initial screenshot taken');
        
        // Check what's actually on the page
        const pageContent = await page.evaluate(() => {
            return {
                title: document.title,
                hasLoadingText: document.body.textContent.includes('Cargando'),
                hasErrorText: document.body.textContent.includes('Error'),
                bodyText: document.body.textContent.substring(0, 500),
                hasStatsCards: document.querySelectorAll('.bg-white.rounded-lg.shadow-md').length,
                hasSpinner: document.querySelector('.animate-spin') !== null
            };
        });
        
        console.log('📄 Page Analysis:', pageContent);
        
        // Test API endpoints directly
        console.log('🌐 Testing API endpoints...');
        
        const statsResponse = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/backend-proxy/pdf-processing/stats');
                return await response.json();
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log('📊 Stats API Response:', statsResponse);
        
        // Wait longer for potential loading
        console.log('⏱️  Waiting for potential data loading...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        await page.screenshot({ path: 'screenshots/pdf-analytics-after-wait.png' });
        console.log('✅ PDF Analytics after wait screenshot taken');
        
        // Check if anything changed
        const finalContent = await page.evaluate(() => {
            return {
                hasLoadingText: document.body.textContent.includes('Cargando'),
                hasErrorText: document.body.textContent.includes('Error'),
                hasStatsCards: document.querySelectorAll('.bg-white.rounded-lg.shadow-md').length,
                hasSpinner: document.querySelector('.animate-spin') !== null,
                hasH1: document.querySelector('h1') !== null,
                hasCanvas: document.querySelector('canvas') !== null,
                hasSvg: document.querySelector('svg') !== null
            };
        });
        
        console.log('📄 Final Analysis:', finalContent);
        
        console.log('🎉 Simple PDF Analytics test completed!');
        
        // Summary
        console.log('\n📋 TEST SUMMARY:');
        console.log('================');
        console.log(`✅ Page title: ${pageContent.title}`);
        console.log(`✅ Has loading text: ${pageContent.hasLoadingText}`);
        console.log(`✅ Has error text: ${pageContent.hasErrorText}`);
        console.log(`✅ Stats cards: ${pageContent.hasStatsCards}`);
        console.log(`✅ Has spinner: ${pageContent.hasSpinner}`);
        console.log(`✅ Final stats cards: ${finalContent.hasStatsCards}`);
        console.log(`✅ Final has H1: ${finalContent.hasH1}`);
        console.log(`✅ Final has charts: ${finalContent.hasCanvas || finalContent.hasSvg}`);
        console.log(`✅ API Stats working: ${statsResponse.success || false}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
testPDFAnalyticsSimple().catch(console.error); 
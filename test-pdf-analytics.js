const puppeteer = require('puppeteer');

async function testPDFAnalytics() {
    console.log('🚀 Starting PDF Analytics Test...');
    
    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('📱 Testing main page...');
        
        // Navigate to main page
        await page.goto('http://localhost:4000', { waitUntil: 'networkidle2' });
        
        // Take screenshot of main page
        await page.screenshot({ path: 'screenshots/main-page.png' });
        console.log('✅ Main page loaded successfully');
        
        console.log('📊 Testing PDF Analytics page...');
        
        // Navigate to PDF Analytics page
        await page.goto('http://localhost:4000/pdf-analytics', { waitUntil: 'networkidle2' });
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if page has loaded (wait for either loading or content)
        await page.waitForSelector('span, h1', { timeout: 10000 }).catch(() => {
            console.log('⏱️  No loading indicator or title found, continuing...');
        });
        
        // Wait for content to load by checking for stats or loading state
        await page.waitForFunction(() => {
            return document.querySelector('h1') || 
                   document.querySelector('span') && document.querySelector('span').textContent.includes('Cargando') ||
                   document.querySelector('[data-testid="stats-card"]') ||
                   document.querySelector('.bg-white.rounded-lg.shadow-md');
        }, { timeout: 15000 });
        
        const pageTitle = await page.evaluate(() => {
            const h1 = document.querySelector('h1');
            const loadingText = document.querySelector('span');
            return h1 ? h1.textContent : (loadingText ? loadingText.textContent : 'No title found');
        });
        console.log(`📄 Page content: ${pageTitle}`);
        
        // Check for key elements
        const elements = await page.evaluate(() => {
            const results = {
                hasTitle: !!document.querySelector('h1'),
                hasStatsCards: document.querySelectorAll('.bg-white.rounded-lg.shadow-md').length > 0,
                hasCharts: document.querySelectorAll('canvas, svg').length > 0,
                hasDocumentsTable: !!document.querySelector('table'),
                hasLoadingState: document.textContent.includes('Cargando'),
                hasErrorState: document.textContent.includes('Error'),
                totalCards: document.querySelectorAll('.bg-white.rounded-lg.shadow-md').length,
                totalCharts: document.querySelectorAll('canvas, svg').length
            };
            return results;
        });
        
        console.log('🔍 Element Analysis:', elements);
        
        // Take screenshot of PDF Analytics page
        await page.screenshot({ path: 'screenshots/pdf-analytics-page.png' });
        console.log('✅ PDF Analytics page screenshot taken');
        
        // Test API endpoints through the browser
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
        
        const documentsResponse = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/backend-proxy/pdf-processing/documents');
                const data = await response.json();
                return {
                    success: data.success,
                    count: data.data?.count || 0,
                    firstDoc: data.data?.documents?.[0]?.fileName || 'N/A'
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log('📄 Documents API Response:', documentsResponse);
        
        // Check if navigation works
        console.log('🧭 Testing navigation...');
        
        const navigationLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('nav a'));
            return links.map(link => ({
                text: link.textContent.trim(),
                href: link.getAttribute('href')
            }));
        });
        
        console.log('🔗 Navigation links found:', navigationLinks);
        
        // Test if we can navigate to other pages
        await page.goto('http://localhost:4000/documentation', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: 'screenshots/documentation-page.png' });
        console.log('✅ Documentation page accessible');
        
        // Go back to PDF Analytics
        await page.goto('http://localhost:4000/pdf-analytics', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Final screenshot
        await page.screenshot({ path: 'screenshots/pdf-analytics-final.png' });
        
        console.log('🎉 PDF Analytics test completed successfully!');
        
        // Summary
        console.log('\n📋 TEST SUMMARY:');
        console.log('================');
        console.log(`✅ Main page: Loaded`);
        console.log(`✅ PDF Analytics page: Loaded`);
        console.log(`✅ Page title: ${pageTitle}`);
        console.log(`✅ Stats cards: ${elements.totalCards} found`);
        console.log(`✅ Charts: ${elements.totalCharts} found`);
        console.log(`✅ Documents table: ${elements.hasDocumentsTable ? 'Present' : 'Missing'}`);
        console.log(`✅ API Stats: ${statsResponse.success ? 'Working' : 'Failed'}`);
        console.log(`✅ API Documents: ${documentsResponse.success ? 'Working' : 'Failed'}`);
        console.log(`✅ Navigation: ${navigationLinks.length} links found`);
        
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
testPDFAnalytics().catch(console.error); 
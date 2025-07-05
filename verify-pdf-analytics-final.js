// 🎯 VERIFICACIÓN FINAL: PDF Analytics Dashboard
console.log('🚀 Iniciando verificación final del sistema PDF Analytics...\n');

async function verifyPDFAnalytics() {
    const results = {
        backend: false,
        prometheus: false,
        metrics_updated: false,
        data_correct: false,
        timestamp: new Date().toISOString()
    };

    try {
        // 1. Verificar Backend
        console.log('1. 🔍 Verificando Backend...');
        const backendResponse = await fetch('http://localhost:3002/api/pdf-processing/health');
        const backendData = await backendResponse.json();
        results.backend = backendData.success;
        console.log(`   ✅ Backend: ${backendData.message}`);

        // 2. Actualizar métricas
        console.log('\n2. 📊 Actualizando métricas...');
        const updateResponse = await fetch('http://localhost:3002/api/metrics/update-pdf-metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const updateData = await updateResponse.json();
        results.metrics_updated = updateData.success;
        console.log(`   ✅ Métricas: ${updateData.message}`);
        console.log(`   📈 Datos: ${JSON.stringify(updateData.data, null, 2)}`);

        // 3. Verificar Prometheus
        console.log('\n3. 🔍 Verificando Prometheus...');
        const promResponse = await fetch('http://localhost:9090/api/v1/query?query=wayuu_pdf_processing_total_pdfs');
        const promData = await promResponse.json();
        
        if (promData.data.result.length > 0) {
            const value = promData.data.result[0].value[1];
            results.prometheus = true;
            results.data_correct = (value === '4');
            console.log(`   ✅ Prometheus: Conectado y scrapeando`);
            console.log(`   📊 Total PDFs en Prometheus: ${value}`);
        } else {
            console.log(`   ❌ Prometheus: Sin datos`);
        }

        // 4. Verificar datos específicos
        console.log('\n4. 📈 Verificando datos específicos...');
        const queries = [
            { name: 'Total PDFs', query: 'wayuu_pdf_processing_total_pdfs', expected: '4' },
            { name: 'Total Páginas', query: 'wayuu_pdf_processing_total_pages', expected: '568' },
            { name: 'Frases Wayuu', query: 'wayuu_pdf_processing_wayuu_phrases', expected: '342' },
            { name: '% Wayuu', query: 'wayuu_pdf_processing_wayuu_percentage', expected: '41' }
        ];

        for (const q of queries) {
            const response = await fetch(`http://localhost:9090/api/v1/query?query=${q.query}`);
            const data = await response.json();
            const value = data.data.result.length > 0 ? data.data.result[0].value[1] : 'N/A';
            const status = value === q.expected ? '✅' : '❌';
            console.log(`   ${status} ${q.name}: ${value} (esperado: ${q.expected})`);
        }

        // 5. Resumen final
        console.log('\n🎯 RESUMEN FINAL:');
        console.log(`   Backend: ${results.backend ? '✅ Funcionando' : '❌ Error'}`);
        console.log(`   Prometheus: ${results.prometheus ? '✅ Conectado' : '❌ Sin conexión'}`);
        console.log(`   Métricas: ${results.metrics_updated ? '✅ Actualizadas' : '❌ Error'}`);
        console.log(`   Datos: ${results.data_correct ? '✅ Correctos' : '❌ Incorrectos'}`);

        const allGood = results.backend && results.prometheus && results.metrics_updated && results.data_correct;
        
        console.log(`\n🎉 ESTADO GENERAL: ${allGood ? '✅ TODO FUNCIONANDO PERFECTAMENTE' : '❌ REQUIERE ATENCIÓN'}`);
        
        if (allGood) {
            console.log('\n🔗 ACCESOS DIRECTOS:');
            console.log('   📊 Dashboard Grafana: http://localhost:3001/d/wayuu-pdf-analytics/wayuu-pdf-analytics-dashboard');
            console.log('   📈 Prometheus: http://localhost:9090/targets');
            console.log('   🎯 Frontend PDF Analytics: http://localhost:4000/pdf-analytics');
            console.log('   🔧 Backend Health: http://localhost:3002/api/pdf-processing/health');
        }

        return results;

    } catch (error) {
        console.error('❌ Error durante la verificación:', error.message);
        return { ...results, error: error.message };
    }
}

// Ejecutar verificación
verifyPDFAnalytics().then(results => {
    console.log('\n📋 Resultados guardados para referencia futura.');
    
    // Guardar resultados
    const fs = require('fs');
    fs.writeFileSync('pdf-analytics-verification-final.json', JSON.stringify(results, null, 2));
    
    process.exit(results.backend && results.prometheus && results.metrics_updated && results.data_correct ? 0 : 1);
}).catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
}); 
/**
 * Test script to debug real PDF content patterns
 */
const fetch = require('node-fetch');
const { AbortController } = require('abort-controller');

async function testRealPDFPatterns() {
  try {
    console.log('🔍 Fetching actual PDF content from API...\n');
    
    // Add timeout for PDF debug fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds for PDF processing
    
    // Fetch debug info for dictionary PDF
    const response = await fetch('http://localhost:3002/api/pdf-processing/debug/extraction-analysis?fileName=WayuuDict_45801.pdf', {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const debugData = await response.json();
    
    if (!debugData.success) {
      throw new Error(debugData.message || 'Failed to fetch PDF data');
    }
    
    const fullText = debugData.data.textSample;
    console.log(`📄 PDF: ${debugData.data.pdfInfo.fileName}`);
    console.log(`📊 Pages: ${debugData.data.pdfInfo.pageCount}`);
    console.log(`📝 Text length: ${debugData.data.pdfInfo.textLength}`);
    console.log(`🎯 Wayuu percentage: ${debugData.data.pdfInfo.wayuuPercentage}%\n`);
    
    // Test our patterns
    const patterns = {
      academicPattern1: /([a-züÜ'ꞌ]+(?:\s+[a-züÜ'ꞌ]+)*)\s*[–—-]\s*([a-záéíóúñüÁÉÍÓÚÑÜ]+(?:\s+[a-záéíóúñüÁÉÍÓÚÑÜ\s,\.]*)*)/gi,
      definitionPattern: /([a-züÜ'ꞌ]+(?:\s+[a-züÜ'ꞌ]+){0,2})\s*:\s*([a-záéíóúñüÁÉÍÓÚÑÜ][^:\n]{3,100})/gi,
      // Test a simpler dash pattern without line breaks
      simpleDashPattern: /([a-züÜ'ꞌ]+)\s*-\s*([a-záéíóúñüÁÉÍÓÚÑÜ]+)/gi,
      // Test line-by-line pattern
      linePattern: /^([a-züÜ'ꞌ]+(?:\s+[a-züÜ'ꞌ]+)*)\s*[–—:-]\s*([a-záéíóúñüÁÉÍÓÚÑÜ]+.*)$/gm
    };
    
    console.log('🧪 Testing patterns on real PDF content...\n');
    
    Object.entries(patterns).forEach(([patternName, regex]) => {
      console.log(`--- ${patternName} ---`);
      
      let match;
      let count = 0;
      const regexCopy = new RegExp(regex.source, regex.flags);
      
      while ((match = regexCopy.exec(fullText)) !== null && count < 10) { // Limit to 10 matches
        count++;
        const wayuu = match[1] ? match[1].trim() : 'N/A';
        const spanish = match[2] ? match[2].trim() : 'N/A';
        console.log(`  ${count}. "${wayuu}" → "${spanish}"`);
      }
      
      if (count === 0) {
        console.log('  No matches found');
      } else if (count === 10) {
        console.log('  ... (showing first 10 matches)');
      }
      
      console.log('');
    });
    
    // Show some sample text from different parts
    console.log('📝 Sample text chunks:\n');
    const chunks = fullText.split('\n').filter(line => line.trim().length > 0);
    
    // Show first 10 lines
    console.log('--- First 10 lines ---');
    chunks.slice(0, 10).forEach((line, i) => {
      console.log(`${i+1}. "${line}"`);
    });
    
    // Show middle section
    console.log('\n--- Middle section (lines around ' + Math.floor(chunks.length/2) + ') ---');
    const middle = Math.floor(chunks.length / 2);
    chunks.slice(middle-5, middle+5).forEach((line, i) => {
      console.log(`${middle-5+i+1}. "${line}"`);
    });
    
    // Show last 10 lines
    console.log('\n--- Last 10 lines ---');
    chunks.slice(-10).forEach((line, i) => {
      console.log(`${chunks.length-10+i+1}. "${line}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRealPDFPatterns(); 
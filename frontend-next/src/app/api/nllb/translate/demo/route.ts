import { NextRequest, NextResponse } from 'next/server';

interface TranslateRequest {
  text: string;
  sourceLang: 'wayuu' | 'spanish';
  targetLang: 'wayuu' | 'spanish';
}

interface TranslationResult {
  translatedText: string;
  confidence: number;
  sourceLanguage: string;
  targetLanguage: string;
  model: string;
  processingTime: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();
    
    // Validate input
    if (!body.text || !body.sourceLang || !body.targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields: text, sourceLang, targetLang' },
        { status: 400 }
      );
    }

    if (body.sourceLang === body.targetLang) {
      return NextResponse.json(
        { error: 'Source and target languages cannot be the same' },
        { status: 400 }
      );
    }

    // 🎯 Demo mode - lightweight timeout (10s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      // Connect to backend NLLB demo service
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3002';
      
      console.log(`🎯 [NLLB DEMO] Demo translation request: ${body.sourceLang} → ${body.targetLang}`);
      console.log(`📝 [NLLB DEMO] Text preview: "${body.text.substring(0, 50)}..."`);
      console.log(`💡 [NLLB DEMO] Using built-in dictionary (no API key required)`);

      const response = await fetch(`${backendUrl}/api/nllb/translate/demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      // Clear timeout on response received
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [NLLB DEMO] Backend error ${response.status}: ${errorText}`);
        
        return NextResponse.json(
          { error: `Demo translation failed: ${errorText}` },
          { status: response.status }
        );
      }

      const result: TranslationResult = await response.json();
      
      console.log(`✅ [NLLB DEMO] Demo translation completed in ${result.processingTime}ms`);
      console.log(`📊 [NLLB DEMO] Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`🔧 [NLLB DEMO] Model used: ${result.model}`);

      return NextResponse.json(result);

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('⏱️ [NLLB DEMO] Request timeout after 10s');
        return NextResponse.json(
          { error: 'Demo timeout - this should not happen in demo mode' },
          { status: 408 }
        );
      }
      
      if (fetchError.code === 'ECONNREFUSED') {
        console.error('🔌 [NLLB DEMO] Backend connection refused');
        return NextResponse.json(
          { error: 'Backend service unavailable - please check if backend is running' },
          { status: 503 }
        );
      }
      
      console.error(`❌ [NLLB DEMO] Fetch error: ${fetchError.message}`);
      return NextResponse.json(
        { error: `Connection error: ${fetchError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error(`❌ [NLLB DEMO] Request processing error: ${error.message}`);
    return NextResponse.json(
      { error: `Request processing failed: ${error.message}` },
      { status: 500 }
    );
  }
}

// Health check for demo mode
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    mode: 'demo',
    description: 'Demo translation using built-in wayuu-spanish dictionary',
    features: [
      'No API key required',
      'Built-in wayuu vocabulary', 
      'Realistic processing simulation',
      'Confidence scoring'
    ],
    timestamp: new Date().toISOString()
  });
} 
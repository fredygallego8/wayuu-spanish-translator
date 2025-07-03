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

    // 🔧 Setup timeout with AbortController - 30s aligned with backend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000);

    try {
      // Connect to backend NLLB service
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3002';
      
      console.log(`🧠 [NLLB API] Smart translation request: ${body.sourceLang} → ${body.targetLang}`);
      console.log(`📝 [NLLB API] Text preview: "${body.text.substring(0, 50)}..."`);
      console.log(`⏱️  [NLLB API] Using 30s timeout aligned with backend`);

      const response = await fetch(`${backendUrl}/api/nllb/translate/smart`, {
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
        console.error(`❌ [NLLB API] Backend error ${response.status}: ${errorText}`);
        
        // Handle specific status codes
        if (response.status === 408) {
          return NextResponse.json(
            { error: 'Translation timeout - text too long or service overloaded' },
            { status: 408 }
          );
        }
        
        if (response.status === 503) {
          return NextResponse.json(
            { error: 'NLLB service unavailable - please check configuration' },
            { status: 503 }
          );
        }
        
        return NextResponse.json(
          { error: `Backend translation failed: ${errorText}` },
          { status: response.status }
        );
      }

      const result: TranslationResult = await response.json();
      
      console.log(`✅ [NLLB API] Translation completed in ${result.processingTime}ms`);
      console.log(`📊 [NLLB API] Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`🔧 [NLLB API] Model used: ${result.model}`);

      return NextResponse.json(result);

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('⏱️ [NLLB API] Request timeout after 30s');
        return NextResponse.json(
          { error: 'Request timeout - please try with shorter text' },
          { status: 408 }
        );
      }
      
      if (fetchError.code === 'ECONNREFUSED') {
        console.error('🔌 [NLLB API] Backend connection refused');
        return NextResponse.json(
          { error: 'Backend service unavailable - please check if backend is running' },
          { status: 503 }
        );
      }
      
      console.error(`❌ [NLLB API] Fetch error: ${fetchError.message}`);
      return NextResponse.json(
        { error: `Connection error: ${fetchError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error(`❌ [NLLB API] Request processing error: ${error.message}`);
    return NextResponse.json(
      { error: `Request processing failed: ${error.message}` },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3002';
    
    // Quick health check with 5s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(`${backendUrl}/api/nllb/service/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const healthData = await response.json();
      
      return NextResponse.json({
        status: 'healthy',
        frontend: 'Next.js API Route operational',
        backend: healthData,
        timestamp: new Date().toISOString()
      });
      
    } catch (healthError: any) {
      clearTimeout(timeoutId);
      
      return NextResponse.json({
        status: 'degraded',
        frontend: 'Next.js API Route operational',
        backend: 'Connection failed',
        error: healthError.message,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.text || !body.sourceLang || !body.targetLang || !body.context) {
      return NextResponse.json(
        { error: 'Missing required fields: text, sourceLang, targetLang, context' },
        { status: 400 }
      );
    }

    console.log('🧠 Contextual translation request:', {
      text: body.text.substring(0, 50) + '...',
      sourceLang: body.sourceLang,
      targetLang: body.targetLang,
      domain: body.context.domain,
      formality: body.context.formality
    });

    // Forward request to backend with proper timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

    const backendResponse = await fetch(`${BACKEND_URL}/nllb/translate/contextual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('❌ Backend contextual translation error:', errorText);
      
      return NextResponse.json(
        { 
          error: `Backend error: ${errorText}`,
          status: backendResponse.status 
        },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    
    console.log('✅ Contextual translation successful:', {
      confidence: result.confidence,
      qualityScore: result.qualityScore,
      adjustments: result.contextualAdjustments?.length || 0,
      cacheHit: result.cacheInfo?.hit || false
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Contextual translation API error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - contextual processing takes longer than 45 seconds' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error during contextual translation',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 
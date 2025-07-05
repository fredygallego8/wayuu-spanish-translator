import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '50';
    const domain = searchParams.get('domain') || '';
    
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit);
    if (domain) queryParams.append('domain', domain);
    
    const response = await fetch(`http://localhost:3002/api/gemini-dictionary/pending-review?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting pending review entries:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error connecting to backend', 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 
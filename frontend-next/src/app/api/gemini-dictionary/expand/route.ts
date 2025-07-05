import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch('http://localhost:3002/api/gemini-dictionary/expand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error expanding dictionary:', error);
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
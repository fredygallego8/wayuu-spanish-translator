import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:3002/api/gemini-dictionary/stats', {
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
    console.error('Error getting dictionary stats:', error);
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
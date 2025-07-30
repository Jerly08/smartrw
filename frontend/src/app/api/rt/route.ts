import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Build query string from search params
    const queryString = searchParams.toString();

    if (!authHeader) {
      return NextResponse.json(
        { status: 'error', message: 'Authorization header required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/rt${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Get RTs API error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

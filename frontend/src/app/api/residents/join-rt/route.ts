import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { status: 'error', message: 'Authorization header required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/residents/join-rt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Join RT API error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the original path segments and join them
    const pathSegments = params.path.map(segment => decodeURIComponent(segment));
    const path = pathSegments.join('/');
    
    // Construct the backend URL
    // The backend serves static files at /uploads/... not /api/uploads/...
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/${path}`;
    
    console.log('Proxying request to:', backendUrl);
    
    // Fetch the file from the backend
    const response = await fetch(backendUrl, {
      headers: {
        'Accept': '*/*',
      }
    });
    
    if (!response.ok) {
      console.error('Backend returned error:', response.status, response.statusText);
      return new NextResponse(null, { status: response.status });
    }
    
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return new NextResponse(null, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SigningApiClient } from '@/lib/SigningApiClient';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Ensure environment variables are available
    const username = process.env.SKRIBBLE_USERNAME;
    const apiKey = process.env.SKRIBBLE_API_KEY;

    if (!username || !apiKey) {
      return NextResponse.json(
        { error: 'API credentials are not configured' },
        { status: 500 }
      );
    }

    // Access the id - await it first to avoid "params should be awaited" error
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get the response format from query params
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') as 'json' | 'blob';

    // Initialize API client
    const signingApiClient = new SigningApiClient(username, apiKey);

    // Get document content
    const response = await signingApiClient.getDocumentContent(id, format === 'blob' ? 'blob' : 'json');

    // If format is blob, return the document as is
    if (format === 'blob' && response instanceof Blob) {
      return new NextResponse(response, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="document-${id}.pdf"`,
        },
      });
    }

    // Otherwise return the JSON response
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { 
        error: 'Failed to download document',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
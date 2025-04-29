import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SigningApiClient } from '@/lib/SigningApiClient';
import { verifyTurnstile, createErrorResponse } from '@/lib/TurnstileVerifier';

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

    // Get the document ID from the route parameters
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    // Verify Turnstile token using our utility
    const verificationResult = await verifyTurnstile({
      request,
      tokenFromHeader: true
    });

    if (!verificationResult.success) {
      return createErrorResponse(verificationResult);
    }
    
    // Initialize API client
    const signingApiClient = new SigningApiClient(username, apiKey);
    
    // Determine the response type - PDF or JSON
    const responseType = request.nextUrl.searchParams.get('responseType') || 'json';
    const asBlob = responseType === 'blob';
    
    // Get the document content
    const documentContent = await signingApiClient.getDocumentContent(id, asBlob ? 'blob' : 'json');
    
    // Return response based on type
    if (asBlob && documentContent instanceof Blob) {
      // Return binary PDF
      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', `attachment; filename="document-${id}.pdf"`);
      
      return new Response(documentContent, {
        status: 200,
        headers
      });
    }
    
    // Return JSON response
    return NextResponse.json(documentContent);
  } catch (error) {
    console.error('Error getting document content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get document content',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
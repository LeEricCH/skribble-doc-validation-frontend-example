import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SigningApiClient } from '@/lib/SigningApiClient';
import { verifyTurnstile, createErrorResponse } from '@/lib/TurnstileVerifier';

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(
  request: NextRequest,
  context: RouteParams
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

    // Access the id from the provided params - await it first
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Signature request ID is required' },
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
    
    // Get signature request status
    const response = await signingApiClient.getSignatureRequest(id);
    
    // Return the response
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting signature request status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get signature request status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
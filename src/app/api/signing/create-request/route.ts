import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SigningApiClient } from '@/lib/SigningApiClient';
import { verifyTurnstile, createErrorResponse } from '@/lib/TurnstileVerifier';

export async function POST(request: NextRequest) {
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

    // Parse the request body
    const body = await request.json();
    const { pdfBase64, email, mobileNumber, language, turnstileToken } = body;

    // Ensure required fields are provided
    if (!pdfBase64 || !email) {
      return NextResponse.json(
        { error: 'PDF content and email address are required' },
        { status: 400 }
      );
    }

    // Verify Turnstile token using our utility
    const verificationResult = await verifyTurnstile({
      request,
      tokenFromBody: true,
      bodyToken: turnstileToken
    });

    if (!verificationResult.success) {
      return createErrorResponse(verificationResult);
    }
    
    // Initialize API client
    const signingApiClient = new SigningApiClient(username, apiKey);
    
    // Create the signature request
    const response = await signingApiClient.createSignatureRequest(
      pdfBase64,
      email,
      mobileNumber || '',
      language || 'en'
    );
    
    // Return the response
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating signature request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create signature request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
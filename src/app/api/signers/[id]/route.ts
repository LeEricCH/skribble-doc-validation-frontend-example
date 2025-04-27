import { NextResponse } from 'next/server';
import { ValidationApiClient } from '../../../../lib/ValidationApiClient';
import type { SignerInfo, ApiErrorResponse } from '../../../../types/validation';

// Retrieve credentials from environment variables
const SKRIBBLE_USERNAME = process.env.SKRIBBLE_USERNAME;
const SKRIBBLE_API_KEY = process.env.SKRIBBLE_API_KEY;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Basic check for credentials
  if (!SKRIBBLE_USERNAME || !SKRIBBLE_API_KEY) {
    console.error('Missing Skribble API credentials in environment variables.');
    return NextResponse.json(
      { message: 'Server configuration error: Missing API credentials.' }, 
      { status: 500 }
    );
  }

  // Validate the ID parameter
  const validationId = params.id;
  if (!validationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validationId)) {
    return NextResponse.json(
      { message: 'Invalid validation ID format.' }, 
      { status: 400 }
    );
  }

  try {
    // Instantiate the API client
    const apiClient = new ValidationApiClient(SKRIBBLE_USERNAME, SKRIBBLE_API_KEY);

    // Fetch signer information
    console.log(`API Route: Fetching signer information for validation ID: ${validationId}`);
    const signerInfo: SignerInfo[] = await apiClient.getSignerInfo(validationId);

    console.log(`API Route: Successfully retrieved signer information for validation ID: ${validationId}`);
    return NextResponse.json(signerInfo, { status: 200 });

  } catch (error: unknown) {
    console.error(`API Route: Error fetching signer information for ID ${validationId}:`, error);

    // Check if it's a structured API error from our client
    if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
      const apiError = error as ApiErrorResponse;
      return NextResponse.json(
        { 
          message: `Signer info API error: ${apiError.message}`,
          details: apiError.error 
        }, 
        { status: apiError.status || 500 }
      );
    } 
    
    // Handle generic errors
    return NextResponse.json(
      { message: 'An unexpected error occurred while fetching signer information.' }, 
      { status: 500 }
    );
  }
} 
import { ValidationApiClient } from '@/lib/ValidationApiClient';
import { NextResponse } from 'next/server';
import type { SignerInfo } from '@/types/validation';
import validationHistory from '@/utils/validationHistory';

// Load environment variables
const SKRIBBLE_USERNAME = process.env.SKRIBBLE_USERNAME || '';
const SKRIBBLE_API_KEY = process.env.SKRIBBLE_API_KEY || '';
const API_URL = process.env.VALIDATION_API_URL || 'https://document-validation.skribble.cloud/v1';

// Initialize API client
const apiClient = new ValidationApiClient(SKRIBBLE_USERNAME, SKRIBBLE_API_KEY, API_URL);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const validationId = params.id;
    
    if (!validationId) {
      return NextResponse.json(
        { error: 'Validation ID is required' },
        { status: 400 }
      );
    }
    
    console.log('API: Fetching validation for ID:', validationId);
    
    // Look up the validation in history first
    const historyItems = validationHistory.getHistory();
    const historyItem = historyItems.find(item => item.id === validationId);
    
    if (historyItem) {
      console.log('API: Found history item:', historyItem);
    }
    
    // Fetch validation data by ID
    console.log('API: Fetching validation data from validation API');
    const validationData = await apiClient.getValidationData(validationId);
    console.log('API: Received validation data:', JSON.stringify(validationData, null, 2));
    
    // Fetch signer info for the same validation
    let signers: SignerInfo[] = [];
    try {
      console.log('API: Fetching signer info');
      signers = await apiClient.getSignerInfo(validationId);
      console.log('API: Got signers:', signers.length);
    } catch (signerError) {
      console.error('API: Error fetching signer info:', signerError);
      // Continue without signer data if it fails
    }
    
    // Combine data from validation API with history data
    const enrichedData = {
      ...validationData,
      signers,
      // Add history data if available
      filename: historyItem?.filename || validationData.filename || undefined,
      // Make sure there's a valid flag, trying different sources
      valid: validationData.valid || 
             (validationData.indication === "TOTAL-PASSED") || 
             (validationData.validSignatures === validationData.signatures && validationData.signatures > 0) ||
             historyItem?.valid || false,
      // Include requirements not met status from history
      requirementsNotMet: historyItem?.requirementsNotMet
    };
    
    console.log('API: Returning enriched validation data');
    
    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error('Error fetching validation by ID:', error);
    
    // Handle API error responses
    if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { status: number }).status }
      );
    }
    
    // Handle unexpected errors
    return NextResponse.json(
      { error: 'Failed to fetch validation data' },
      { status: 500 }
    );
  }
} 
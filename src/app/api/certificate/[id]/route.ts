import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ValidationApiClient } from '@/lib/ValidationApiClient';
import type { ApiErrorResponse, SignerInfo } from '@/types/validation';
import type { ValidationResponseWithSettings, CertificateData } from '@/types/certificate';

// Retrieve credentials from environment variables
const SKRIBBLE_USERNAME = process.env.SKRIBBLE_USERNAME;
const SKRIBBLE_API_KEY = process.env.SKRIBBLE_API_KEY;

// Type for skribble subIndication
interface SkribbleValidationResponse extends ValidationResponseWithSettings {
  subIndication?: string;
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  
  // Get filename from query parameters if provided
  const filename = searchParams.get('filename') || '';
  
  // Basic check for credentials
  if (!SKRIBBLE_USERNAME || !SKRIBBLE_API_KEY) {
    console.error('Missing Skribble API credentials in environment variables.');
    return NextResponse.json(
      { message: 'Server configuration error: Missing API credentials.' }, 
      { status: 500 }
    );
  }

  // Validate the ID parameter
  const validationId = context.params.id;
  if (!validationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validationId)) {
    return NextResponse.json(
      { message: 'Invalid validation ID format.' }, 
      { status: 400 }
    );
  }

  try {
    // Instantiate the API client
    const apiClient = new ValidationApiClient(SKRIBBLE_USERNAME, SKRIBBLE_API_KEY);

    // Fetch validation data
    console.log(`API Route: Fetching validation data for certificate with ID: ${validationId}`);
    const validationData = await apiClient.getValidationData(validationId);
    console.log('API Route: Received validation data:', JSON.stringify(validationData, null, 2));
    
    // Fetch signer information if available
    let signerInfo: SignerInfo[] = [];
    try {
      signerInfo = await apiClient.getSignerInfo(validationId);
      console.log(`API Route: Successfully retrieved signer information for certificate: ${validationId}`);
    } catch (signerError) {
      console.log(`API Route: Could not retrieve signer information for certificate: ${validationId}`, signerError);
      // Continue without signer info
    }

    // Determine validation status based on the indication field or signers
    const isValid = validationData.indication === "TOTAL-PASSED" || 
                    validationData.valid === true;
    
    // Count signatures from signers array if available
    const signatureCount = signerInfo.length;
    const validSignatureCount = signerInfo.filter(signer => signer.valid).length;

    // Cast validation data to include settings
    const validationWithSettings = validationData as ValidationResponseWithSettings;
    
    console.log('Validation indication:', validationData.indication);
    const skribbleResponse = validationData as SkribbleValidationResponse;
    console.log('Validation subIndication:', skribbleResponse.subIndication);
    console.log('Valid signatures:', validSignatureCount, 'Total signatures:', signatureCount);

    // In Skribble API, INTERMEDIATE with CUSTOM subIndication often means 
    // the document is cryptographically valid but doesn't meet requirements
    const isFailingDueToRequirements = 
      validationData.indication === "INTERMEDIATE" &&
      skribbleResponse.subIndication === "CUSTOM" &&
      validSignatureCount === signatureCount && 
      signatureCount > 0;

    // Get actual filename from the validation data or query parameters
    const documentFilename = validationData.filename || filename || 'Document';
    
    // Generate a JSON representation of the certificate data
    const certificateData: CertificateData = {
      id: validationId,
      timestamp: new Date().toISOString(),
      validation: {
        ...validationData,
        // Set correct validation state based on API response
        id: validationData.id || validationId,
        valid: isValid,
        requirementsNotMet: isFailingDueToRequirements,
        signatures: validationData.signatures || signatureCount,
        validSignatures: validationData.validSignatures || validSignatureCount,
        quality: validationData.quality,
        legislation: validationData.legislation,
        longTermValidation: validationData.longTermValidation,
        visualDifferences: validationData.visualDifferences,
        undefinedChanges: validationData.undefinedChanges,
        timestamp: validationData.timestamp || new Date().toISOString(),
        filename: documentFilename,
        settings: validationWithSettings.settings
      },
      signers: signerInfo
    };
    
    console.log('API Route: Sending certificate data:', JSON.stringify(certificateData, null, 2));
    
    // Return the certificate data as JSON which will be rendered on the client
    return NextResponse.json(certificateData, { status: 200 });

  } catch (error: unknown) {
    console.error(`API Route: Error generating certificate for ID ${validationId}:`, error);

    // Check if it's a structured API error from our client
    if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
      const apiError = error as ApiErrorResponse;
      return NextResponse.json(
        { 
          message: `Certificate generation error: ${apiError.message}`,
          details: apiError.error 
        }, 
        { status: apiError.status || 500 }
      );
    } 
    
    // Handle generic errors
    return NextResponse.json(
      { message: 'An unexpected error occurred while generating the certificate.' }, 
      { status: 500 }
    );
  }
} 
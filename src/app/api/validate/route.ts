import { NextResponse } from 'next/server';
import { ValidationApiClient } from '../../../lib/ValidationApiClient';
import type { ApiErrorResponse, ValidationOptions } from '../../../types/validation';
import type { ValidationResponseWithSettings } from '@/types/certificate';

// Retrieve credentials from environment variables
const SKRIBBLE_USERNAME = process.env.SKRIBBLE_USERNAME;
const SKRIBBLE_API_KEY = process.env.SKRIBBLE_API_KEY;

export async function POST(request: Request) {
  // Basic check for credentials
  if (!SKRIBBLE_USERNAME || !SKRIBBLE_API_KEY) {
    console.error('Missing Skribble API credentials in environment variables.');
    return NextResponse.json(
      { message: 'Server configuration error: Missing API credentials.' }, 
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    // Get validation settings from the request if provided
    let validationSettings: ValidationOptions | undefined;
    const settingsJson = formData.get('settings') as string | null;
    
    if (settingsJson) {
      try {
        validationSettings = JSON.parse(settingsJson);
        console.log('Using custom validation settings:', validationSettings);
      } catch (e) {
        console.error('Failed to parse validation settings:', e);
      }
    }

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    // Check file size (adjust limit if needed, API limit is 50MB)
    const MAX_FILE_SIZE_MB = 50;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { message: `File size exceeds the limit of ${MAX_FILE_SIZE_MB} MB.` }, 
        { status: 413 } // Payload Too Large
      );
    }

    // Instantiate the API client
    const apiClient = new ValidationApiClient(SKRIBBLE_USERNAME, SKRIBBLE_API_KEY);

    // Call the validation endpoint with settings if available
    console.log(`API Route: Received file ${file.name} for validation.`);
    const validationResult = await apiClient.validateDocument(file, validationSettings || {
      // Default options if no settings provided
      // These will only be used if no settings are passed from the client
    });

    console.log(`API Route: Validation successful for ${file.name}, ID: ${validationResult.id}`);
    
    // Include the validation settings in the response
    const enhancedResponse: ValidationResponseWithSettings = {
      ...validationResult,
      // Include the settings that were used for validation
      settings: validationSettings
    };

    return NextResponse.json(enhancedResponse, { status: 200 });

  } catch (error: unknown) {
    console.error('API Route: Error during validation:', error);

    // Check if it's a structured API error from our client
    if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
      const apiError = error as ApiErrorResponse;
      return NextResponse.json(
        { 
          message: `Validation API error: ${apiError.message}`,
          details: apiError.error 
        }, 
        { status: apiError.status || 500 }
      );
    } 
    
    // Handle generic errors
    return NextResponse.json(
      { message: 'An unexpected error occurred during validation.' }, 
      { status: 500 }
    );
  }
} 
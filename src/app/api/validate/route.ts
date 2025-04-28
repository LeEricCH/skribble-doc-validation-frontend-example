import { NextResponse } from 'next/server';
import { ValidationApiClient, type FileWithMetadata } from '../../../lib/ValidationApiClient';
import type { ApiErrorResponse, ValidationOptions } from '../../../types/validation';

// Retrieve credentials from environment variables
const SKRIBBLE_USERNAME = process.env.SKRIBBLE_USERNAME;
const SKRIBBLE_API_KEY = process.env.SKRIBBLE_API_KEY;

// Simple polyfill check for Node.js environment
// This helps prevent "File is not defined" errors in production
if (typeof File === 'undefined') {
  // We'll use dynamic import for the node buffer module
  // but avoid direct assignment that causes type errors
  import('node:buffer').then(buffer => {
    // @ts-expect-error - Ignoring type mismatch as this is just a basic polyfill
    global.File = buffer.File;
  });
}

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
    
    // Check if this is a batch validation or single file
    const files: FileWithMetadata[] = [];
    
    // Get all files from formData
    for (const entry of formData.entries()) {
      if (entry[0].startsWith('file')) {
        const file = entry[1];
        // Check for file-like properties that match our FileWithMetadata interface
        if (file && 
            typeof file === 'object' && 
            'name' in file && 
            'size' in file && 
            'type' in file && 
            'arrayBuffer' in file &&
            typeof file.arrayBuffer === 'function') {
          files.push(file as FileWithMetadata);
        }
      }
    }
    
    if (files.length === 0) {
      return NextResponse.json({ message: 'No files uploaded.' }, { status: 400 });
    }

    // Get validation settings from the request if provided
    let validationSettings: ValidationOptions | undefined;
    const settingsJson = formData.get('settings') as string | null;

    // Add to the settings to get all info types
    validationSettings = {
      ...validationSettings,
      infos: ["signer", "validation"]
    };
    
    if (settingsJson) {
      try {
        validationSettings = JSON.parse(settingsJson);
        console.log('Using custom validation settings:', validationSettings);
      } catch (e) {
        console.error('Failed to parse validation settings:', e);
      }
    }

    // Check file sizes (adjust limit if needed, API limit is 50MB)
    const MAX_FILE_SIZE_MB = 50;
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          { message: `File ${file.name} exceeds the limit of ${MAX_FILE_SIZE_MB} MB.` }, 
          { status: 413 } // Payload Too Large
        );
      }
    }

    // Instantiate the API client
    const apiClient = new ValidationApiClient(SKRIBBLE_USERNAME, SKRIBBLE_API_KEY);

    const validationResults = await Promise.all(
      files.map(async (file) => {
        try {
          const result = await apiClient.validateDocument(file, validationSettings || {});
          
          // Add filename to result if not present
          if (!result.filename) {
            result.filename = file.name;
          }
          
          const enhancedResult = {
            ...result,
            originalFile: file.name,
            size: file.size,
            error: null
          };
          
          console.log(`Returning validation result with size: ${enhancedResult.size} bytes`);
          return enhancedResult;
        } catch (error) {
          console.error(`Error validating file ${file.name}, size: ${file.size} bytes:`, error);
          // Return structured error for this specific file
          return {
            id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            valid: false,
            originalFile: file.name,
            size: file.size,
            signatures: 0,
            validSignatures: 0,
            error: error instanceof Error ? error.message : 'Unknown error during validation'
          };
        }
      })
    );

    // Create summary of batch validation
    const batchSummary = {
      totalFiles: files.length,
      validFiles: validationResults.filter(result => result.valid).length,
      invalidFiles: validationResults.filter(result => !result.valid).length,
      errorFiles: validationResults.filter(result => result.error).length
    };

    console.log('API Route: Batch validation completed. Summary:', batchSummary);
    
    // Enhanced response with batch information
    const batchResponse = {
      batch: {
        summary: batchSummary,
        settings: validationSettings
      },
      results: validationResults
    };

    return NextResponse.json(batchResponse, { status: 200 });

  } catch (error: unknown) {
    console.error('API Route: Error during batch validation:', error);

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
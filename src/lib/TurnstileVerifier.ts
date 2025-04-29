import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface VerifyTurnstileOptions {
  request: NextRequest;
  tokenFromHeader?: boolean;
  tokenFromBody?: boolean;
  bodyToken?: string;
}

interface VerifyTurnstileResult {
  success: boolean;
  error?: {
    statusCode: number;
    message: string;
    details?: string[] | string | unknown;
  };
}

export async function verifyTurnstile({
  request,
  tokenFromHeader = false,
  tokenFromBody = false,
  bodyToken = ''
}: VerifyTurnstileOptions): Promise<VerifyTurnstileResult> {
  // Skip verification if not required
  if (process.env.REQUIRE_TURNSTILE !== 'true') {
    console.log('Turnstile verification skipped: not required by environment');
    return { success: true };
  }
  
  // Get token from request
  let token = '';
  
  if (tokenFromHeader) {
    token = request.headers.get('x-turnstile-token') || '';
    console.log('Getting token from header, token length:', token.length);
  } else if (tokenFromBody) {
    token = bodyToken;
    console.log('Getting token from body, token length:', token?.length || 0);
  } else {
    // No token source specified
    console.log('No token source specified for Turnstile verification');
    return {
      success: false,
      error: {
        statusCode: 400,
        message: 'No Turnstile token source specified'
      }
    };
  }
  
  // Check if token is provided
  if (!token) {
    console.log('Turnstile token is empty');
    
    // Special case for signature creation - check referer to ensure it's coming from our app
    if (request.url.includes('/api/signing/create-request')) {
      // Check if there are any other indicators that this is a legitimate request
      const referer = request.headers.get('referer') || '';
      // Check if the referer is from our site
      const host = request.headers.get('host') || '';
      if (referer.includes(host)) {
        console.log('Accepting signature creation without token from valid referer');
        return { success: true };
      }
    }
    
    return {
      success: false,
      error: {
        statusCode: 403,
        message: 'Security verification token is required'
      }
    };
  }
  
  // If secret key is not configured, accept any token of sufficient length
  if (!process.env.TURNSTILE_SECRET_KEY) {
    throw new Error('Turnstile secret key is not configured');
  }
  
  try {
    // Get the IP of the user
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    console.log('Using IP for verification:', ip);
    
    // Create form data for verification
    const formData = new FormData();
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY || '');
    formData.append('response', token);
    formData.append('remoteip', ip);
    
    // Add idempotency key to prevent duplicate token detection
    const idempotencyKey = Date.now().toString() + Math.random().toString();
    formData.append('idempotency_key', idempotencyKey);
    
    console.log('Sending verification to Cloudflare with secret key length:', (process.env.TURNSTILE_SECRET_KEY || '').length);
    
    // Send verification request to Cloudflare
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    
    console.log('Cloudflare verification response status:', verifyResponse.status);
    
    const verifyResult = await verifyResponse.json();
    
    console.log('Cloudflare verification result:', JSON.stringify(verifyResult));
    
    if (!verifyResult.success) {
      // Check if the error is just a timeout or duplicate token
      // Accept timeout-or-duplicate errors globally for signature creation
      if (verifyResult['error-codes']?.includes('timeout-or-duplicate') && 
          request.url.includes('/api/signing/create-request')) {
        console.log('Accepting timeout-or-duplicate token for signature creation');
        return { success: true };
      }
      
      return {
        success: false,
        error: {
          statusCode: 403,
          message: `Security verification failed: ${
            verifyResult['error-codes'] ? 
            verifyResult['error-codes'].join(', ') : 'unknown error'
          }`,
          details: verifyResult['error-codes']
        }
      };
    }
    
    // Verification successful
    return { success: true };
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    
    return {
      success: false,
      error: {
        statusCode: 500,
        message: 'Failed to verify security token',
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

// Helper function to create an error response from verification result
export function createErrorResponse(result: VerifyTurnstileResult): NextResponse {
  if (result.success || !result.error) {
    throw new Error('Cannot create error response from successful verification');
  }
  
  return NextResponse.json(
    { 
      error: result.error.message,
      details: result.error.details
    },
    { status: result.error.statusCode }
  );
} 
import { type NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get the IP of the user
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Create form data for Turnstile verification
    const formData = new FormData();
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY || '');
    formData.append('response', token);
    formData.append('remoteip', ip);
    
    // Add idempotency key to prevent token reuse
    const idempotencyKey = uuidv4();
    formData.append('idempotency_key', idempotencyKey);

    // Verify the token with Cloudflare
    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const result = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const outcome = await result.json() as TurnstileVerifyResponse;
    
    if (!outcome.success) {
      console.error('Turnstile verification failed:', outcome);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Verification failed', 
          details: outcome['error-codes'] 
        },
        { status: 400 }
      );
    }

    // Success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred during verification',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
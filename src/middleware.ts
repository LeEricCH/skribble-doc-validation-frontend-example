import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip onboarding check for API routes and onboarding page itself
  if (
    request.nextUrl.pathname.startsWith('/api') || 
    request.nextUrl.pathname.startsWith('/onboarding') ||
    request.nextUrl.pathname.includes('_next') ||
    request.nextUrl.pathname.includes('favicon.ico') ||
    request.nextUrl.pathname.includes('silent-check-sso.html')
  ) {
    return NextResponse.next();
  }

  // Check if e-signing demo is enabled
  const enableEsigningDemo = process.env.NEXT_PUBLIC_ENABLE_ESIGNING_DEMO === 'true';
  
  // If e-signing demo is disabled, skip onboarding check
  if (!enableEsigningDemo) {
    return NextResponse.next();
  }

  // Check if onboarding has been completed
  const onboardingCompleted = request.cookies.get('onboardingCompleted')?.value === 'true';
  
  // If onboarding is not completed, redirect to onboarding page
  if (!onboardingCompleted) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  return NextResponse.next();
}

// Specify which paths this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (internal Next.js paths)
     * 3. /onboarding (to avoid redirect loops)
     * 4. static files (images, etc.)
     */
    '/((?!api|_next|onboarding|images|favicon.ico).*)',
  ],
}; 
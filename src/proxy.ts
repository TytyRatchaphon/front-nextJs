import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const { pathname, search } = request.nextUrl;
    
    // Ignore static files, images, and API routes
    if (
        !pathname.startsWith('/_next') &&
        !pathname.startsWith('/api') &&
        !pathname.match(/\.(.*)$/)
    ) {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown IP';
        const method = request.method;
        const url = search ? `${pathname}?<redacted>` : pathname;
        const userAgent = request.headers.get('user-agent') || 'No Agent';

        // Log format: [TIMESTAMP] [METHOD] [URL] - [IP] - [UserAgent]
        console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`);
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/:path*',
};

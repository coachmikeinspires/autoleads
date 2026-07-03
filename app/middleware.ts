import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware scaffold for white-label subdomain routing. It reads the host and
// can map custom subdomains to org IDs or set a header for downstream handlers.

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  // Example: org.example.com -> org slug
  const parts = host.split('.');
  const subdomain = parts.length > 2 ? parts[0] : null;
  const res = NextResponse.next();
  if (subdomain) {
    res.headers.set('x-org-subdomain', subdomain);
  }
  return res;
}

export const config = { matcher: '/((?!_next/static|_next/image|favicon.ico).*)' };

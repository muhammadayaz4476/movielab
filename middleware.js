import { NextResponse } from 'next/server';

export function middleware(request) {
  // The URL to redirect to
  const smartlink = 'https://doubtfulimpatient.com/mr2ybtg778?key=9226cef44dcb9cc9cb86abcf1b81715f';

  // Redirect all traffic to the smartlink
  return NextResponse.redirect(smartlink);
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

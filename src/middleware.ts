import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCookieDomain } from './lib/utils/auth';

const PUBLIC_ROUTES = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
  '/auth/cookie'
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const cookieDomain = getCookieDomain();

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('Current path:', req.nextUrl.pathname);
  console.log('Session exists:', !!session);

  // Allow access to public routes
  if (PUBLIC_ROUTES.includes(req.nextUrl.pathname)) {
    console.log('Allowing public route access');
    return res;
  }

  // Check if user is authenticated
  if (!session) {
    console.log('No session, redirecting to signin');
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const role = userData?.role;
  
  console.log('User role:', role);
  console.log('User ID:', session.user.id);

  // Check role-based access
  const path = req.nextUrl.pathname;
  if (path.startsWith('/participant') && role !== 'participant') {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
  if (path.startsWith('/organizer') && role !== 'organizer') {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if it exists
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Debug logging
  console.log('Current path:', req.nextUrl.pathname);
  console.log('Session exists:', !!session);
  if (sessionError) console.error('Session error:', sessionError);

  // Allow all public routes
  if (req.nextUrl.pathname === '/' || 
      req.nextUrl.pathname === '/auth/callback' || 
      req.nextUrl.pathname === '/auth/signin' ||
      req.nextUrl.pathname === '/auth/cookie') {
    console.log('Allowing public route access');
    return res;
  }

  // Redirect to sign in if no session
  if (!session) {
    console.log('No session, redirecting to signin');
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  // Get user role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  console.log('User role:', userData?.role);
  console.log('User ID:', session.user.id);
  if (userError) console.error('User data error:', userError);

  // If user has no role yet, redirect to home
  if (!userData?.role) {
    console.log('No role set, redirecting to home');
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Basic role-based access control
  const role = userData.role;
  const isOrganizerRoute = req.nextUrl.pathname.startsWith('/organizer/');
  const isParticipantRoute = req.nextUrl.pathname.startsWith('/participant/');

  if (isOrganizerRoute && role !== 'organizer') {
    console.log('Non-organizer attempting to access organizer route');
    return NextResponse.redirect(new URL('/participant/dashboard', req.url));
  }

  if (isParticipantRoute && role !== 'participant') {
    console.log('Non-participant attempting to access participant route');
    return NextResponse.redirect(new URL('/organizer/dashboard', req.url));
  }

  // Add session to response
  return res;
}

export const config = {
  matcher: [
    '/',
    '/auth/:path*',
    '/organizer/:path*',
    '/participant/:path*'
  ],
}; 
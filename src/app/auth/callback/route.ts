import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const role = requestUrl.searchParams.get('role') || 'participant';

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);

    // Get the user
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Check if user exists in our users table
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!existingUser && !userError) {
        // Create new user record
        await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              email: user.email,
              role: role
            }
          ]);
      }
    }
  }

  // URL to redirect to after sign in process completes
  const redirectTo = role === 'organizer' ? '/organizer/dashboard' : '/participant/dashboard';
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
} 
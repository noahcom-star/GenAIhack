'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getAuthRedirectUrl } from '@/lib/utils/auth';
import SignInWithGoogle from '@/components/SignInWithGoogle';

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') as 'organizer' | 'participant';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const supabase = getSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting to sign in with:', email);
      
      // Sign in with Supabase Auth
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Auth error:', signInError);
        throw signInError;
      }

      if (!user) {
        console.error('No user returned from sign in');
        throw new Error('No user returned from sign in');
      }

      console.log('User authenticated:', user.id);

      // Check if user exists in our users table
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Fetch user result:', { existingUser, userError });

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user:', userError);
        throw userError;
      }

      if (existingUser) {
        console.log('Existing user found:', existingUser);
        
        // Update role if needed
        if (role && existingUser.role !== role) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ role })
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating user role:', updateError);
            throw updateError;
          }
          console.log('Updated user role to:', role);
        }

        router.push(role === 'organizer' ? '/organizer/dashboard' : '/participant/dashboard');
      } else {
        console.log('Creating new user with role:', role || 'participant');
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .upsert([
            { 
              id: user.id,
              email: user.email || '',
              role: role || 'participant'
            }
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user:', insertError);
          throw insertError;
        }

        console.log('New user created:', newUser);
        router.push(role === 'organizer' ? '/organizer/dashboard' : '/participant/onboarding');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (err.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before signing in');
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred during sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?role=${role}`,
          data: {
            role // Include role in user metadata
          }
        },
      });

      if (signUpError) throw signUpError;

      if (data?.user?.identities?.length === 0) {
        setError('This email is already registered. Please sign in instead.');
      } else if (data.user) {
        // Create user record with role
        const { error: insertError } = await supabase
          .from('users')
          .insert([{ 
            id: data.user.id, 
            role, 
            email: data.user.email 
          }]);

        if (insertError && !insertError.message.includes('duplicate key')) {
          console.error('Error creating user:', insertError);
          throw insertError;
        }
        setError('Please check your email to confirm your account.');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Or
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <SignInWithGoogle />
          </div>
        </div>
      </div>
    </div>
  );
} 
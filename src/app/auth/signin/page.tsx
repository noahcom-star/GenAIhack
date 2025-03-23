'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') as 'organizer' | 'participant';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting to sign in with:', email);
      
      // Sign in with Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Auth error:', signInError);
        throw signInError;
      }

      if (!authData.user) {
        console.error('No user returned from sign in');
        throw new Error('No user returned from sign in');
      }

      console.log('User authenticated:', authData.user.id);

      // Check if user exists in our users table
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
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
            .eq('id', authData.user.id);

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
              id: authData.user.id,
              email: authData.user.email || '',
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold text-center mb-2">
            {role === 'organizer' ? 'Organize Hackathons' : 'Join Hackathons'}
          </h1>
          <p className="text-center text-gray-600 mb-8">
            {role === 'organizer' 
              ? 'Sign in to create and manage your hackathons'
              : 'Sign in to find teammates and join events'
            }
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 py-3 px-4 rounded-md text-white font-medium transition-colors ${
                  isLoading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={handleSignUp}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-md border border-blue-600 text-blue-600 font-medium hover:bg-blue-50 transition-colors"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
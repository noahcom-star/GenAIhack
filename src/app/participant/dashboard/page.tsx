'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ParticipantDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/signin');
          return;
        }

        setUserId(user.id);
        setEmail(user.email || null);

        // Check if user has a profile
        const { data: profileData, error: profileError } = await supabase
          .from('participant_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // For debugging only - don't redirect to onboarding yet
        if (profileData) {
          console.log('User has a profile:', profileData);
        } else {
          console.log('No profile found, but staying on dashboard for now');
        }

      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Profile Summary */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Participant Profile
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your personal details and preferences.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {email}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {userId}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Actions</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <Link href="/participant/onboarding" className="text-blue-600 hover:text-blue-800">
                    Complete your profile
                  </Link>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Upcoming Hackathons Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Hackathons</h3>
              <div className="mt-4">
                <p className="text-gray-500">No upcoming hackathons found.</p>
                <div className="mt-4">
                  <Link href="/participant/join" className="text-blue-600 hover:text-blue-800">
                    Join a hackathon
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Potential Matches Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Recommended Connections</h3>
              <div className="mt-4">
                <p className="text-gray-500">No potential matches found.</p>
                <p className="mt-2 text-sm text-gray-500">
                  Complete your profile to find matching team members.
                </p>
              </div>
            </div>
          </div>

          {/* Past Hackathons Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Past Hackathons</h3>
              <div className="mt-4">
                <p className="text-gray-500">No past hackathons found.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
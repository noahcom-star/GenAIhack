'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

interface Team {
  id: string;
  name: string;
}

interface HackathonEvent {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed';
  team: Team | null;
}

interface HackathonResponse {
  hackathon: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: 'active' | 'completed';
  };
  team: Team | null;
}

interface PotentialMatch {
  id: string;
  name: string;
  skills: string[];
  interests: string[];
  matchScore: number;
}

interface ParticipantProfile {
  id: string;
  name: string;
  email: string;
  skills: string[];
  interests: string[];
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
}

export default function ParticipantDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [upcomingHackathons, setUpcomingHackathons] = useState<HackathonEvent[]>([]);
  const [pastHackathons, setPastHackathons] = useState<HackathonEvent[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/signin');
          return;
        }

        // Fetch participant profile
        const { data: profileData, error: profileError } = await supabase
          .from('participant_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        // If profile doesn't exist or onboarding not completed, redirect to onboarding
        if (!profileData || !profileData.onboarding_completed) {
          router.push('/participant/onboarding');
          return;
        }

        setProfile(profileData);

        // Fetch upcoming hackathons
        const { data: upcomingData, error: upcomingError } = await supabase
          .from('hackathon_participants')
          .select(`
            hackathon:hackathons (
              id,
              name,
              start_date,
              end_date,
              status
            ),
            team:teams (
              id,
              name
            )
          `)
          .eq('user_id', user.id)
          .eq('hackathons.status', 'active')
          .order('hackathons.start_date', { ascending: true });

        if (upcomingError) throw upcomingError;
        
        const upcomingHackathonsData = (upcomingData as unknown as HackathonResponse[])?.map(d => ({
          id: d.hackathon.id,
          name: d.hackathon.name,
          start_date: d.hackathon.start_date,
          end_date: d.hackathon.end_date,
          status: d.hackathon.status,
          team: d.team
        } as HackathonEvent)) || [];

        setUpcomingHackathons(upcomingHackathonsData);

        // Fetch past hackathons
        const { data: pastData, error: pastError } = await supabase
          .from('hackathon_participants')
          .select(`
            hackathon:hackathons (
              id,
              name,
              start_date,
              end_date,
              status
            ),
            team:teams (
              id,
              name
            )
          `)
          .eq('user_id', user.id)
          .eq('hackathons.status', 'completed')
          .order('hackathons.end_date', { ascending: false });

        if (pastError) throw pastError;
        
        const pastHackathonsData = (pastData as unknown as HackathonResponse[])?.map(d => ({
          id: d.hackathon.id,
          name: d.hackathon.name,
          start_date: d.hackathon.start_date,
          end_date: d.hackathon.end_date,
          status: d.hackathon.status,
          team: d.team
        } as HackathonEvent)) || [];

        setPastHackathons(pastHackathonsData);

        // Fetch potential matches based on skills and interests
        if (profileData) {
          const { data: matchesData, error: matchesError } = await supabase
            .from('participant_profiles')
            .select(`
              user_id,
              linkedin_url,
              github_url,
              portfolio_url,
              skills,
              interests,
              experience_level,
              users!inner (email)
            `)
            .neq('user_id', user.id)
            .limit(10);

          if (matchesError) throw matchesError;

          // Calculate match scores based on common skills and interests
          const matches = matchesData.map((match: any) => {
            const userSkills = profileData.skills.split(',').map((s: string) => s.trim().toLowerCase());
            const matchSkills = match.skills.split(',').map((s: string) => s.trim().toLowerCase());
            const commonSkills = userSkills.filter((skill: string) => matchSkills.includes(skill));

            const userInterests = profileData.interests.toLowerCase().split(' ');
            const matchInterests = match.interests.toLowerCase().split(' ');
            const commonInterests = userInterests.filter((interest: string) => 
              matchInterests.some((mi: string) => mi.includes(interest) || interest.includes(mi))
            );

            const matchScore = (
              (commonSkills.length / Math.max(userSkills.length, matchSkills.length)) * 0.6 +
              (commonInterests.length / Math.max(userInterests.length, matchInterests.length)) * 0.4
            ) * 100;

            return {
              id: match.user_id,
              name: match.users.email,
              skills: commonSkills,
              interests: commonInterests,
              matchScore: Math.round(matchScore)
            };
          });

          // Sort by match score
          matches.sort((a, b) => b.matchScore - a.matchScore);
          setPotentialMatches(matches);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
            {profile && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/participant/profile')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Upcoming Hackathons */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
              {profile && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">About</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.name} • {profile.email}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Skills</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {profile.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Interests</h3>
                    <p className="mt-1 text-sm text-gray-900">{profile.interests.join(', ')}</p>
                  </div>
                  <div className="space-y-2">
                    {profile.github_url && (
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                        </svg>
                        GitHub Profile
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn Profile
                      </a>
                    )}
                    {profile.portfolio_url && (
                      <a
                        href={profile.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Portfolio Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Upcoming Hackathons */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Upcoming Hackathons</h2>
              <div className="space-y-4">
                {upcomingHackathons.length === 0 ? (
                  <p className="text-gray-500">No upcoming hackathons</p>
                ) : (
                  upcomingHackathons.map((hackathon) => (
                    <div key={hackathon.id} className="border rounded-lg p-4">
                      <h3 className="font-medium">{hackathon.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}
                      </p>
                      {hackathon.team && (
                        <p className="text-sm text-blue-600 mt-2">
                          Team: {hackathon.team.name}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Potential Matches & Past Hackathons */}
          <div className="lg:col-span-2 space-y-6">
            {/* Potential Matches */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recommended Connections</h2>
              <div className="space-y-6">
                {potentialMatches.length === 0 ? (
                  <p className="text-gray-500">No potential matches found</p>
                ) : (
                  potentialMatches.map((match) => (
                    <div
                      key={match.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{match.name}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {match.matchScore}% Match
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {match.skills.length} Common Skills
                          </p>
                          {match.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {match.skills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {/* Implement connect logic */}}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Connect
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Past Hackathons */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Past Hackathons</h2>
              <div className="space-y-4">
                {pastHackathons.length === 0 ? (
                  <p className="text-gray-500">No past hackathons</p>
                ) : (
                  pastHackathons.map((hackathon) => (
                    <div key={hackathon.id} className="border rounded-lg p-4">
                      <h3 className="font-medium">{hackathon.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}
                      </p>
                      {hackathon.team && (
                        <p className="text-sm text-blue-600 mt-2">
                          Team: {hackathon.team.name}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();

  const handleChoice = async (role: 'organizer' | 'participant') => {
    // Store the selected role in the URL when redirecting to sign in
    router.push(`/auth/signin?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold text-center mb-4">Welcome to HackBuddy</h1>
        <p className="text-xl text-gray-600 text-center mb-12">
          Choose how you&apos;d like to get started
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center mb-16">
          <button
            onClick={() => handleChoice('organizer')}
            className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 text-center flex-1 max-w-md border-2 border-transparent hover:border-blue-600"
          >
            <h2 className="text-2xl font-semibold mb-2 text-blue-600">Organize a Hackathon</h2>
            <p className="text-gray-600 mb-4">
              Create and manage hackathon events, review participants, and more.
            </p>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Get Started →
            </div>
          </button>

          <button
            onClick={() => handleChoice('participant')}
            className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 text-center flex-1 max-w-md border-2 border-transparent hover:border-purple-600"
          >
            <h2 className="text-2xl font-semibold mb-2 text-purple-600">Join a Hackathon</h2>
            <p className="text-gray-600 mb-4">
              Find the perfect teammates, showcase your skills, and participate in exciting events.
            </p>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Get Started →
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <h3 className="font-medium mb-2">Smart Matching</h3>
            <p className="text-gray-600">
              Simply talk to our AI assistant about your skills and interests.
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-medium mb-2">Perfect Teams</h3>
            <p className="text-gray-600">
              Get matched with teammates who complement your skills and share your interests.
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-medium mb-2">Seamless Experience</h3>
            <p className="text-gray-600">
              Making team formation accessible and effective for everyone.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

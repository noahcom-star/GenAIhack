'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import VoiceRegistration from '@/app/components/VoiceRegistration';

export default function JoinHackathon() {
  const router = useRouter();
  const [hackathonId, setHackathonId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleComplete = () => {
    router.push(`/participant/dashboard`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Join a Hackathon
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hackathon Code
          </label>
          <input
            type="text"
            value={hackathonId}
            onChange={(e) => setHackathonId(e.target.value)}
            placeholder="Enter the code provided by your organizer"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {hackathonId && (
          <VoiceRegistration
            hackathonId={hackathonId}
            onComplete={handleComplete}
          />
        )}

        <p className="mt-4 text-sm text-gray-600 text-center">
          Don&apos;t have a code? Ask your hackathon organizer for one.
        </p>

        <p className="mt-4 text-sm text-gray-600 text-center">
          We&apos;re excited to have you join us!
        </p>
      </div>
    </div>
  );
} 
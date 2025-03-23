'use client';

import { useState, useEffect } from 'react';
import { startVapiCall } from '@/lib/vapi/utils';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';

export default function VoiceRegistration({
  hackathonId,
  onComplete,
}: {
  hackathonId: string;
  onComplete: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const { user } = useAuth();

  const startRegistration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('You must be logged in to use voice registration');
      }
      
      // Start the Vapi call with user and hackathon IDs
      const newCallId = await startVapiCall({
        userId: user.id,
        hackathonId
      });
      
      setCallId(newCallId);
      console.log('Call started with ID:', newCallId);
      
    } catch (err) {
      console.error('Voice registration error:', err);
      if (err instanceof Error && err.message.includes('VAPI API key is not configured')) {
        setError('Voice registration is currently unavailable. Please try again later or contact support.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to start registration');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Voice Registration</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {!callId ? (
        <button
          onClick={startRegistration}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-md text-white font-medium ${
            isLoading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Starting Call...' : 'Start Voice Registration'}
        </button>
      ) : (
        <div className="text-center">
          <p className="text-lg mb-2">Call in progress!</p>
          <p className="text-sm text-gray-600">Call ID: {callId}</p>
        </div>
      )}
      
      <p className="mt-4 text-sm text-gray-600">
        {callId ? 'Call in progress!' : 'Click the button above to start a voice call with our AI assistant. They&apos;ll ask you about your skills, interests, and what you&apos;d like to build.'}
      </p>
    </div>
  );
} 
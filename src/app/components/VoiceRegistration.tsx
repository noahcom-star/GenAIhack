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
      
      console.log('Starting voice registration with user ID:', user.id, 'and hackathon ID:', hackathonId);
      
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
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-4">Voice Registration</h2>
      <p className="text-gray-600 mb-4">
        Tell us about yourself! Our AI assistant will call you to learn about your skills and interests 
        to help match you with the perfect hackathon teammates.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      {callId ? (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
          Your call has been initiated! You should receive a call shortly.
          <p className="text-sm mt-2">Call ID: {callId}</p>
        </div>
      ) : (
        <button
          onClick={startRegistration}
          disabled={isLoading}
          className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isLoading ? 'Starting Call...' : 'Start Voice Registration'}
        </button>
      )}
    </div>
  );
} 
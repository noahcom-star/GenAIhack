'use client';

import { useState } from 'react';
import { startVapiCall } from '@/lib/vapi/utils';
import { supabase } from '@/lib/supabase/client';

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

  const startRegistration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Start the Vapi call
      const newCallId = await startVapiCall();
      setCallId(newCallId);
      
      // Here you would typically:
      // 1. Wait for the call to complete
      // 2. Get the transcript
      // 3. Parse the profile data
      // 4. Save to Supabase
      // 5. Call onComplete()
      
      // For now, we'll just show the call ID
      console.log('Call started with ID:', newCallId);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start registration');
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
        Click the button above to start a voice call with our AI assistant. 
        They'll ask you about your skills, interests, and what you'd like to build.
      </p>
    </div>
  );
} 
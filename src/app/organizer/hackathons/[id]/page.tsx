'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface HackathonData {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  join_code: string;
  status: 'draft' | 'active' | 'completed';
  created_at: string;
}

interface WhitelistedParticipant {
  email: string;
}

export default function HackathonDetails() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.id as string;
  const supabase = getSupabaseClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hackathon, setHackathon] = useState<HackathonData | null>(null);
  const [participants, setParticipants] = useState<WhitelistedParticipant[]>([]);
  const [registeredParticipants, setRegisteredParticipants] = useState<number>(0);

  useEffect(() => {
    async function loadHackathonData() {
      try {
        // Fetch hackathon details
        const { data: hackathonData, error: hackathonError } = await supabase
          .from('hackathons')
          .select('*')
          .eq('id', hackathonId)
          .single();

        if (hackathonError) {
          throw new Error('Failed to load hackathon details');
        }

        if (!hackathonData) {
          throw new Error('Hackathon not found');
        }

        setHackathon(hackathonData as unknown as HackathonData);

        // Fetch whitelisted participants
        const { data: whitelist, error: whitelistError } = await supabase
          .from('whitelisted_participants')
          .select('email')
          .eq('hackathon_id', hackathonId);

        if (whitelistError) {
          console.error('Error fetching participant emails:', whitelistError);
        } else {
          setParticipants(whitelist as WhitelistedParticipant[]);
        }

        // Count registered participants
        const { count, error: countError } = await supabase
          .from('hackathon_participants')
          .select('*', { count: 'exact' })
          .eq('hackathon_id', hackathonId);

        if (countError) {
          console.error('Error counting participants:', countError);
        } else {
          setRegisteredParticipants(count || 0);
        }
      } catch (err) {
        console.error('Error loading hackathon:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    if (hackathonId) {
      loadHackathonData();
    }
  }, [hackathonId, supabase]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 text-gray-800';
      case 'active':
        return 'bg-green-200 text-green-800';
      case 'completed':
        return 'bg-blue-200 text-blue-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
          {error || 'Hackathon not found'}
        </div>
        <button
          onClick={() => router.push('/organizer/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{hackathon.name}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeClass(hackathon.status)}`}>
          {hackathon.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-medium mb-2">Date</h3>
          <p>{formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-medium mb-2">Join Code</h3>
          <p className="font-mono bg-gray-100 p-2 rounded">{hackathon.join_code}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-medium mb-2">Participants</h3>
          <p>{registeredParticipants} registered / {participants.length} invited</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Description</h2>
        <p className="whitespace-pre-wrap">{hackathon.description}</p>
      </div>

      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Invited Participants</h2>
        {participants.length > 0 ? (
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No participants invited yet.</p>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => router.push('/organizer/dashboard')}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Back to Dashboard
        </button>
        
        <div className="space-x-4">
          <Link 
            href={`/organizer/hackathons/${hackathonId}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
          >
            Edit Hackathon
          </Link>
        </div>
      </div>
    </div>
  );
} 
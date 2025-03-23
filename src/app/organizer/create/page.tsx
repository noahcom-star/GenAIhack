'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import CSVUpload from '@/app/components/CSVUpload';

export default function CreateHackathon() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdHackathon, setCreatedHackathon] = useState<{
    id: string;
    join_code: string;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    participantEmails: '',
  });

  const [csvEmails, setCsvEmails] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw new Error('Authentication required. Please sign in.');
      if (!user) throw new Error('Please sign in to create a hackathon.');

      // Create the hackathon
      const { data: hackathon, error: hackathonError } = await supabase
        .from('hackathons')
        .insert({
          name: formData.name,
          description: formData.description,
          start_date: formData.startDate,
          end_date: formData.endDate,
          organizer_id: user.id,
          status: 'draft'
        })
        .select('id, join_code')
        .single();

      if (hackathonError) {
        console.error('Hackathon creation error:', hackathonError);
        throw new Error(hackathonError.message);
      }

      // Process manually entered emails
      const manualEmails = formData.participantEmails
        .split('\n')
        .map(email => email.trim())
        .filter(email => email);

      // Combine manual and CSV emails
      const allEmails = Array.from(new Set([...manualEmails, ...csvEmails]));

      // Add whitelisted participants
      if (allEmails.length > 0) {
        const { error: whitelistError } = await supabase
          .from('whitelisted_participants')
          .insert(
            allEmails.map(email => ({
              hackathon_id: hackathon.id,
              email,
            }))
          );

        if (whitelistError) {
          console.error('Whitelist error:', whitelistError);
          throw new Error('Failed to add participant emails');
        }
      }

      setCreatedHackathon(hackathon);
    } catch (err) {
      console.error('Creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create hackathon');
      setCreatedHackathon(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handleEmailsExtracted function
  const handleEmailsExtracted = (emails: string[]) => {
    setCsvEmails(emails);
    // Update the textarea with the CSV emails
    setFormData(prev => ({
      ...prev,
      participantEmails: [...emails, ...prev.participantEmails.split('\n').filter(e => e.trim())]
        .join('\n')
    }));
  };

  if (createdHackathon) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              Hackathon Created Successfully!
            </h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Share this code with participants:</p>
              <p className="text-3xl font-mono font-bold text-blue-600 mb-4">
                {createdHackathon.join_code}
              </p>
              <p className="text-sm text-gray-500">
                Participants can use this code to join your hackathon
              </p>
            </div>
          </div>
          
          <div className="space-x-4">
            <button
              onClick={() => router.push(`/organizer/hackathon/${createdHackathon.id}`)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                setCreatedHackathon(null);
                setFormData({
                  name: '',
                  description: '',
                  startDate: '',
                  endDate: '',
                  participantEmails: '',
                });
                setCsvEmails([]);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Hackathon</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hackathon Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            required
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md h-32"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              required
              value={formData.endDate}
              onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <CSVUpload
          onEmailsExtracted={handleEmailsExtracted}
          className="mb-4"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Participant Emails (one per line)
          </label>
          <textarea
            value={formData.participantEmails}
            onChange={e => setFormData(prev => ({ ...prev, participantEmails: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md h-32"
            placeholder="participant1@example.com&#10;participant2@example.com"
          />
          {csvEmails.length > 0 && (
            <p className="mt-2 text-sm text-green-600">
              {csvEmails.length} email(s) loaded from CSV
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-md text-white font-medium ${
            isLoading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Creating...' : 'Create Hackathon'}
        </button>
      </form>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import CSVUpload from '@/app/components/CSVUpload';

// Define TypeScript interfaces
interface HackathonData {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed';
}

interface WhitelistedParticipant {
  email: string;
}

export default function EditHackathon() {
  const router = useRouter();
  const params = useParams();
  const hackathonId = params.id as string;
  const supabase = getSupabaseClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingEmails, setExistingEmails] = useState<string[]>([]);
  const [csvEmails, setCsvEmails] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    participantEmails: '',
    status: 'draft' as 'draft' | 'active' | 'completed'
  });

  useEffect(() => {
    async function loadHackathon() {
      try {
        // Fetch the hackathon data
        const { data: hackathon, error: hackathonError } = await supabase
          .from('hackathons')
          .select('*')
          .eq('id', hackathonId)
          .single();

        if (hackathonError) {
          throw new Error('Failed to load hackathon details');
        }

        if (!hackathon) {
          throw new Error('Hackathon not found');
        }

        // Cast the data to our interface with a two-step casting for safety
        const typedHackathon = hackathon as unknown as HackathonData;

        // Format dates for form input (YYYY-MM-DD)
        const formatDate = (dateString: string) => {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };

        // Fetch whitelisted participants
        const { data: whitelist, error: whitelistError } = await supabase
          .from('whitelisted_participants')
          .select('email')
          .eq('hackathon_id', hackathonId);

        if (whitelistError) {
          console.error('Error fetching participant emails:', whitelistError);
        }

        const emails = whitelist ? 
          (whitelist as WhitelistedParticipant[]).map(entry => entry.email) 
          : [];
        
        setExistingEmails(emails);

        // Set form data
        setFormData({
          name: typedHackathon.name,
          description: typedHackathon.description,
          startDate: formatDate(typedHackathon.start_date),
          endDate: formatDate(typedHackathon.end_date),
          participantEmails: emails.join('\n'),
          status: typedHackathon.status
        });
      } catch (err) {
        console.error('Error loading hackathon:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    if (hackathonId) {
      loadHackathon();
    }
  }, [hackathonId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Update the hackathon
      const { error: updateError } = await supabase
        .from('hackathons')
        .update({
          name: formData.name,
          description: formData.description,
          start_date: formData.startDate,
          end_date: formData.endDate,
          status: formData.status
        })
        .eq('id', hackathonId);

      if (updateError) {
        throw new Error(`Failed to update hackathon: ${updateError.message}`);
      }

      // Process emails from form
      const currentEmails = formData.participantEmails
        .split('\n')
        .map(email => email.trim())
        .filter(email => email);

      // Combine with CSV emails if any
      const allEmails = Array.from(new Set([...currentEmails, ...csvEmails]));
      
      // New emails to add (not already in existing emails)
      const newEmails = allEmails.filter(email => !existingEmails.includes(email));
      
      // If there are new emails to add
      if (newEmails.length > 0) {
        const { error: whitelistError } = await supabase
          .from('whitelisted_participants')
          .insert(
            newEmails.map(email => ({
              hackathon_id: hackathonId,
              email,
            }))
          );

        if (whitelistError) {
          console.error('Error adding new participants:', whitelistError);
          throw new Error('Failed to add new participant emails');
        }
      }

      // Redirect to the hackathon details page
      router.push(`/organizer/hackathons/${hackathonId}`);
    } catch (err) {
      console.error('Error updating hackathon:', err);
      setError(err instanceof Error ? err.message : 'Failed to update hackathon');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailsExtracted = (emails: string[]) => {
    setCsvEmails(emails);
    
    // Update the textarea with the new emails
    const currentEmails = formData.participantEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email);
      
    const allEmails = Array.from(new Set([...currentEmails, ...emails]));
    
    setFormData(prev => ({
      ...prev,
      participantEmails: allEmails.join('\n')
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Hackathon</h1>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'active' | 'completed' }))}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <CSVUpload
          onEmailsExtracted={handleEmailsExtracted}
          className="mb-4"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Participant Emails (one per line)
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

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => router.push(`/organizer/hackathons/${hackathonId}`)}
            className="py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSaving}
            className={`py-2 px-6 rounded-md text-white font-medium ${
              isSaving
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 
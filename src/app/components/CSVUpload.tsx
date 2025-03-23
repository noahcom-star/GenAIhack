'use client';

import { useState } from 'react';

type CSVUploadProps = {
  onEmailsExtracted: (emails: string[]) => void;
  className?: string;
};

export default function CSVUpload({ onEmailsExtracted, className = '' }: CSVUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      // Extract emails from CSV
      const emails = lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        // Basic email validation
        .filter(line => {
          const email = line.split(',')[0].trim(); // Take first column
          return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        })
        .map(line => line.split(',')[0].trim());

      if (emails.length === 0) {
        setError('No valid emails found in the CSV file');
        return;
      }

      onEmailsExtracted(emails);
      e.target.value = ''; // Reset input
    } catch (err) {
      setError('Error reading CSV file');
      console.error('CSV upload error:', err);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Upload Participant Emails (CSV)
      </label>
      
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-medium
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      
      <p className="mt-1 text-sm text-gray-500">
        Upload a CSV file with one email per line in the first column
      </p>
    </div>
  );
} 
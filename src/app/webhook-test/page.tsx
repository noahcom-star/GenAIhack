'use client';

import { useState } from 'react';

export default function WebhookTestPage() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testWebhook = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const response = await fetch('/api/public-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VAPI-SECRET': 'hackbuddysecret123'
        },
        body: JSON.stringify({
          type: 'call.completed',
          call: {
            id: 'test-call-id',
            transcript: {
              text: 'I have skills in javascript and react, and I am interested in web development',
              confidence: 0.9
            },
            custom_data: {
              userId: '123e4567-e89b-12d3-a456-426614174000',
              hackathonId: '123e4567-e89b-12d3-a456-426614174001'
            }
          }
        })
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Webhook Test Page</h1>
      <p className="mb-4">This page tests your webhook endpoint directly from the browser.</p>
      
      <button
        onClick={testWebhook}
        disabled={isLoading}
        className="bg-blue-600 text-white py-2 px-4 rounded mb-4 hover:bg-blue-700 disabled:bg-blue-400"
      >
        {isLoading ? 'Testing...' : 'Test Webhook'}
      </button>
      
      {result && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
} 
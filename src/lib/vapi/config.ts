import Vapi from '@vapi-ai/web';

// Modified to avoid throwing errors during build time
// The client will be null if the API key is missing
let vapiClient: any = null;

// Only initialize if in browser and the API key exists
if (typeof window !== 'undefined') {
  try {
    // Use environment variable for API key
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (apiKey) {
      vapiClient = new Vapi(apiKey);
    }
  } catch (error) {
    console.error('Failed to initialize Vapi client:', error);
  }
}

export const vapi = vapiClient;

export const VAPI_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_VAPI_API_KEY,
  privateKey: process.env.VAPI_PRIVATE_API_KEY,
  assistantId: '181cf0db-d6c3-40d3-b293-3ff6bca8fa19',
  fromNumber: '+12494920940'
} as const;

export type VapiTranscript = {
  text: string;
  confidence: number;
  words: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
};

export type ParsedProfile = {
  skills: string[];
  interests: string[];
  summary: string;
  name: string;
  email?: string;
}; 
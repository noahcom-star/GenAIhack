import Vapi from '@vapi-ai/web';

if (!process.env.NEXT_PUBLIC_VAPI_API_KEY) {
  throw new Error('NEXT_PUBLIC_VAPI_API_KEY is not set');
}

// Create client with API key
export const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY);

export const VAPI_CONFIG = {
  apiKey: '8676da14-4376-49e1-aabd-3feb3f3d5790',
  assistantId: '181cf0db-d6c3-40d3-b293-3ff6bca8fa19',
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
import { VAPI_CONFIG, type VapiTranscript, type ParsedProfile } from './config';

export async function parseTranscript(transcript: VapiTranscript): Promise<ParsedProfile> {
  try {
    // Check if VAPI API key is available
    if (!VAPI_CONFIG.apiKey) {
      throw new Error('VAPI API key is not configured');
    }

    const prompt = `
      Parse the following transcript into structured data about a hackathon participant.
      Extract their name, skills, interests, and create a brief summary.
      
      Transcript: "${transcript.text}"
      
      Return the data in this exact JSON format:
      {
        "name": "string",
        "skills": ["string"],
        "interests": ["string"],
        "summary": "string",
        "email": "string or null if not found"
      }
    `;

    const response = await fetch('https://api.vapi.ai/functions/analyze', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistant_id: VAPI_CONFIG.assistantId,
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to parse transcript with Vapi');
    }

    const data = await response.json();
    return data as ParsedProfile;
  } catch (error) {
    console.error('Error parsing transcript:', error);
    throw error;
  }
}

export async function startVapiCall(customData: { 
  userId: string; 
  hackathonId: string;
  phoneNumber: string;
}): Promise<string> {
  try {
    // Check if VAPI API key is available
    if (!VAPI_CONFIG.apiKey) {
      throw new Error('VAPI API key is not configured');
    }

    console.log('Starting Vapi call with custom data:', customData);

    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistant_id: VAPI_CONFIG.assistantId,
        caller_number: customData.phoneNumber,
        from_number: '+12494920940', // Our VAPI phone number
        initial_message: "Hi! I'm your HackBuddy assistant. Please tell me about yourself, including your name, skills, and what kind of projects you're interested in building.",
        custom_data: {
          userId: customData.userId,
          hackathonId: customData.hackathonId
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to start Vapi call:', errorText);
      throw new Error(`Failed to start Vapi call: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Vapi call response:', data);
    return data.call_id;
  } catch (error) {
    console.error('Error starting Vapi call:', error);
    throw error;
  }
} 
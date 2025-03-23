import { NextResponse } from "next/server";
import { getServerSupabaseClient } from '@/lib/supabase/client';
import { VAPI_CONFIG } from '@/lib/vapi/config';

// Simple logging helper
const logWebhookInfo = (message: string, data?: any) => {
  console.log('[VAPI WEBHOOK]', message, data ? data : '');
};

export async function POST(req: Request) {
  logWebhookInfo('Webhook received');
  
  try {
    // Verify request is from Vapi
    const authorization = req.headers.get('authorization');
    const vapiSecret = req.headers.get('x-vapi-secret');
    
    logWebhookInfo('Auth headers', { 
      hasAuthorization: !!authorization, 
      hasVapiSecret: !!vapiSecret
    });
    
    // Check authorization header
    if (VAPI_CONFIG.apiKey && (!authorization || authorization !== `Bearer ${VAPI_CONFIG.apiKey}`)) {
      // Only enforce this check if we have an API key configured
      if (process.env.NODE_ENV === 'production') {
        logWebhookInfo('Unauthorized request - invalid Authorization header');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      } else {
        logWebhookInfo('Warning: Authorization header invalid but continuing in development mode');
      }
    }

    // Parse the request body
    const body = await req.json();
    logWebhookInfo('Request body received', { 
      type: body.type,
      callId: body.call?.id,
      hasTranscript: !!body.call?.transcript,
      customData: body.call?.custom_data 
    });

    // Initialize Supabase
    const supabase = getServerSupabaseClient();
    logWebhookInfo('Supabase client initialized');

    // Handle different event types
    if (body.type === 'call.completed') {
      logWebhookInfo('Call completed event received');
      
      // Get transcript if available
      if (body.call?.transcript) {
        const transcript = body.call.transcript;
        logWebhookInfo('Transcript available', { 
          confidence: transcript.confidence,
          textLength: transcript.text?.length || 0
        });
        
        try {
          // Extract user ID from custom data if available
          const userId = body.call.custom_data?.userId;
          const hackathonId = body.call.custom_data?.hackathonId;
          
          logWebhookInfo('User data', { userId, hackathonId, custom_data: body.call.custom_data });

          if (userId) {
            // Store the transcript in Supabase
            logWebhookInfo('Inserting transcript into Supabase');
            const { data: insertData, error: transcriptError } = await supabase
              .from('participant_conversations')
              .insert({
                user_id: userId,
                hackathon_id: hackathonId,
                transcript: transcript.text,
                confidence: transcript.confidence,
                created_at: new Date().toISOString()
              })
              .select();

            if (transcriptError) {
              logWebhookInfo('Error saving transcript', transcriptError);
              return NextResponse.json({ error: 'Failed to save transcript' }, { status: 500 });
            }

            logWebhookInfo('Transcript saved successfully', { insertId: insertData?.[0]?.id });
            return NextResponse.json({ success: true });
          } else {
            logWebhookInfo('No user_id found in custom_data, skipping database update');
            return NextResponse.json({ error: 'Missing user_id in custom_data' }, { status: 400 });
          }
        } catch (error) {
          logWebhookInfo('Error processing transcript', error);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
      } else {
        logWebhookInfo('No transcript available in completed call');
        return NextResponse.json({ error: 'No transcript in call data' }, { status: 400 });
      }
    } else {
      logWebhookInfo('Non-completed call event received', { type: body.type });
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    logWebhookInfo('Error in webhook', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Simple function to extract skills from transcript text
function extractSkills(text: string): string[] {
  const skillKeywords = [
    'javascript', 'typescript', 'react', 'node', 'python', 'java', 'c++', 
    'html', 'css', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql',
    'aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'devops',
    'mobile', 'android', 'ios', 'swift', 'kotlin', 'flutter', 'react native',
    'machine learning', 'ai', 'data science', 'blockchain', 'web3',
    'ui', 'ux', 'design', 'product management', 'agile', 'scrum'
  ];
  
  return skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
}

// Simple function to extract interests from transcript text
function extractInterests(text: string): string[] {
  const interestKeywords = [
    'web development', 'mobile development', 'game development', 'ai', 
    'machine learning', 'data science', 'blockchain', 'web3', 'ar', 'vr',
    'iot', 'robotics', 'cybersecurity', 'cloud computing', 'devops',
    'ui/ux', 'product design', 'fintech', 'healthtech', 'edtech', 'sustainability',
    'social impact', 'open source'
  ];
  
  return interestKeywords.filter(interest => 
    text.toLowerCase().includes(interest.toLowerCase())
  );
} 
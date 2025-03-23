import { NextResponse } from "next/server";
import { getSupabaseClient } from '@/lib/supabase/client';
import { VAPI_CONFIG, ParsedProfile } from '@/lib/vapi/config';

// Helper function to log important information
function logWebhookInfo(message: string, data?: any) {
  console.log(`[VAPI WEBHOOK] ${message}`, data ? JSON.stringify(data) : '');
}

export async function POST(req: Request) {
  logWebhookInfo('Webhook received');
  
  try {
    // Verify request is from Vapi
    const authorization = req.headers.get('authorization');
    logWebhookInfo('Auth header', { received: !!authorization, expected: `Bearer ${VAPI_CONFIG.apiKey.substring(0, 5)}...` });
    
    if (!authorization || authorization !== `Bearer ${VAPI_CONFIG.apiKey}`) {
      logWebhookInfo('Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const supabase = getSupabaseClient();
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
          
          logWebhookInfo('User data', { userId, hackathonId });

          if (userId) {
            // Store the transcript in Supabase
            logWebhookInfo('Inserting transcript into Supabase');
            const { data: insertData, error: transcriptError } = await supabase
              .from('participant_conversations')
              .insert({
                user_id: userId,
                hackathon_id: hackathonId,
                transcript: transcript.text,
                call_id: body.call.id,
                confidence: transcript.confidence
              })
              .select();

            if (transcriptError) {
              logWebhookInfo('Error saving transcript', transcriptError);
            } else {
              logWebhookInfo('Transcript saved successfully', { insertId: insertData?.[0]?.id });
            }

            // Extract skills and interests
            const skills = extractSkills(transcript.text);
            const interests = extractInterests(transcript.text);
            
            logWebhookInfo('Extracted profile data', { skills, interests });
            
            // Update user profile in Supabase
            if (skills.length > 0 || interests.length > 0) {
              logWebhookInfo('Updating participant profile');
              const { error: profileError } = await supabase
                .from('participant_profiles')
                .upsert({
                  user_id: userId,
                  skills: skills,
                  interests: interests,
                  updated_at: new Date().toISOString()
                });

              if (profileError) {
                logWebhookInfo('Error updating profile', profileError);
              } else {
                logWebhookInfo('Profile updated successfully');
              }
            }
          } else {
            logWebhookInfo('No user_id found in custom_data, skipping database updates');
          }
        } catch (error) {
          logWebhookInfo('Error processing transcript', error);
        }
      } else {
        logWebhookInfo('No transcript available in completed call');
      }
    } else {
      logWebhookInfo('Non-completed call event received', { type: body.type });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logWebhookInfo('Error in Vapi webhook', error);
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
import { NextResponse } from "next/server";
import { getSupabaseClient } from '@/lib/supabase/client';
import { VAPI_CONFIG, ParsedProfile } from '@/lib/vapi/config';

export async function POST(req: Request) {
  try {
    // Verify request is from Vapi
    const authorization = req.headers.get('authorization');
    if (!authorization || authorization !== `Bearer ${VAPI_CONFIG.apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await req.json();
    console.log('Vapi webhook received:', JSON.stringify(body));

    // Initialize Supabase
    const supabase = getSupabaseClient();

    // Handle different event types
    if (body.type === 'call.completed') {
      // Get transcript if available
      if (body.call?.transcript) {
        const transcript = body.call.transcript;
        
        try {
          // Get profile data from transcript if it exists
          let profileData: ParsedProfile | null = null;
          
          // Extract user ID from custom data if available
          const userId = body.call.custom_data?.user_id;
          const hackathonId = body.call.custom_data?.hackathon_id;

          if (userId) {
            // Store the transcript in Supabase
            const { error: transcriptError } = await supabase
              .from('participant_conversations')
              .insert({
                user_id: userId,
                hackathon_id: hackathonId,
                transcript: transcript.text,
                call_id: body.call.id,
                confidence: transcript.confidence
              });

            if (transcriptError) {
              console.error('Error saving transcript:', transcriptError);
            }

            // Try to extract profile data from the transcript
            // This would be a good place to use an AI to extract structured data
            // For now, we'll just create a simple parser
            const skills = extractSkills(transcript.text);
            const interests = extractInterests(transcript.text);
            
            // Update user profile in Supabase
            if (skills.length > 0 || interests.length > 0) {
              const { error: profileError } = await supabase
                .from('participant_profiles')
                .upsert({
                  user_id: userId,
                  skills: skills,
                  interests: interests,
                  updated_at: new Date().toISOString()
                });

              if (profileError) {
                console.error('Error updating profile:', profileError);
              }
            }
          } else {
            console.log('No user_id found in custom_data, skipping database updates');
          }
        } catch (error) {
          console.error('Error processing transcript:', error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Vapi webhook:', error);
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
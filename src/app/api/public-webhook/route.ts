import { NextResponse } from "next/server";
import { getSupabaseClient } from '@/lib/supabase/client';

// Set a secret key for validating webhook requests
// This should match what you set in Vapi dashboard
const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET || "hackbuddysecret123";

// Simplified webhook handler that doesn't require authentication
export async function POST(req: Request) {
  console.log('[PUBLIC WEBHOOK] Received webhook request');
  
  try {
    // Check X-VAPI-SECRET header for validation
    const secret = req.headers.get('x-vapi-secret');
    if (!secret || secret !== WEBHOOK_SECRET) {
      console.log('[PUBLIC WEBHOOK] Invalid or missing secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await req.json();
    console.log('[PUBLIC WEBHOOK] Request body:', JSON.stringify(body));

    // Initialize Supabase
    const supabase = getSupabaseClient();
    console.log('[PUBLIC WEBHOOK] Supabase client initialized');

    // Handle different event types
    if (body.type === 'call.completed') {
      console.log('[PUBLIC WEBHOOK] Call completed event received');
      
      // Get transcript if available
      if (body.call?.transcript) {
        const transcript = body.call.transcript;
        console.log('[PUBLIC WEBHOOK] Transcript available', { 
          confidence: transcript.confidence,
          textLength: transcript.text?.length || 0
        });
        
        try {
          // Extract user ID from custom data if available
          const userId = body.call.custom_data?.userId || body.call.custom_data?.user_id;
          const hackathonId = body.call.custom_data?.hackathonId || body.call.custom_data?.hackathon_id;
          
          console.log('[PUBLIC WEBHOOK] User data', { userId, hackathonId, custom_data: body.call.custom_data });

          if (userId) {
            // Store the transcript in Supabase
            console.log('[PUBLIC WEBHOOK] Inserting transcript into Supabase');
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
              console.log('[PUBLIC WEBHOOK] Error saving transcript', transcriptError);
            } else {
              console.log('[PUBLIC WEBHOOK] Transcript saved successfully', { insertId: insertData?.[0]?.id });
            }

            // Extract skills and interests
            const newSkills = extractSkills(transcript.text);
            const newInterests = extractInterests(transcript.text);
            
            console.log('[PUBLIC WEBHOOK] Extracted profile data', { skills: newSkills, interests: newInterests });
            
            // Get existing profile
            const { data: existingProfile } = await supabase
              .from('participant_profiles')
              .select('skills, interests')
              .eq('user_id', userId)
              .single();

            // Merge existing and new skills/interests
            const mergedSkills = Array.from(new Set([
              ...(existingProfile?.skills || []),
              ...newSkills
            ]));
            const mergedInterests = Array.from(new Set([
              ...(existingProfile?.interests || []),
              ...newInterests
            ]));
            
            // Update user profile in Supabase if we have new data
            if (newSkills.length > 0 || newInterests.length > 0) {
              console.log('[PUBLIC WEBHOOK] Updating participant profile', {
                mergedSkills,
                mergedInterests
              });
              
              const { error: profileError } = await supabase
                .from('participant_profiles')
                .update({
                  skills: mergedSkills,
                  interests: mergedInterests,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

              if (profileError) {
                // If update fails (no existing record), try insert
                if (profileError.code === 'PGRST116') {
                  const { error: insertError } = await supabase
                    .from('participant_profiles')
                    .insert({
                      user_id: userId,
                      skills: mergedSkills,
                      interests: mergedInterests,
                      updated_at: new Date().toISOString()
                    });
                  
                  if (insertError) {
                    console.log('[PUBLIC WEBHOOK] Error inserting profile', insertError);
                  } else {
                    console.log('[PUBLIC WEBHOOK] Profile inserted successfully');
                  }
                } else {
                  console.log('[PUBLIC WEBHOOK] Error updating profile', profileError);
                }
              } else {
                console.log('[PUBLIC WEBHOOK] Profile updated successfully');
              }
            }
          } else {
            console.log('[PUBLIC WEBHOOK] No user_id found in custom_data, skipping database updates');
          }
        } catch (error) {
          console.log('[PUBLIC WEBHOOK] Error processing transcript', error);
        }
      } else {
        console.log('[PUBLIC WEBHOOK] No transcript available in completed call');
      }
    } else {
      console.log('[PUBLIC WEBHOOK] Non-completed call event received', { type: body.type });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('[PUBLIC WEBHOOK] Error in webhook', error);
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
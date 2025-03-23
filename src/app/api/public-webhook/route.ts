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
                confidence: transcript.confidence,
                raw_response: body // Store the entire webhook response for reference
              })
              .select();

            if (transcriptError) {
              console.log('[PUBLIC WEBHOOK] Error saving transcript', transcriptError);
              return NextResponse.json({ error: 'Failed to save transcript' }, { status: 500 });
            }

            console.log('[PUBLIC WEBHOOK] Transcript saved successfully', { insertId: insertData?.[0]?.id });
            return NextResponse.json({ success: true, transcriptId: insertData?.[0]?.id });
          } else {
            console.log('[PUBLIC WEBHOOK] No user_id found in custom_data, skipping database update');
            return NextResponse.json({ error: 'Missing user_id in custom_data' }, { status: 400 });
          }
        } catch (error) {
          console.log('[PUBLIC WEBHOOK] Error processing transcript', error);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
      } else {
        console.log('[PUBLIC WEBHOOK] No transcript available in completed call');
        return NextResponse.json({ error: 'No transcript in call data' }, { status: 400 });
      }
    } else {
      console.log('[PUBLIC WEBHOOK] Non-completed call event received', { type: body.type });
      return NextResponse.json({ error: 'Unsupported event type' }, { status: 400 });
    }
  } catch (error) {
    console.log('[PUBLIC WEBHOOK] Error in webhook', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
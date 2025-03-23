import { NextResponse } from "next/server";
import { getServerSupabaseClient } from '@/lib/supabase/client';

// Set a secret key for validating webhook requests
// This should match what you set in Vapi dashboard
const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET || "hackbuddysecret123";

// Simple logging helper
const logWebhookInfo = (message: string, data?: any) => {
  console.log('[PUBLIC WEBHOOK]', message, data ? data : '');
};

// Simplified webhook handler that doesn't require authentication
export async function POST(req: Request) {
  logWebhookInfo('Received webhook request');
  
  try {
    // Check X-VAPI-SECRET header for validation
    const secret = req.headers.get('x-vapi-secret');
    if (!secret || secret !== WEBHOOK_SECRET) {
      logWebhookInfo('Invalid or missing secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await req.json();
    logWebhookInfo('Request body:', body);

    // Initialize Supabase
    const supabase = getServerSupabaseClient();
    logWebhookInfo('Supabase client initialized');

    // Handle different event types
    if (body.type === 'call.completed' && body.call?.transcript) {
      logWebhookInfo('Call completed with transcript');
      
      const transcript = body.call.transcript;
      const userId = body.call.custom_data?.userId;
      const hackathonId = body.call.custom_data?.hackathonId;
      
      // Store only the raw transcript
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
      logWebhookInfo('Non-completed call event received', { type: body.type });
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    logWebhookInfo('Error in webhook', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
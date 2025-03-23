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
  try {
    // Parse the request body
    const body = await req.json();
    console.log('Webhook received:', body);

    // Initialize Supabase
    const supabase = getServerSupabaseClient();

    // Save transcript if available
    if (body.call?.transcript) {
      const { error } = await supabase
        .from('participant_conversations')
        .insert({
          user_id: body.call.custom_data?.userId || 'test-user',
          hackathon_id: body.call.custom_data?.hackathonId,
          transcript: body.call.transcript.text,
          confidence: body.call.transcript.confidence
        });

      if (error) {
        console.error('Error saving transcript:', error);
        return NextResponse.json({ error: 'Failed to save transcript' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
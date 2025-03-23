import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseTranscription } from '@/lib/utils/transcriptionParser';

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_API_KEY;

export async function POST(req: Request) {
  if (!VAPI_PRIVATE_KEY) {
    console.error('VAPI_PRIVATE_API_KEY is not set');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the conversation data from VAPI
    const { 
      conversation,
      userId, // We'll need to pass this from the frontend when initializing VAPI
      sessionId
    } = await req.json();

    if (!conversation || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store the raw conversation first
    const { error: conversationError } = await supabase
      .from('participant_conversations')
      .insert({
        user_id: userId,
        session_id: sessionId,
        raw_conversation: conversation,
        created_at: new Date().toISOString()
      });

    if (conversationError) {
      console.error('Error storing conversation:', conversationError);
      return NextResponse.json(
        { error: 'Failed to store conversation' },
        { status: 500 }
      );
    }

    // Parse the conversation to extract relevant information
    const parsedData = parseTranscription(conversation);

    // Forward the parsed data to our process-intro endpoint
    const processResponse = await fetch(new URL('/api/participant/process-intro', req.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`
      },
      body: JSON.stringify({
        transcription: conversation,
        userId: userId,
        sessionId: sessionId
      })
    });

    if (!processResponse.ok) {
      throw new Error('Failed to process introduction');
    }

    return NextResponse.json({
      message: 'Successfully processed conversation',
      data: parsedData
    });

  } catch (error) {
    console.error('Error processing VAPI conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
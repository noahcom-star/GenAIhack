import { NextResponse } from "next/server";

export async function GET() {
  console.log('[TEST WEBHOOK] Starting test');
  
  try {
    // Call the webhook endpoint directly (server-to-server)
    const response = await fetch(
      `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/public-webhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VAPI-SECRET': process.env.VAPI_WEBHOOK_SECRET || 'hackbuddysecret123'
        },
        body: JSON.stringify({
          type: 'call.completed',
          call: {
            id: 'test-call-id',
            transcript: {
              text: 'I have skills in javascript and react, and I am interested in web development',
              confidence: 0.9
            },
            custom_data: {
              userId: '123e4567-e89b-12d3-a456-426614174000',
              hackathonId: '123e4567-e89b-12d3-a456-426614174001'
            }
          }
        })
      }
    );
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = await response.text();
    }
    
    console.log('[TEST WEBHOOK] Test completed', {
      status: response.status,
      response: responseData
    });
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: responseData
    });
  } catch (error) {
    console.error('[TEST WEBHOOK] Error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
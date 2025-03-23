import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Simple route handler that doesn't require OpenAI
  return NextResponse.json(
    { 
      error: "OpenAI transcription is disabled in this deployment. Please configure the OPENAI_API_KEY environment variable to enable this feature." 
    },
    { status: 501 }
  );
}

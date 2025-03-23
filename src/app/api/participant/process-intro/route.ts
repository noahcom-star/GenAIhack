import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseTranscription, TranscriptionSchema } from '@/lib/utils/transcriptionParser';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the transcription from the request body
    const { transcription } = await req.json();
    if (!transcription) {
      return NextResponse.json({ error: 'No transcription provided' }, { status: 400 });
    }

    // Parse the transcription
    const parsedData = parseTranscription(transcription);
    
    // Validate the parsed data
    const validationResult = TranscriptionSchema.safeParse(parsedData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid transcription data', details: validationResult.error },
        { status: 400 }
      );
    }

    // Update the participant's profile with extracted information
    const { error: updateError } = await supabase
      .from('participant_profiles')
      .update({
        skills: parsedData.skills,
        interests: parsedData.interests,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // If there's project experience, store it
    if (parsedData.projectExperience && parsedData.projectExperience.length > 0) {
      const { error: projectError } = await supabase
        .from('participant_projects')
        .upsert(
          parsedData.projectExperience.map(project => ({
            user_id: session.user.id,
            name: project.name,
            description: project.description,
            technologies: project.technologies,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        );

      if (projectError) {
        console.error('Error storing project experience:', projectError);
      }
    }

    // If there are team preferences, store them
    if (parsedData.teamPreferences) {
      const { error: prefError } = await supabase
        .from('participant_preferences')
        .upsert({
          user_id: session.user.id,
          desired_team_size: parsedData.teamPreferences.desiredTeamSize,
          required_skills: parsedData.teamPreferences.requiredSkills,
          flexibility: parsedData.teamPreferences.flexibility,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (prefError) {
        console.error('Error storing team preferences:', prefError);
      }
    }

    return NextResponse.json({
      message: 'Successfully processed introduction',
      data: parsedData
    });

  } catch (error) {
    console.error('Error processing introduction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
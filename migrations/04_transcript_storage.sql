-- Create the participant_conversations table for storing transcripts
CREATE TABLE IF NOT EXISTS participant_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hackathon_id TEXT,
    transcript TEXT NOT NULL,
    confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_participant_conversations_user_id 
ON participant_conversations(user_id);

-- Create index on hackathon_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_participant_conversations_hackathon_id 
ON participant_conversations(hackathon_id); 
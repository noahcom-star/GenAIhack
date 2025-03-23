-- Table to store participant conversations with Vapi
CREATE TABLE IF NOT EXISTS participant_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hackathon_id UUID REFERENCES hackathons(id) ON DELETE SET NULL,
  call_id TEXT NOT NULL,
  transcript TEXT,
  confidence FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_participant_conversations_user_id ON participant_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_participant_conversations_hackathon_id ON participant_conversations(hackathon_id);

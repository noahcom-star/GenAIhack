-- Create the participant_conversations table
CREATE TABLE IF NOT EXISTS participant_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    hackathon_id TEXT,
    transcript TEXT NOT NULL,
    confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 
-- Create participant_conversations table
CREATE TABLE participant_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    raw_conversation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for participant_conversations
ALTER TABLE participant_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for participant_conversations
CREATE POLICY "Users can view their own conversations"
    ON participant_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
    ON participant_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX participant_conversations_user_id_idx ON participant_conversations(user_id);
CREATE INDEX participant_conversations_session_id_idx ON participant_conversations(session_id); 
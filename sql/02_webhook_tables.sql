-- Create participant_conversations table
create table if not exists participant_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  hackathon_id uuid references hackathons,
  transcript text,
  call_id text not null,
  confidence float,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for participant_conversations
create index if not exists idx_participant_conversations_user on participant_conversations(user_id);
create index if not exists idx_participant_conversations_call on participant_conversations(call_id);

-- Add updated_at trigger for participant_conversations
create trigger set_timestamp_participant_conversations
before update on participant_conversations
for each row
execute function update_updated_at_column(); 
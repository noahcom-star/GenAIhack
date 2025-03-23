-- Drop existing tables and triggers if they exist
drop trigger if exists set_timestamp_participant_conversations on participant_conversations;
drop trigger if exists set_timestamp_participant_profiles on participant_profiles;
drop table if exists participant_conversations;
drop table if exists participant_profiles;

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

-- Create participant_profiles table
create table if not exists participant_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  skills text[] default array[]::text[],
  interests text[] default array[]::text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

-- Create indexes after tables are created
create index if not exists idx_participant_conversations_user on participant_conversations(user_id);
create index if not exists idx_participant_conversations_call on participant_conversations(call_id);
create index if not exists idx_participant_profiles_user on participant_profiles(user_id);

-- Add updated_at triggers
create trigger set_timestamp_participant_conversations
before update on participant_conversations
for each row
execute function update_updated_at_column();

create trigger set_timestamp_participant_profiles
before update on participant_profiles
for each row
execute function update_updated_at_column(); 
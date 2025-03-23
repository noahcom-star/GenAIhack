-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Drop types if they exist
DO $$ BEGIN
    CREATE TYPE hackathon_status AS ENUM ('draft', 'active', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGI
    CREATE TYPE participant_status AS ENUM ('pending', 'active', 'matched');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create function to generate hackathon codes
create or replace function generate_hackathon_code()
returns text as $$
declare
  code text;
  exists_already boolean;
begin
  loop
    -- Generate a code in format HACK-XXX where X is a random digit
    code := 'HACK-' || floor(random() * (999-100+1) + 100)::text;
    
    -- Check if this code already exists
    select exists(
      select 1 from hackathons where join_code = code
    ) into exists_already;
    
    -- If code doesn't exist, we can use it
    if not exists_already then
      return code;
    end if;
  end loop;
end;
$$ language plpgsql;

-- Create tables
create table if not exists user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text,
  skills text[] default array[]::text[],
  interests text[] default array[]::text[],
  summary text,
  github_url text,
  linkedin_url text,
  portfolio_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

create table if not exists hackathons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  join_code text not null default generate_hackathon_code(),
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  organizer_id uuid references auth.users not null,
  status hackathon_status default 'draft',
  created_at timestamp with time zone default now(),
  unique(join_code)
);

create table if not exists whitelisted_participants (
  id uuid primary key default uuid_generate_v4(),
  hackathon_id uuid references hackathons on delete cascade not null,
  email text not null,
  status participant_status default 'pending',
  created_at timestamp with time zone default now(),
  unique(hackathon_id, email)
);

create table if not exists teams (
  id uuid primary key default uuid_generate_v4(),
  hackathon_id uuid references hackathons on delete cascade not null,
  name text not null,
  project_description text,
  created_at timestamp with time zone default now()
);

create table if not exists hackathon_participants (
  id uuid primary key default uuid_generate_v4(),
  hackathon_id uuid references hackathons on delete cascade not null,
  user_id uuid references auth.users not null,
  team_id uuid references teams,
  status participant_status default 'pending',
  created_at timestamp with time zone default now(),
  unique(hackathon_id, user_id)
);

create table if not exists team_invites (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams on delete cascade not null,
  from_user_id uuid references auth.users not null,
  to_user_id uuid references auth.users not null,
  status invite_status default 'pending',
  created_at timestamp with time zone default now()
);

-- Create indexes
create index if not exists idx_user_profiles_user_id on user_profiles(user_id);
create index if not exists idx_hackathons_organizer on hackathons(organizer_id);
create index if not exists idx_hackathons_join_code on hackathons(join_code);
create index if not exists idx_whitelisted_email on whitelisted_participants(email);
create index if not exists idx_participants_user on hackathon_participants(user_id);
create index if not exists idx_participants_team on hackathon_participants(team_id);
create index if not exists idx_team_invites_users on team_invites(from_user_id, to_user_id);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers
create trigger set_timestamp
before update on user_profiles
for each row
execute function update_updated_at_column(); 
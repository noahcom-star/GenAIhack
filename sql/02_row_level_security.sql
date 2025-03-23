-- Enable Row Level Security
alter table user_profiles enable row level security;
alter table hackathons enable row level security;
alter table whitelisted_participants enable row level security;
alter table teams enable row level security;
alter table hackathon_participants enable row level security;
alter table team_invites enable row level security;

-- User Profiles policies
create policy "Users can view all profiles"
  on user_profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on user_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on user_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Hackathons policies
create policy "Anyone can view hackathons"
  on hackathons for select
  to authenticated
  using (true);

create policy "Organizers can create hackathons"
  on hackathons for insert
  to authenticated
  with check (auth.uid() = organizer_id);

create policy "Organizers can update their hackathons"
  on hackathons for update
  to authenticated
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

-- Whitelisted participants policies
create policy "Organizers can view whitelisted participants"
  on whitelisted_participants for select
  to authenticated
  using (
    exists (
      select 1 from hackathons
      where id = hackathon_id
      and organizer_id = auth.uid()
    )
  );

create policy "Organizers can manage whitelisted participants"
  on whitelisted_participants for all
  to authenticated
  using (
    exists (
      select 1 from hackathons
      where id = hackathon_id
      and organizer_id = auth.uid()
    )
  );

-- Teams policies
create policy "Anyone can view teams"
  on teams for select
  to authenticated
  using (true);

create policy "Participants can create teams"
  on teams for insert
  to authenticated
  with check (
    exists (
      select 1 from hackathon_participants
      where hackathon_id = teams.hackathon_id
      and user_id = auth.uid()
      and status = 'active'
    )
  );

-- Hackathon participants policies
create policy "Anyone can view participants"
  on hackathon_participants for select
  to authenticated
  using (true);

create policy "Users can join hackathons if whitelisted"
  on hackathon_participants for insert
  to authenticated
  with check (
    exists (
      select 1 from whitelisted_participants wp
      join auth.users u on u.email = wp.email
      where wp.hackathon_id = hackathon_participants.hackathon_id
      and u.id = auth.uid()
      and wp.status = 'pending'
    )
  );

-- Team invites policies
create policy "Users can view their invites"
  on team_invites for select
  to authenticated
  using (
    auth.uid() = from_user_id
    or auth.uid() = to_user_id
  );

create policy "Active participants can send invites"
  on team_invites for insert
  to authenticated
  with check (
    exists (
      select 1 from hackathon_participants hp
      join teams t on t.id = team_invites.team_id
      where hp.hackathon_id = t.hackathon_id
      and hp.user_id = auth.uid()
      and hp.status = 'active'
    )
  );

create policy "Invite recipients can update status"
  on team_invites for update
  to authenticated
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id); 
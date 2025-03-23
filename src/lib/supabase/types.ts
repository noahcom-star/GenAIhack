export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type UserProfile = {
  id: string;
  user_id: string;
  skills: string[];
  interests: string[];
  summary: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  created_at: string;
  updated_at: string;
};

export type Hackathon = {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  organizer_id: string;
  created_at: string;
};

export type WhitelistedParticipant = {
  id: string;
  hackathon_id: string;
  email: string;
  created_at: string;
};

export type HackathonParticipant = {
  id: string;
  user_id: string;
  hackathon_id: string;
  status: 'pending' | 'active' | 'matched';
  team_id?: string;
  created_at: string;
};

export type Team = {
  id: string;
  hackathon_id: string;
  name: string;
  project_description?: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id'>>;
      };
      hackathons: {
        Row: Hackathon;
        Insert: Omit<Hackathon, 'id' | 'created_at'>;
        Update: Partial<Omit<Hackathon, 'id'>>;
      };
      whitelisted_participants: {
        Row: WhitelistedParticipant;
        Insert: Omit<WhitelistedParticipant, 'id' | 'created_at'>;
        Update: Partial<Omit<WhitelistedParticipant, 'id'>>;
      };
      hackathon_participants: {
        Row: HackathonParticipant;
        Insert: Omit<HackathonParticipant, 'id' | 'created_at'>;
        Update: Partial<Omit<HackathonParticipant, 'id'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at'>;
        Update: Partial<Omit<Team, 'id'>>;
      };
    };
  };
}; 
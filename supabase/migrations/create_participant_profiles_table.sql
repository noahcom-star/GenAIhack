-- Create participant_profiles table
CREATE TABLE public.participant_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  skills TEXT NOT NULL,
  interests TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add row-level security policies
ALTER TABLE public.participant_profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to see all profiles
CREATE POLICY "Authenticated users can view all profiles" ON public.participant_profiles 
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update or insert their own profile
CREATE POLICY "Users can update own profile" ON public.participant_profiles 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.participant_profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_participant_profiles_updated_at
BEFORE UPDATE ON public.participant_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for faster lookups
CREATE INDEX participant_profiles_user_id_idx ON public.participant_profiles (user_id); 
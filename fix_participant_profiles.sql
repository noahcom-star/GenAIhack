-- Drop existing RLS policies (if any)
DROP POLICY IF EXISTS "Users can view own profile" ON public.participant_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.participant_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.participant_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.participant_profiles;

-- Make sure RLS is enabled (it might be disabled)
ALTER TABLE public.participant_profiles ENABLE ROW LEVEL SECURITY;

-- Add broader policies that will work
CREATE POLICY "Authenticated users can view all profiles" ON public.participant_profiles 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profiles" ON public.participant_profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles" ON public.participant_profiles 
  FOR UPDATE USING (auth.uid() = user_id);

-- Fix the function for updated_at if needed
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_participant_profiles_updated_at ON public.participant_profiles;
CREATE TRIGGER update_participant_profiles_updated_at
BEFORE UPDATE ON public.participant_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Verify the schema of participant_profiles
COMMENT ON TABLE public.participant_profiles IS 'Table storing participant profile information'; 
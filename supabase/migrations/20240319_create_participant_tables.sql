-- Create participant_projects table
CREATE TABLE participant_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    technologies TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for participant_projects
ALTER TABLE participant_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for participant_projects
CREATE POLICY "Users can view their own projects"
    ON participant_projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON participant_projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
    ON participant_projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create participant_preferences table
CREATE TABLE participant_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    desired_team_size INT,
    required_skills TEXT[] DEFAULT '{}',
    flexibility TEXT CHECK (flexibility IN ('flexible', 'specific')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for participant_preferences
ALTER TABLE participant_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for participant_preferences
CREATE POLICY "Users can view their own preferences"
    ON participant_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON participant_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON participant_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX participant_projects_user_id_idx ON participant_projects(user_id);
CREATE INDEX participant_projects_technologies_idx ON participant_projects USING GIN(technologies);
CREATE INDEX participant_preferences_user_id_idx ON participant_preferences(user_id);
CREATE INDEX participant_preferences_required_skills_idx ON participant_preferences USING GIN(required_skills); 
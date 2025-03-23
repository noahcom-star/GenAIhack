-- Create arrays of skill and interest keywords
CREATE OR REPLACE FUNCTION get_skill_keywords()
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY[
    'javascript', 'typescript', 'react', 'node', 'python', 'java', 'c++',
    'html', 'css', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql',
    'aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'devops',
    'mobile', 'android', 'ios', 'swift', 'kotlin', 'flutter', 'react native',
    'machine learning', 'ai', 'data science', 'blockchain', 'web3',
    'ui', 'ux', 'design', 'product management', 'agile', 'scrum'
  ];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_interest_keywords()
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY[
    'web development', 'mobile development', 'game development', 'ai',
    'machine learning', 'data science', 'blockchain', 'web3', 'ar', 'vr',
    'iot', 'robotics', 'cybersecurity', 'cloud computing', 'devops',
    'ui/ux', 'product design', 'fintech', 'healthtech', 'edtech', 'sustainability',
    'social impact', 'open source'
  ];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to extract skills from text
CREATE OR REPLACE FUNCTION extract_skills(transcript_text text)
RETURNS text[] AS $$
DECLARE
  skill text;
  found_skills text[] := '{}';
BEGIN
  FOREACH skill IN ARRAY get_skill_keywords()
  LOOP
    IF transcript_text ILIKE '%' || skill || '%' THEN
      found_skills := array_append(found_skills, skill);
    END IF;
  END LOOP;
  RETURN found_skills;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to extract interests from text
CREATE OR REPLACE FUNCTION extract_interests(transcript_text text)
RETURNS text[] AS $$
DECLARE
  interest text;
  found_interests text[] := '{}';
BEGIN
  FOREACH interest IN ARRAY get_interest_keywords()
  LOOP
    IF transcript_text ILIKE '%' || interest || '%' THEN
      found_interests := array_append(found_interests, interest);
    END IF;
  END LOOP;
  RETURN found_interests;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to process a transcript and update the participant profile
CREATE OR REPLACE FUNCTION process_transcript()
RETURNS TRIGGER AS $$
DECLARE
  extracted_skills text[];
  extracted_interests text[];
  existing_skills text[];
  existing_interests text[];
BEGIN
  -- Extract skills and interests from the new transcript
  extracted_skills := extract_skills(NEW.transcript);
  extracted_interests := extract_interests(NEW.transcript);
  
  -- Get existing profile or create one if it doesn't exist
  INSERT INTO participant_profiles (user_id, skills, interests)
  VALUES (NEW.user_id, extracted_skills, extracted_interests)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    skills = array_distinct(participant_profiles.skills || excluded.skills),
    interests = array_distinct(participant_profiles.interests || excluded.interests),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to remove duplicates from arrays
CREATE OR REPLACE FUNCTION array_distinct(arr text[])
RETURNS text[] AS $$
  SELECT array_agg(DISTINCT x) FROM unnest(arr) x;
$$ LANGUAGE sql IMMUTABLE;

-- Create trigger to process transcripts automatically
DROP TRIGGER IF EXISTS process_transcript_trigger ON participant_conversations;
CREATE TRIGGER process_transcript_trigger
  AFTER INSERT ON participant_conversations
  FOR EACH ROW
  EXECUTE FUNCTION process_transcript(); 
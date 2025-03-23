-- First, ensure we have the test user in auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'test@example.com',
  '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF',  -- This is a dummy hashed password
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create a test hackathon
INSERT INTO hackathons (
  id,
  name,
  description,
  start_date,
  end_date,
  organizer_id,
  status
) VALUES (
  '123e4567-e89b-12d3-a456-426614174001',
  'Test Hackathon',
  'A test hackathon for webhook testing',
  NOW(),
  NOW() + INTERVAL '7 days',
  '123e4567-e89b-12d3-a456-426614174000',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Create a test user profile
INSERT INTO user_profiles (
  user_id,
  name,
  skills,
  interests
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'Test User',
  ARRAY['javascript', 'react'],
  ARRAY['web development']
) ON CONFLICT (user_id) DO NOTHING; 
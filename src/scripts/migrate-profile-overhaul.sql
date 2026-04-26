-- Migration: Profile overhaul - add headline, bio, avatar_url, public_slug columns
-- Safe: uses IF NOT EXISTS / ADD IF NOT EXISTS pattern

-- Add headline column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'headline') THEN
    ALTER TABLE profiles ADD COLUMN headline TEXT;
  END IF;
END $$;

-- Add bio column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  END IF;
END $$;

-- Add avatar_url column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Add public_slug column (unique for public profile URLs)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'public_slug') THEN
    ALTER TABLE profiles ADD COLUMN public_slug TEXT UNIQUE;
  END IF;
END $$;

-- Add updated_at trigger if not present
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create profile-avatars storage bucket (run separately in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-avatars', 'profile-avatars', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-avatars bucket:
-- 1. Authenticated users can upload their own avatar
-- CREATE POLICY "Users can upload own avatar" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- 
-- 2. Authenticated users can update their own avatar
-- CREATE POLICY "Users can update own avatar" ON storage.objects
--   FOR UPDATE USING (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- 3. Authenticated users can delete their own avatar
-- CREATE POLICY "Users can delete own avatar" ON storage.objects
--   FOR DELETE USING (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- 4. Public can read avatars (for public profiles)
-- CREATE POLICY "Public can read avatars" ON storage.objects
--   FOR SELECT USING (bucket_id = 'profile-avatars');

-- RLS: Users can update their own profile
-- This should already exist, but ensure it:
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS: Public can view profiles for public profile pages (limited fields)
-- Note: We handle this via a separate API route that only returns public-safe fields
-- The existing RLS for profiles should restrict SELECT to the user's own profile
-- We'll create a separate API endpoint that uses service role for public reads

-- Function to generate a unique public_slug from name/email
CREATE OR REPLACE FUNCTION generate_public_slug(proposed_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Clean the slug: lowercase, remove special chars, replace spaces with hyphens
  final_slug := lower(regexp_replace(regexp_replace(proposed_slug, '[^a-zA-Z0-9\s-]', ''), '\s+', '-'));
  
  -- Ensure it's not empty
  IF final_slug = '' OR final_slug IS NULL THEN
    final_slug := 'user-' || substr(gen_random_uuid()::text, 1, 8);
  END IF;
  
  -- Check uniqueness and add suffix if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE public_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := final_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ language 'plpgsql';
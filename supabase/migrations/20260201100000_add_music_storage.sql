-- Add music_url to games table
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS music_url TEXT;

-- Create storage bucket for music
INSERT INTO storage.buckets (id, name, public)
VALUES ('music', 'music', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for music bucket
CREATE POLICY "Allow public read access on music" ON storage.objects
  FOR SELECT USING (bucket_id = 'music');

-- Public insert access for music bucket
CREATE POLICY "Allow public insert access on music" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'music');

-- Public update access for music bucket (for upserts)
CREATE POLICY "Allow public update access on music" ON storage.objects
  FOR UPDATE USING (bucket_id = 'music');

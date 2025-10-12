-- Create waitlist_signups table for beta signup form
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_email ON public.waitlist_signups(email);

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at ON public.waitlist_signups(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for signup form)
CREATE POLICY "Anyone can insert waitlist signups"
  ON public.waitlist_signups
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow authenticated users to read all signups (for admin dashboard)
CREATE POLICY "Authenticated users can read waitlist signups"
  ON public.waitlist_signups
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at
CREATE TRIGGER set_waitlist_signups_updated_at
  BEFORE UPDATE ON public.waitlist_signups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.waitlist_signups IS 'Stores beta waitlist signup information from the BetaSignupDialog form';

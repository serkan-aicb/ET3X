-- Ensure profiles has the encrypted email column expected by auth code.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_ciphertext TEXT;

COMMENT ON COLUMN public.profiles.email_ciphertext IS 'AES-GCM encrypted email envelope. Never expose this in public APIs.';

-- Run this in Supabase SQL Editor

-- 1. Add unique constraint on email if not exists
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_email_unique UNIQUE (email);

-- 2. Make SELECT on users open to any authenticated user (simplest reliable policy)
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Sync existing user IDs to match Supabase Auth UUIDs
UPDATE public.users
SET id = au.id
FROM auth.users AS au
WHERE au.email = public.users.email
  AND public.users.id::text != au.id::text;

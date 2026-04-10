-- ============================================
-- FIX: Infinite recursion in users RLS policy
-- ============================================
-- The old policy checked "users" table inside a policy ON "users" = infinite loop.
-- Fix: use a SECURITY DEFINER function that bypasses RLS to check admin status.

-- Step 1: Create a helper function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Step 2: Fix users table policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;

-- Allow users to read their own row, admins can read all
CREATE POLICY "Users read policy" ON users
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
  );

-- Allow admins to delete users
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (public.is_admin());

-- Allow admins to update users (for role changes)
DROP POLICY IF EXISTS "Admins can update users" ON users;
CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (public.is_admin());

-- Step 3: Fix reviews policies
DROP POLICY IF EXISTS "Public read access" ON reviews;
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can delete any review" ON reviews;
DROP POLICY IF EXISTS "Reviews are publicly readable" ON reviews;

-- Everyone can read all reviews (they're public)
CREATE POLICY "Reviews are publicly readable" ON reviews
  FOR SELECT USING (true);

-- Admins or the review author can delete
CREATE POLICY "Admins can delete any review" ON reviews
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- Step 4: Fix courses policies  
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;

CREATE POLICY "Admins can delete courses" ON courses
  FOR DELETE USING (public.is_admin());

-- Step 5: Make sure users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Make sure users can update their own profile
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

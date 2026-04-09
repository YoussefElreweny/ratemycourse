-- RateMyCourse: Auth & Admin Setup Migration
-- Run this in Supabase → SQL Editor

-- 1. Allow admins to read ALL user data
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users 
  FOR SELECT USING (
    auth.uid() = id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Allow users to INSERT their own profile row on first login
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Allow users to UPDATE their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (
    auth.uid() = id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Allow admins to delete any review
DROP POLICY IF EXISTS "Admins can delete any review" ON reviews;
CREATE POLICY "Admins can delete any review" ON reviews 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Auto-create user profile on first Google login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.email = 'y.reweny@gmail.com' THEN 'admin' ELSE 'student' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. After y.reweny@gmail.com signs in once, run this to ensure admin role:
-- UPDATE users SET role = 'admin' WHERE email = 'y.reweny@gmail.com';

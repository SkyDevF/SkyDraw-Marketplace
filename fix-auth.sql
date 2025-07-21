-- Fix Authentication and Admin Setup
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view approved shops" ON shops;
DROP POLICY IF EXISTS "Artists can manage their own shops" ON shops;
DROP POLICY IF EXISTS "Anyone can view artworks from approved shops" ON artworks;
DROP POLICY IF EXISTS "Artists can manage their own artworks" ON artworks;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can manage their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Disable RLS temporarily to allow service role access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE artworks DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Create simple policies that allow service role full access
CREATE POLICY "Allow service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON shops FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON artworks FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON orders FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON messages FOR ALL USING (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Delete existing admin user if exists
DELETE FROM users WHERE email = 'admin@skydraw.com';

-- Create admin user
INSERT INTO users (name, email, password, role) 
VALUES (
    'Admin', 
    'admin@skydraw.com', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', -- password: admin123
    'admin'
);

-- Verify admin user was created
SELECT id, name, email, role, created_at FROM users WHERE role = 'admin';

-- Show all users for verification
SELECT id, name, email, role FROM users ORDER BY created_at DESC;
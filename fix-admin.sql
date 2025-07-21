-- Fix Admin User Creation
-- Run this in Supabase SQL Editor if admin login doesn't work

-- Delete existing admin user if exists
DELETE FROM users WHERE email = 'admin@skydraw.com';

-- Create new admin user
INSERT INTO users (name, email, password, role) 
VALUES (
    'Admin', 
    'admin@skydraw.com', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', -- password: admin123
    'admin'
);

-- Verify admin user was created
SELECT id, name, email, role FROM users WHERE role = 'admin';
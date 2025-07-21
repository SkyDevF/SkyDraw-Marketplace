-- SkyDraw Marketplace Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security (RLS) for all tables
-- This is important for Supabase security

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'artist', 'admin')),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artworks table
CREATE TABLE IF NOT EXISTS artworks (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artist_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artwork_id BIGINT REFERENCES artworks(id) ON DELETE SET NULL,
    detail TEXT,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'paid', 'working', 'done')),
    price DECIMAL(10,2) NOT NULL,
    qr_code_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_shops_user_id ON shops(user_id);
CREATE INDEX IF NOT EXISTS idx_shops_approved ON shops(is_approved);
CREATE INDEX IF NOT EXISTS idx_artworks_shop_id ON artworks(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_artist_id ON orders(artist_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

-- Shops policies
CREATE POLICY "Anyone can view approved shops" ON shops
    FOR SELECT USING (is_approved = true OR auth.role() = 'service_role');

CREATE POLICY "Artists can manage their own shops" ON shops
    FOR ALL USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

-- Artworks policies
CREATE POLICY "Anyone can view artworks from approved shops" ON artworks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = artworks.shop_id 
            AND shops.is_approved = true
        ) OR auth.role() = 'service_role'
    );

CREATE POLICY "Artists can manage their own artworks" ON artworks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.id = artworks.shop_id 
            AND shops.user_id::text = auth.uid()::text
        ) OR auth.role() = 'service_role'
    );

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (
        customer_id::text = auth.uid()::text 
        OR artist_id::text = auth.uid()::text 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can manage their own orders" ON orders
    FOR ALL USING (
        customer_id::text = auth.uid()::text 
        OR artist_id::text = auth.uid()::text 
        OR auth.role() = 'service_role'
    );

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (
        sender_id::text = auth.uid()::text 
        OR receiver_id::text = auth.uid()::text 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        sender_id::text = auth.uid()::text 
        OR auth.role() = 'service_role'
    );

-- Insert default admin user (optional)
-- Change the email and password as needed
INSERT INTO users (name, email, password, role) 
VALUES (
    'Admin', 
    'admin@skydraw.com', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', -- password: admin123
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Create a function to automatically create shop for new artists
CREATE OR REPLACE FUNCTION create_shop_for_artist()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'artist' THEN
        INSERT INTO shops (user_id, name, bio)
        VALUES (NEW.id, NEW.name || '''s Art Shop', 'ยินดีต้อนรับสู่ร้านของเรา');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create shop for new artists
CREATE TRIGGER trigger_create_shop_for_artist
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_shop_for_artist();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
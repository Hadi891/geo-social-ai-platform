-- CREATE EXTENSION IF NOT EXISTS postgis;

-- CREATE TABLE IF NOT EXISTS users (
--     id UUID PRIMARY KEY,
--     email TEXT UNIQUE NOT NULL,
--     name TEXT,
--     age INT,
--     bio TEXT,
--     introversion_score INT DEFAULT 50,
--     created_at TIMESTAMP DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS photos (
--     id UUID PRIMARY KEY,
--     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
--     image_url TEXT NOT NULL,
--     created_at TIMESTAMP DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS locations (
--     user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
--     latitude DOUBLE PRECISION NOT NULL,
--     longitude DOUBLE PRECISION NOT NULL,
--     geom GEOGRAPHY(Point,4326) NOT NULL,
--     updated_at TIMESTAMP DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS likes (
--     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
--     liked_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
--     created_at TIMESTAMP DEFAULT NOW(),
--     PRIMARY KEY (user_id, liked_user_id)
-- );

-- CREATE TABLE IF NOT EXISTS matches (
--     id UUID PRIMARY KEY,
--     user_a UUID REFERENCES users(id) ON DELETE CASCADE,
--     user_b UUID REFERENCES users(id) ON DELETE CASCADE,
--     created_at TIMESTAMP DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS messages (
--     id UUID PRIMARY KEY,
--     match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
--     sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
--     message_text TEXT NOT NULL,
--     created_at TIMESTAMP DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS posts (
--     id UUID PRIMARY KEY,
--     author_id UUID REFERENCES users(id) ON DELETE CASCADE,
--     content TEXT,
--     media_url TEXT,
--     created_at TIMESTAMP DEFAULT NOW(),
--     expires_at TIMESTAMP
-- );
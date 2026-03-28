CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    cognito_sub TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    gender TEXT,
    sexual_orientation TEXT,
    interests TEXT[],
    name TEXT,
    age INT,
    bio TEXT,
    introversion_score INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_profile_photo BOOLEAN DEFAULT FALSE,
    position INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOGRAPHY(Point, 4326) NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, liked_user_id),
    CHECK (user_id <> liked_user_id)
);

CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY,
    user_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (user_a <> user_b),
    UNIQUE (user_a, user_b)
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Migrate existing installations: add columns if not already present
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS match_reads (
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (match_id, user_id)
);

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    CHECK (content IS NOT NULL OR media_url IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_likes (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_locations_geom
ON locations
USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_likes_user_id
ON likes(user_id);

CREATE INDEX IF NOT EXISTS idx_likes_liked_user_id
ON likes(liked_user_id);

CREATE INDEX IF NOT EXISTS idx_likes_created_at
ON likes(created_at);

CREATE INDEX IF NOT EXISTS idx_matches_user_a
ON matches(user_a);

CREATE INDEX IF NOT EXISTS idx_matches_user_b
ON matches(user_b);

CREATE INDEX IF NOT EXISTS idx_messages_match_id
ON messages(match_id);

CREATE INDEX IF NOT EXISTS idx_match_reads_user_id
ON match_reads(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at
ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_posts_author_id
ON posts(author_id);

CREATE INDEX IF NOT EXISTS idx_posts_created_at
ON posts(created_at);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id
ON post_comments(post_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_author_id
ON post_comments(author_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_created_at
ON post_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id
ON post_likes(post_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_user_id
ON post_likes(user_id);

CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    CHECK (media_type IN ('image', 'video'))
);

CREATE TABLE IF NOT EXISTS story_views (
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_stories_author_id
ON stories(author_id);

CREATE INDEX IF NOT EXISTS idx_stories_created_at
ON stories(created_at);

CREATE INDEX IF NOT EXISTS idx_stories_expires_at
ON stories(expires_at);

CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id
ON story_views(viewer_id);

CREATE TABLE IF NOT EXISTS match_states (
    match_id           UUID PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
    mode               TEXT NOT NULL,
    message_checkpoint INT NOT NULL DEFAULT 0,
    updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (mode IN ('discovery', 'flow', 'stalled', 'tension', 'inactive'))
);

-- Migrate existing installations
ALTER TABLE match_states ADD COLUMN IF NOT EXISTS message_checkpoint INT NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS one_profile_photo_per_user
ON photos(user_id)
WHERE is_profile_photo = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS unique_photo_position_per_user
ON photos(user_id, position)
WHERE position IS NOT NULL;

-- Migrate existing installations: add is_verified to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS user_verifications (
    user_id                UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status                 TEXT NOT NULL DEFAULT 'pending',
    profile_photo_url      TEXT,
    liveness_session_id    TEXT,
    liveness_confidence    DOUBLE PRECISION,
    face_similarity        DOUBLE PRECISION,
    reference_image_s3_key TEXT,
    verified_at            TIMESTAMP NULL,
    rejection_reason       TEXT NULL,
    created_at             TIMESTAMP DEFAULT NOW(),
    updated_at             TIMESTAMP DEFAULT NOW(),
    CHECK (status IN ('pending', 'verified', 'rejected'))
);
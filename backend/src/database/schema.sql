-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  plan VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'studio', 'enterprise')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  audio_url TEXT NOT NULL,
  album_art_url TEXT,
  duration_seconds INT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Lyrics table
CREATE TABLE IF NOT EXISTS lyrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  line_number INT NOT NULL,
  text TEXT NOT NULL,
  start_time FLOAT NOT NULL,
  end_time FLOAT NOT NULL,
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_lyrics_project_id ON lyrics(project_id);
CREATE INDEX IF NOT EXISTS idx_lyrics_line_number ON lyrics(project_id, line_number);
CREATE INDEX IF NOT EXISTS idx_lyrics_time_range ON lyrics(project_id, start_time, end_time);

-- Exports table
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  resolution VARCHAR(10) NOT NULL,
  format VARCHAR(10) NOT NULL,
  file_url TEXT,
  thumbnail_url TEXT,
  file_size_mb FLOAT,
  youtube_video_id VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exports_project_id ON exports(project_id);
CREATE INDEX IF NOT EXISTS idx_exports_status ON exports(status);
CREATE INDEX IF NOT EXISTS idx_exports_created_at ON exports(created_at DESC);

-- Templates table (user-created and system)
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('minimal', 'vibrant', 'retro', 'modern', 'custom')),
  thumbnail TEXT NOT NULL,
  config JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  uses INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_uses ON templates(uses DESC);

-- Refresh tokens for JWT
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- YouTube credentials (OAuth tokens)
CREATE TABLE IF NOT EXISTS youtube_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youtube_credentials_updated_at BEFORE UPDATE ON youtube_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some system templates
INSERT INTO templates (id, user_id, name, category, thumbnail, config, is_public, uses) VALUES
(
  uuid_generate_v4(),
  NULL,
  'Classic Black',
  'minimal',
  'https://placeholder.com/templates/classic-black.jpg',
  '{
    "resolution": "1080p",
    "aspectRatio": "16:9",
    "duration": 0,
    "background": {
      "type": "solid",
      "color": "#000000"
    },
    "text": {
      "font": "Inter",
      "size": 60,
      "weight": "700",
      "color": "#FFFFFF",
      "alignment": "center",
      "position": { "x": 50, "y": 50 },
      "maxWidth": 80,
      "animation": "fade",
      "animationDuration": 300,
      "displayMode": "single"
    },
    "effects": {
      "emojis": false
    },
    "albumArt": {
      "enabled": false,
      "position": "bottom-right",
      "size": 200
    }
  }'::jsonb,
  TRUE,
  0
),
(
  uuid_generate_v4(),
  NULL,
  'Delulu (Pink Hearts)',
  'vibrant',
  'https://placeholder.com/templates/delulu-pink.jpg',
  '{
    "resolution": "1080p",
    "aspectRatio": "16:9",
    "duration": 0,
    "background": {
      "type": "gradient",
      "colors": ["#ff69b4", "#ffa8c5"],
      "gradientType": "linear"
    },
    "text": {
      "font": "Poppins",
      "size": 90,
      "weight": "900",
      "color": "#FFFFFF",
      "outline": {
        "enabled": true,
        "color": "#ff1493",
        "width": 6
      },
      "alignment": "center",
      "position": { "x": 50, "y": 50 },
      "maxWidth": 80,
      "animation": "pop",
      "animationDuration": 400,
      "displayMode": "single"
    },
    "effects": {
      "emojis": true,
      "emojiConfig": {
        "types": ["💕", "💗", "✨", "🌙"],
        "count": 20,
        "size": 80,
        "animation": "float",
        "speed": 1.0,
        "opacity": 0.8
      }
    },
    "albumArt": {
      "enabled": true,
      "source": "audio-metadata",
      "position": "bottom-right",
      "size": 250,
      "borderRadius": 20,
      "animation": "pulse"
    }
  }'::jsonb,
  TRUE,
  0
)
ON CONFLICT DO NOTHING;

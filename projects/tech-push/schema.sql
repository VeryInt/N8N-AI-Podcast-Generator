-- 播客频道表
CREATE TABLE IF NOT EXISTS podcast_channels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'zh-CN',
  author TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  image_url TEXT,
  website_url TEXT,
  explicit BOOLEAN NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 播客节目表
CREATE TABLE IF NOT EXISTS podcast_episodes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT,
  audio_url TEXT NOT NULL,
  audio_path TEXT NOT NULL,
  duration INTEGER,
  file_size INTEGER,
  publish_date TEXT NOT NULL,
  author TEXT,
  keywords TEXT, -- JSON 数组字符串
  image_url TEXT,
  explicit BOOLEAN NOT NULL DEFAULT 0,
  season INTEGER,
  episode INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_episodes_publish_date ON podcast_episodes(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_episodes_audio_path ON podcast_episodes(audio_path);
CREATE INDEX IF NOT EXISTS idx_channels_created_at ON podcast_channels(created_at DESC);

-- 插入默认频道信息
INSERT OR IGNORE INTO podcast_channels (
  id, title, description, language, author, email, 
  category, image_url, explicit, created_at, updated_at
) VALUES (
  'default-channel',
  '我的播客',
  '这是一个示例播客频道',
  'zh-CN',
  '播客作者',
  'author@example.com',
  'Technology',
  'https://example.com/podcast-image.jpg',
  0,
  datetime('now'),
  datetime('now')
); 
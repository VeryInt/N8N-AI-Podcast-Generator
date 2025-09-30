# 🎙️ 播客系统设置指南

## 📋 概述

这个播客系统包含以下功能：
- **音频文件上传**：支持 MP3 等格式上传到 R2 存储
- **播客节目管理**：创建、编辑、删除播客节目
- **频道信息管理**：设置播客频道的基本信息
- **RSS Feed 生成**：自动生成符合 Apple Podcasts 标准的 XML
- **Web 管理界面**：直观的 React 管理界面

## 🚀 快速开始

### 1. **创建 D1 数据库**

```bash
# 创建数据库
npx wrangler d1 create podcast-db

# 应用数据库 schema
npx wrangler d1 execute podcast-db --file=./schema.sql
```

### 2. **更新 wrangler.json 配置**

将生成的数据库 ID 替换到配置中：

```json
{
  "d1_databases": [
    {
      "binding": "PODCAST_DB",
      "database_name": "podcast-db",
      "database_id": "你的数据库ID"
    }
  ]
}
```

### 3. **部署到 Cloudflare**

```bash
# 构建和部署
npm run build
npm run deploy
```

## 📖 使用指南

### 1. **访问管理界面**

- **主页面**：`https://your-worker.workers.dev`
- **音频上传**：`https://your-worker.workers.dev/audio-upload`
- **播客管理**：`https://your-worker.workers.dev/podcast`

### 2. **设置频道信息**

1. 访问播客管理页面
2. 点击"频道设置"
3. 填写频道信息：
   - **标题**：播客名称
   - **描述**：播客简介
   - **作者**：播客作者
   - **邮箱**：联系邮箱
   - **分类**：播客分类
   - **语言**：播客语言
   - **封面图片**：频道封面 URL

### 3. **上传音频文件**

1. 访问音频上传页面
2. 拖拽或选择音频文件
3. 文件会自动上传到 R2 存储
4. 记录生成的文件路径（如：`/2025/0730/episode.mp3`）

### 4. **创建播客节目**

1. 在播客管理页面点击"新建节目"
2. 填写节目信息：
   - **标题**：节目标题
   - **描述**：节目简介
   - **音频URL**：R2 文件的访问地址
   - **音频路径**：R2 中的文件路径
   - **时长**：音频时长（秒）
   - **文件大小**：文件大小（字节）
   - **作者**：节目作者
   - **关键词**：搜索关键词
   - **封面图片**：节目封面 URL

### 5. **获取 RSS Feed**

播客的 RSS Feed 地址：
```
https://your-worker.workers.dev/api/podcast/feed
```

## 🍎 在 Apple Podcasts 中使用

### 1. **添加播客到 Apple Podcasts**

1. 打开 Apple Podcasts 应用
2. 点击"库"标签
3. 点击右上角的"..."按钮
4. 选择"通过 URL 添加播客"
5. 输入你的 RSS Feed 地址：
   ```
   https://your-worker.workers.dev/api/podcast/feed
   ```

### 2. **验证 RSS Feed**

在提交到 Apple Podcasts 之前，建议先验证 RSS Feed：

- **Apple Podcasts Connect**：https://podcastsconnect.apple.com/
- **RSS 验证工具**：https://validator.w3.org/feed/

## 🔧 API 接口

### 播客管理 API

#### 获取 RSS Feed
```bash
GET /api/podcast/feed
```

#### 获取节目列表
```bash
GET /api/podcast/episodes
```

#### 创建新节目
```bash
POST /api/podcast/episodes
Content-Type: application/json

{
  "title": "节目标题",
  "description": "节目描述",
  "audioUrl": "https://your-domain.com/2025/0730/episode.mp3",
  "audioPath": "/2025/0730/episode.mp3",
  "duration": 1800,
  "fileSize": 25000000,
  "author": "作者名",
  "keywords": ["技术", "编程"],
  "publishDate": "2025-07-30T10:00:00Z"
}
```

#### 获取频道信息
```bash
GET /api/podcast/channel
```

#### 更新频道信息
```bash
PUT /api/podcast/channel
Content-Type: application/json

{
  "title": "播客标题",
  "description": "播客描述",
  "author": "作者名",
  "email": "author@example.com",
  "category": "Technology",
  "language": "zh-CN"
}
```

### 音频上传 API

#### 上传音频文件
```bash
POST /api/audio/upload
Content-Type: multipart/form-data

file: [音频文件]
filename: [可选自定义文件名]
```

#### 获取文件列表
```bash
GET /api/audio/files/2025/0730
```

## 📊 数据库结构

### podcast_channels 表
```sql
CREATE TABLE podcast_channels (
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
```

### podcast_episodes 表
```sql
CREATE TABLE podcast_episodes (
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
  keywords TEXT,
  image_url TEXT,
  explicit BOOLEAN NOT NULL DEFAULT 0,
  season INTEGER,
  episode INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 🎯 最佳实践

### 1. **音频文件优化**

- **格式**：使用 MP3 格式，比特率 128-320 kbps
- **时长**：建议 15-60 分钟
- **文件大小**：控制在 50MB 以内
- **质量**：确保音频清晰，无噪音

### 2. **元数据优化**

- **标题**：简洁明了，包含关键词
- **描述**：详细描述节目内容，包含关键词
- **关键词**：使用相关搜索词，提高发现率
- **封面图片**：使用高质量图片，尺寸建议 1400x1400

### 3. **发布频率**

- **定期发布**：保持稳定的发布频率
- **发布时间**：选择听众活跃的时间段
- **预告**：提前预告下一期内容

### 4. **内容质量**

- **内容价值**：提供有价值的内容
- **音频质量**：确保录音质量
- **互动性**：鼓励听众互动和反馈

## 🔍 故障排除

### 常见问题

#### 1. **RSS Feed 无法访问**
- 检查 Worker 是否正常部署
- 确认数据库连接正常
- 查看 Worker 日志

#### 2. **音频文件无法播放**
- 检查 R2 存储配置
- 确认文件路径正确
- 验证文件权限设置

#### 3. **Apple Podcasts 无法识别**
- 验证 RSS Feed 格式
- 检查必需字段是否完整
- 使用验证工具检查

#### 4. **数据库连接失败**
- 检查 D1 数据库配置
- 确认数据库 ID 正确
- 验证数据库权限

### 调试技巧

#### 查看 Worker 日志
```bash
npx wrangler tail
```

#### 测试 API 接口
```bash
# 测试 RSS Feed
curl https://your-worker.workers.dev/api/podcast/feed

# 测试节目列表
curl https://your-worker.workers.dev/api/podcast/episodes
```

#### 检查数据库
```bash
# 查看数据库表
npx wrangler d1 execute podcast-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# 查看节目数据
npx wrangler d1 execute podcast-db --command="SELECT * FROM podcast_episodes;"
```

## 📚 相关资源

- [Apple Podcasts 指南](https://help.apple.com/itc/podcasts_connect/)
- [RSS 2.0 规范](https://cyber.harvard.edu/rss/rss.html)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个播客系统！

## �� 许可证

MIT License 
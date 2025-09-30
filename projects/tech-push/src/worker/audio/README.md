# 音频文件上传服务

这是一个基于 Cloudflare Workers 和 R2 存储的音频文件上传服务，支持按日期自动组织文件路径。

## 功能特性

- ✅ 支持多种音频格式：MP3, WAV, OGG, AAC, M4A
- ✅ 文件大小限制：最大 50MB
- ✅ 按日期自动组织文件路径：`/YYYY/MMDD/filename.mp3`
- ✅ 支持自定义文件名
- ✅ 文件验证和错误处理
- ✅ 文件列表查询
- ✅ 文件删除功能
- ✅ 服务状态监控

## API 端点

### 1. 上传音频文件
```
POST /api/audio/upload
Content-Type: multipart/form-data
```

**请求参数：**
- `file` (必需): 音频文件
- `filename` (可选): 自定义文件名

**响应示例：**
```json
{
  "success": true,
  "path": "/2025/0730/ai-insight.mp3",
  "url": "https://insightcast-bucket.r2.cloudflarestorage.com/2025/0730/ai-insight.mp3",
  "message": "文件上传成功"
}
```

### 2. 获取指定日期的文件列表
```
GET /api/audio/files/{year}/{monthDay}
```

**路径参数：**
- `year`: 年份 (如: 2025)
- `monthDay`: 月日 (如: 0730)

**响应示例：**
```json
{
  "success": true,
  "files": [
    {
      "key": "/2025/0730/ai-insight.mp3",
      "size": 2048576,
      "uploaded": "2025-07-30T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### 3. 删除音频文件
```
DELETE /api/audio/files/{path}
```

**路径参数：**
- `path`: 文件路径 (如: 2025/0730/ai-insight.mp3)

**响应示例：**
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

### 4. 获取服务状态
```
GET /api/audio/status
```

**响应示例：**
```json
{
  "success": true,
  "today": {
    "date": "2025/0730",
    "fileCount": 1,
    "files": [...]
  },
  "service": "Audio Upload Service",
  "status": "running"
}
```

## 文件路径规则

文件按照以下格式自动组织：
```
/{年份}/{月日}/{文件名}
```

例如：
- `/2025/0730/ai-insight.mp3`
- `/2025/0730/morning-news.wav`
- `/2025/0801/podcast-episode.mp3`

## 使用示例

### JavaScript 上传示例
```javascript
async function uploadAudio(file, customFilename = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (customFilename) {
    formData.append('filename', customFilename);
  }
  
  const response = await fetch('/api/audio/upload', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}

// 使用示例
const fileInput = document.getElementById('audioFile');
const file = fileInput.files[0];
const result = await uploadAudio(file, 'my-custom-filename');
```

### cURL 上传示例
```bash
curl -X POST \
  -F "file=@audio.mp3" \
  -F "filename=ai-insight.mp3" \
  https://your-worker.your-subdomain.workers.dev/api/audio/upload
```

### 获取今日文件列表
```bash
curl https://your-worker.your-subdomain.workers.dev/api/audio/files/2025/0730
```

## 配置要求

确保在 `wrangler.json` 中正确配置了 R2 bucket：

```json
{
  "r2_buckets": [
    {
      "binding": "INSIGHTCAST_BUCKET",
      "bucket_name": "insightcast-bucket"
    }
  ]
}
```

## 错误处理

服务会返回详细的错误信息：

```json
{
  "success": false,
  "error": "不支持的文件类型: image/jpeg。支持的类型: audio/mpeg, audio/mp3, audio/wav, audio/ogg, audio/aac, audio/m4a"
}
```

常见错误：
- 文件类型不支持
- 文件大小超过限制 (50MB)
- 文件上传失败
- 网络错误

## 测试页面

访问 `/src/worker/audio/test-upload.html` 可以使用内置的测试页面来测试上传功能。

## 注意事项

1. 确保 R2 bucket 已正确配置并具有适当的权限
2. 文件 URL 需要根据实际的 Cloudflare R2 域名进行调整
3. 建议在生产环境中添加适当的认证和授权机制
4. 可以根据需要调整文件大小限制和允许的文件类型 
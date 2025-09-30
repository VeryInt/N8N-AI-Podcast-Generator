# 🔐 API 认证设置指南

## 📋 设置 API 密钥

### 1. **生成 API 密钥**

```bash
# 生成一个随机的 API 密钥
openssl rand -hex 32
# 输出示例：a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234
```

### 2. **设置 Wrangler Secret**

```bash
# 设置 API 密钥
npx wrangler secret put API_SECRET_KEY

# 输入你生成的 API 密钥
# 例如：a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234
```

### 3. **验证 Secret 设置**

```bash
# 查看已设置的 secrets
npx wrangler secret list

# 应该看到：
# API_SECRET_KEY
```

## 🔧 在 n8n 中使用

### HTTP Request 节点配置

#### 播客 API 示例
```json
{
  "method": "POST",
  "url": "https://your-worker.workers.dev/api/podcast/episodes",
  "sendHeaders": true,
  "headerParameters": {
    "Content-Type": "application/json",
    "X-API-Key": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234"
  },
  "sendBody": true,
  "bodyParameters": {
    "title": "={{ $json.title }}",
    "description": "={{ $json.description }}",
    "audioUrl": "={{ $json.audioUrl }}",
    "audioPath": "={{ $json.audioPath }}"
  }
}
```

#### 音频上传 API 示例
```json
{
  "method": "POST",
  "url": "https://your-worker.workers.dev/api/audio/upload",
  "sendHeaders": true,
  "headerParameters": {
    "X-API-Key": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234"
  },
  "sendBody": true,
  "bodyParameters": {
    "file": "={{ $json.file }}",
    "filename": "={{ $json.filename }}"
  }
}
```

### curl 测试示例

#### 播客 API 测试
```bash
curl -X POST https://your-worker.workers.dev/api/podcast/episodes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234" \
  -d '{
    "title": "测试节目",
    "description": "这是一个测试节目",
    "audioUrl": "https://example.com/test.mp3",
    "audioPath": "/2025/0730/test.mp3"
  }'
```

#### 音频上传 API 测试
```bash
curl -X POST https://your-worker.workers.dev/api/audio/upload \
  -H "X-API-Key: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234" \
  -F "file=@/path/to/audio.mp3" \
  -F "filename=test-audio.mp3"
```

## 🛡️ 安全建议

1. **定期轮换**：定期更换 API 密钥
2. **最小权限**：只给必要的操作设置权限
3. **监控访问**：记录 API 调用日志
4. **HTTPS 传输**：确保所有请求都通过 HTTPS

## 🔍 故障排除

### 问题1：401 Unauthorized
- 检查 API 密钥是否正确
- 确认 Secret 是否设置成功
- 验证请求头格式

### 问题2：Secret 设置失败
```bash
# 重新设置
npx wrangler secret put API_SECRET_KEY
```

### 问题3：测试认证
```bash
# 测试播客 API 认证
curl -X POST https://your-worker.workers.dev/api/podcast/episodes \
  -H "X-API-Key: wrong-key" \
  -d '{"title": "test"}'
# 应该返回 401 Unauthorized

# 测试音频上传 API 认证
curl -X POST https://your-worker.workers.dev/api/audio/upload \
  -H "X-API-Key: wrong-key" \
  -F "file=@test.txt"
# 应该返回 401 Unauthorized
``` 
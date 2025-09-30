# 生产环境配置指南

## 🚀 R2 自定义域名配置

### 1. **为什么使用 R2 自定义域名？**

#### ✅ **优势**
- **更好的性能**: 直接访问，无需经过 Worker
- **更低的延迟**: 减少网络跳转
- **更低的成本**: 不消耗 Worker 计算资源
- **更好的缓存**: 利用 Cloudflare CDN 缓存
- **更高的可用性**: 减少单点故障

#### ❌ **Worker 路由的缺点**
- 每次文件访问都要经过 Worker 处理
- 增加额外的网络延迟
- 消耗 Worker 的计算资源
- 增加带宽成本

### 2. **配置 R2 自定义域名**

#### 步骤1：创建自定义域名
```bash
# 在 Cloudflare Dashboard 中配置
# 或者使用 Wrangler CLI
npx wrangler r2 bucket domain create insightcast-bucket files.yourdomain.com
```

#### 步骤2：更新 wrangler.json 配置
```json
{
  "r2_buckets": [
    {
      "binding": "INSIGHTCAST_BUCKET",
      "bucket_name": "insightcast-bucket",
      "custom_domain": "files.yourdomain.com"
    }
  ]
}
```

#### 步骤3：配置 DNS 记录
在 Cloudflare DNS 中添加 CNAME 记录：
```
Type: CNAME
Name: files
Target: insightcast-bucket.your-account.r2.cloudflarestorage.com
```

### 3. **文件访问方式对比**

#### 生产环境（推荐）
```
直接访问：
https://files.yourdomain.com/2025/0730/encouragement.mp3

优点：
✅ 高性能、低延迟
✅ 利用 CDN 缓存
✅ 不消耗 Worker 资源
✅ 更好的用户体验
```

#### Worker 路由（仅用于特殊需求）
```
通过 Worker：
https://your-worker.workers.dev/protected/2025/0730/encouragement.mp3

适用场景：
🔒 需要认证的文件
💰 付费内容
📊 需要访问统计
🛡️ 需要特殊权限控制
```

### 4. **更新音频上传服务**

#### 修改上传服务配置
```typescript
// src/worker/audio/upload.ts
export class AudioUploadService {
  private bucket: R2Bucket;
  private baseUrl: string;

  constructor(bucket: R2Bucket, baseUrl?: string) {
    this.bucket = bucket;
    // 生产环境使用自定义域名
    this.baseUrl = baseUrl || 'https://files.yourdomain.com';
  }
}
```

#### 环境变量配置
```toml
# wrangler.json (生产环境)
[vars]
R2_BASE_URL = "https://files.yourdomain.com"

# wrangler.dev.toml (开发环境)
[vars]
R2_BASE_URL = "http://localhost:8787"
```

### 5. **部署流程**

#### 开发环境
```bash
# 启动本地开发
npm run dev:full

# 文件访问
http://localhost:8787/2025/0730/test.mp3
```

#### 生产环境
```bash
# 构建和部署
npm run build
npm run deploy

# 文件访问
https://files.yourdomain.com/2025/0730/test.mp3
```

### 6. **安全考虑**

#### 公开文件访问
- 使用 R2 自定义域名直接访问
- 适合公开的音频文件
- 利用 Cloudflare CDN 缓存

#### 受保护文件访问
- 使用 Worker 路由 `/protected/*`
- 添加认证和权限检查
- 记录访问日志

### 7. **性能优化**

#### CDN 缓存配置
```typescript
// 在 R2 自定义域名中配置缓存规则
// 音频文件缓存 1 年
Cache-Control: public, max-age=31536000

// 图片文件缓存 1 个月
Cache-Control: public, max-age=2592000
```

#### 文件压缩
- 启用 Cloudflare 的 Brotli 压缩
- 优化音频文件格式
- 使用适当的文件大小

### 8. **监控和分析**

#### 访问统计
```typescript
// 在 Worker 中添加访问统计
app.get("/api/analytics/file-access", async (c) => {
  // 记录文件访问统计
  // 可以集成 Google Analytics 或其他分析工具
});
```

#### 错误监控
- 监控文件访问错误
- 设置告警机制
- 记录访问日志

### 9. **成本优化**

#### 存储成本
- 选择合适的存储类型
- 定期清理无用文件
- 使用生命周期策略

#### 传输成本
- 利用 CDN 缓存减少传输
- 优化文件大小
- 选择合适的访问方式

### 10. **最佳实践**

1. **域名管理**: 使用专门的子域名管理文件访问
2. **权限控制**: 公开文件使用直接访问，私有文件使用 Worker
3. **缓存策略**: 根据文件类型设置合适的缓存时间
4. **监控告警**: 设置文件访问监控和错误告警
5. **备份策略**: 定期备份重要文件
6. **版本控制**: 考虑文件版本管理策略

## 📚 相关文档

- [Cloudflare R2 自定义域名](https://developers.cloudflare.com/r2/data-access/s3-api/custom-domains/)
- [Cloudflare Workers 最佳实践](https://developers.cloudflare.com/workers/learning/best-practices/)
- [Cloudflare CDN 缓存](https://developers.cloudflare.com/cache/) 
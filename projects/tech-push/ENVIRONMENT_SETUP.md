# 🔐 环境变量和安全配置指南

## 📋 敏感信息管理

### 1. **创建环境变量文件**

创建 `.env` 文件（不要提交到 Git）：

```bash
# .env 文件
D1_DATABASE_ID=your-actual-database-id-here
R2_BASE_URL=https://your-domain.com
WORKER_SECRET=your-worker-secret
```

### 2. **更新 .gitignore**

确保 `.env` 文件不被提交：

```gitignore
# 环境变量文件
.env
.env.local
.env.production

# 其他敏感文件
*.key
*.pem
secrets/
```

### 3. **使用 Wrangler Secrets**

```bash
# 设置 D1 数据库 ID
npx wrangler secret put D1_DATABASE_ID

# 设置其他敏感信息
npx wrangler secret put R2_BASE_URL
npx wrangler secret put WORKER_SECRET
```

### 4. **更新 wrangler.json 配置**

```json
{
  "d1_databases": [
    {
      "binding": "PODCAST_DB",
      "database_name": "podcast-db",
      "database_id": "your-database-id-here"
    }
  ],
  "vars": {
    "R2_BASE_URL": "https://your-domain.com"
  }
}
```

### 5. **创建开发环境配置**

创建 `wrangler.dev.toml` 文件用于本地开发：

```toml
name = "tech-push"
main = "src/worker/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[r2_buckets]]
binding = "INSIGHTCAST_BUCKET"
bucket_name = "insightcast-bucket"

[[d1_databases]]
binding = "PODCAST_DB"
database_name = "podcast-db"
database_id = "your-database-id-here"

[vars]
R2_BASE_URL = "http://localhost:8787"
```

## 🔍 D1 数据库 ID 的作用

### 1. **数据库标识符**
- **唯一标识**：每个 D1 数据库都有唯一的 ID
- **访问控制**：用于识别和访问特定的数据库实例
- **权限管理**：控制谁可以访问和操作数据库

### 2. **与 R2 的区别**

| 服务 | 配置方式 | 原因 |
|------|----------|------|
| **D1 数据库** | 需要 database_id | 数据库是独立资源，需要明确标识 |
| **R2 存储** | 只需要 bucket_name | 存储桶通过名称直接访问 |

### 3. **为什么 D1 需要 ID**

```bash
# D1 数据库操作示例
npx wrangler d1 execute podcast-db --command="SELECT * FROM episodes;"
#                    ^^^^^^^^^^^^^ 这里需要 database_name

# 但创建时需要 ID
npx wrangler d1 create podcast-db
# 返回: Created D1 database 'podcast-db' with ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 🛡️ 安全最佳实践

### 1. **开发环境**

```bash
# 本地开发使用 .env 文件
echo "D1_DATABASE_ID=your-dev-database-id" > .env
```

### 2. **生产环境**

```bash
# 使用 Wrangler Secrets
npx wrangler secret put D1_DATABASE_ID
# 输入: your-production-database-id
```

### 3. **团队协作**

```bash
# 创建示例配置文件
cp .env .env.example
# 编辑 .env.example，移除敏感信息
```

### 4. **CI/CD 集成**

```yaml
# GitHub Actions 示例
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Cloudflare
        env:
          D1_DATABASE_ID: ${{ secrets.D1_DATABASE_ID }}
        run: |
          npx wrangler deploy
```

## 🔧 配置步骤

### 1. **创建 D1 数据库**

```bash
# 创建数据库
npx wrangler d1 create podcast-db

# 输出示例：
# Created D1 database 'podcast-db' with ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 2. **设置环境变量**

```bash
# 方法A：使用 .env 文件
echo "D1_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" > .env

# 方法B：使用 Wrangler Secrets
npx wrangler secret put D1_DATABASE_ID
# 输入: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 3. **应用数据库 Schema**

```bash
# 应用数据库结构
npx wrangler d1 execute podcast-db --file=./schema.sql
```

### 4. **验证配置**

```bash
# 测试数据库连接
npx wrangler d1 execute podcast-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## 📚 相关文档

- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Wrangler Secrets 文档](https://developers.cloudflare.com/workers/wrangler/commands/#secret)
- [环境变量最佳实践](https://developers.cloudflare.com/workers/platform/environment-variables/)

## ⚠️ 安全提醒

1. **永远不要**将 `.env` 文件提交到 Git
2. **定期轮换**敏感信息
3. **使用最小权限**原则
4. **监控访问日志**
5. **备份重要数据** 
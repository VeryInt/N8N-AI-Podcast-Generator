# 页面路由配置说明

这个项目现在支持多个独立的页面路由，每个页面都有自己的入口和样式。

## 📁 文件结构

```
src/react-app/
├── pages/
│   ├── AudioUploadPage.tsx    # 音频上传页面组件
│   └── AudioUploadPage.css    # 页面样式
├── components/
│   ├── AudioUpload.tsx        # 音频上传组件
│   ├── AudioUpload.css        # 组件样式
│   └── README.md             # 组件文档
├── main.tsx                  # 主页面入口
├── main-audio.tsx            # 音频页面入口
├── audio-upload.html         # 音频页面HTML
├── App.tsx                   # 主应用组件
└── App.css                   # 主应用样式
```

## 🚀 页面路由

### 1. 主页面 (首页)
- **URL**: `/`
- **文件**: `index.html`
- **入口**: `main.tsx`
- **组件**: `App.tsx`

### 2. 音频上传页面
- **URL**: `/audio-upload`
- **文件**: `src/react-app/audio-upload.html`
- **入口**: `main-audio.tsx`
- **组件**: `AudioUploadPage.tsx`

## ⚙️ 配置说明

### Vite 配置 (vite.config.ts)

```typescript
export default defineConfig({
  plugins: [react(), cloudflare()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",                    // 主页面
        audio: "src/react-app/audio-upload.html" // 音频页面
      }
    }
  }
});
```

### Worker 路由配置 (src/worker/index.ts)

```typescript
// 页面路由
app.get("/audio-upload", async (c) => {
  // 重定向到构建好的音频上传页面
  return c.redirect("/src/react-app/audio-upload.html");
});

// API路由
app.get("/api/huggingface/dailypapers", async (c) => {
  // API处理逻辑
});

app.route("/api/audio", audioRoutes);
```

## 🎯 路由处理机制

### 1. 静态资源处理
- **优先级**: API路由 > 静态文件
- **自动回退**: 如果API路由不匹配，自动查找静态文件
- **配置**: `wrangler.json` 中的 `assets.directory` 指定静态资源目录

### 2. 页面路由流程
```
用户请求: /audio-upload
├── 1. Worker 检查 API 路由匹配
├── 2. 匹配到 /audio-upload 路由
├── 3. 重定向到 /src/react-app/audio-upload.html
├── 4. 返回构建好的 HTML 文件
└── 5. 浏览器加载对应的 JS/CSS 资源
```

### 3. 资源加载
- **HTML**: `/src/react-app/audio-upload.html`
- **JS**: `/assets/audio-CwLBbvQP.js`
- **CSS**: `/assets/audio-Dm-XmxA9.css`

## 🔧 如何添加新页面

### 1. 创建页面组件
```typescript
// src/react-app/pages/NewPage.tsx
import React from 'react';
import './NewPage.css';

const NewPage: React.FC = () => {
  return (
    <div className="new-page">
      <h1>新页面</h1>
      {/* 页面内容 */}
    </div>
  );
};

export default NewPage;
```

### 2. 创建页面样式
```css
/* src/react-app/pages/NewPage.css */
.new-page {
  /* 页面样式 */
}
```

### 3. 创建页面入口
```typescript
// src/react-app/main-new.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import NewPage from "./pages/NewPage";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NewPage />
  </React.StrictMode>,
);
```

### 4. 创建HTML文件
```html
<!-- src/react-app/new-page.html -->
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>新页面</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/react-app/main-new.tsx"></script>
  </body>
</html>
```

### 5. 更新Vite配置
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        audio: "src/react-app/audio-upload.html",
        new: "src/react-app/new-page.html"  // 添加新页面
      }
    }
  }
});
```

### 6. 添加Worker路由
```typescript
// src/worker/index.ts
app.get("/new-page", async (c) => {
  return c.redirect("/src/react-app/new-page.html");
});
```

## 🎨 样式隔离

每个页面都有自己的CSS文件，确保样式不会相互影响：

- **主页面**: `index.css` + `App.css`
- **音频页面**: `index.css` + `AudioUploadPage.css` + `AudioUpload.css`

## 📱 响应式设计

所有页面都支持响应式设计，适配不同屏幕尺寸：

- **桌面端**: 完整功能展示
- **平板端**: 优化布局
- **移动端**: 触摸友好的交互

## 🚀 部署说明

1. **构建项目**:
   ```bash
   npm run build
   ```

2. **部署到Cloudflare**:
   ```bash
   npm run deploy
   ```

3. **访问页面**:
   - 主页面: `https://your-worker.workers.dev/`
   - 音频页面: `https://your-worker.workers.dev/audio-upload`

## 🔍 调试技巧

1. **检查构建输出**:
   ```bash
   ls -la dist/client/
   ```

2. **查看路由匹配**:
   - 在浏览器开发者工具中查看网络请求
   - 检查重定向是否正确

3. **验证资源加载**:
   - 确保所有JS/CSS文件都能正确加载
   - 检查控制台是否有错误

## 📝 注意事项

1. **文件路径**: 确保HTML文件中的资源路径正确
2. **构建顺序**: 先构建再部署
3. **缓存**: 部署后可能需要清除浏览器缓存
4. **SEO**: 每个页面都有独立的meta标签 
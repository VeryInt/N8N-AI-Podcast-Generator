# React 音频上传组件

这是一个基于 React 的音频文件上传组件，提供了完整的文件上传、管理和预览功能。

## 功能特性

- 🎵 支持多种音频格式：MP3, WAV, OGG, AAC, M4A
- 📁 拖拽上传支持
- 📊 实时上传进度显示
- 📝 自定义文件名
- 📋 文件列表管理
- 🗑️ 文件删除功能
- 📱 响应式设计
- ⚡ 服务状态监控

## 组件结构

```
src/react-app/components/
├── AudioUpload.tsx    # 主组件
├── AudioUpload.css    # 样式文件
└── README.md         # 说明文档
```

## 使用方法

### 1. 导入组件

```tsx
import AudioUpload from './components/AudioUpload';
```

### 2. 在应用中使用

```tsx
function App() {
  return (
    <div>
      <h1>我的应用</h1>
      <AudioUpload />
    </div>
  );
}
```

### 3. 标签页集成

组件已经集成到主应用中，通过标签页切换：

```tsx
const [activeTab, setActiveTab] = useState<'demo' | 'original'>('demo');

return (
  <>
    <div className="tab-container">
      <button 
        className={`tab-btn ${activeTab === 'demo' ? 'active' : ''}`}
        onClick={() => setActiveTab('demo')}
      >
        🎵 音频上传 Demo
      </button>
      <button 
        className={`tab-btn ${activeTab === 'original' ? 'active' : ''}`}
        onClick={() => setActiveTab('original')}
      >
        📝 原始 Demo
      </button>
    </div>

    {activeTab === 'demo' ? (
      <AudioUpload />
    ) : (
      // 原始内容
    )}
  </>
);
```

## API 接口

组件使用以下 API 端点：

- `POST /api/audio/upload` - 上传文件
- `GET /api/audio/files/{year}/{monthDay}` - 获取文件列表
- `DELETE /api/audio/files/{path}` - 删除文件
- `GET /api/audio/status` - 获取服务状态

## 组件状态

组件内部管理以下状态：

```tsx
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [customFilename, setCustomFilename] = useState('');
const [isUploading, setIsUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
const [fileList, setFileList] = useState<UploadedFile[]>([]);
const [serviceStatus, setServiceStatus] = useState<StatusResult | null>(null);
const [isDragOver, setIsDragOver] = useState(false);
```

## 主要功能

### 文件选择
- 点击选择文件按钮
- 拖拽文件到上传区域
- 文件类型和大小验证

### 文件上传
- 支持自定义文件名
- 实时进度显示
- 上传结果反馈

### 文件管理
- 查看今日上传的文件
- 文件详细信息显示
- 删除文件功能

### 服务监控
- 检查服务状态
- 显示今日文件统计
- 错误信息处理

## 样式定制

组件使用独立的 CSS 文件，主要样式类：

- `.audio-upload-container` - 主容器
- `.upload-area` - 上传区域
- `.file-info` - 文件信息
- `.progress-container` - 进度条
- `.file-list` - 文件列表
- `.upload-result` - 上传结果

## 响应式设计

组件支持移动端适配：

- 移动端优化布局
- 触摸友好的交互
- 自适应文件列表显示

## 错误处理

组件包含完整的错误处理：

- 文件类型验证
- 文件大小限制
- 网络错误处理
- 用户友好的错误提示

## 开发说明

### 依赖要求
- React 18+
- TypeScript
- 现代浏览器支持

### 开发环境
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 测试
组件包含完整的用户交互测试场景：
- 文件选择和验证
- 上传流程测试
- 文件管理操作
- 错误情况处理 
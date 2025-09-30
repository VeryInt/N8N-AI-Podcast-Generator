import React, { useState, useRef, useCallback } from 'react';
import './AudioUpload.css';

interface UploadedFile {
  key: string;
  size: number;
  uploaded: string;
}

interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
  message?: string;
}

interface FileListResult {
  success: boolean;
  files?: UploadedFile[];
  count?: number;
  error?: string;
}

interface StatusResult {
  success: boolean;
  today?: {
    date: string;
    fileCount: number;
    files: UploadedFile[];
  };
  service?: string;
  status?: string;
  error?: string;
}

const AudioUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFilename, setCustomFilename] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [fileList, setFileList] = useState<UploadedFile[]>([]);
  const [serviceStatus, setServiceStatus] = useState<StatusResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = '/api/audio';

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 处理文件选择
  const handleFileSelect = (file: File) => {
    // 验证文件类型
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a'];
    if (!allowedTypes.includes(file.type)) {
      alert(`不支持的文件类型: ${file.type}`);
      return;
    }

    // 验证文件大小 (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`文件大小超过限制: ${formatFileSize(file.size)}。最大允许: 50MB`);
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
  };

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  // 上传文件
  const uploadFile = async () => {
    if (!selectedFile) {
      alert('请先选择文件');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (customFilename) {
        formData.append('filename', customFilename);
      }

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return 90;
          return prev + Math.random() * 20;
        });
      }, 200);

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result: UploadResult = await response.json();

      if (result.success) {
        setUploadResult(result);
        // 清空表单
        setSelectedFile(null);
        setCustomFilename('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // 刷新文件列表
        await loadTodayFiles();
      } else {
        setUploadResult(result);
      }

    } catch (error) {
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // 加载今日文件列表
  const loadTodayFiles = async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const monthDay = String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
      
      const response = await fetch(`${API_BASE}/files/${year}/${monthDay}`);
      const result: FileListResult = await response.json();
      
      if (result.success) {
        setFileList(result.files || []);
      } else {
        console.error('获取文件列表失败:', result.error);
      }
    } catch (error) {
      console.error('请求失败:', error);
    }
  };

  // 检查服务状态
  const checkServiceStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/status`);
      const result: StatusResult = await response.json();
      setServiceStatus(result);
    } catch (error) {
      setServiceStatus({
        success: false,
        error: error instanceof Error ? error.message : '请求失败'
      });
    }
  };

  // 删除文件
  const deleteFile = async (filePath: string) => {
    if (!confirm('确定要删除这个文件吗？')) return;

    try {
      const response = await fetch(`${API_BASE}/files/${filePath}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        alert('文件删除成功');
        await loadTodayFiles();
      } else {
        alert(`删除失败: ${result.error}`);
      }
    } catch (error) {
      alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <div className="audio-upload-container">
      <h2>🎵 音频文件上传</h2>
      
      {/* 服务状态 */}
      <div className="status-section">
        <button 
          className="status-btn"
          onClick={checkServiceStatus}
        >
          检查服务状态
        </button>
        {serviceStatus && (
          <div className={`status-result ${serviceStatus.success ? 'success' : 'error'}`}>
            {serviceStatus.success ? (
              <>
                <p><strong>服务状态:</strong> {serviceStatus.status}</p>
                <p><strong>今日文件数:</strong> {serviceStatus.today?.fileCount || 0}</p>
                <p><strong>今日日期:</strong> {serviceStatus.today?.date}</p>
              </>
            ) : (
              <p>获取状态失败: {serviceStatus.error}</p>
            )}
          </div>
        )}
      </div>

      {/* 文件上传区域 */}
      <div 
        className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <h3>选择音频文件</h3>
          <p>支持格式: MP3, WAV, OGG, AAC, M4A (最大50MB)</p>
          <p>拖拽文件到此处或点击选择文件</p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            style={{ display: 'none' }}
          />
          
          <button 
            className="select-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            选择文件
          </button>
        </div>
      </div>

      {/* 文件信息 */}
      {selectedFile && (
        <div className="file-info">
          <h4>已选择文件:</h4>
          <p><strong>文件名:</strong> {selectedFile.name}</p>
          <p><strong>文件大小:</strong> {formatFileSize(selectedFile.size)}</p>
          <p><strong>文件类型:</strong> {selectedFile.type}</p>
          
          <div className="filename-input">
            <label htmlFor="customFilename">自定义文件名 (可选):</label>
            <input
              id="customFilename"
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="留空使用原文件名"
              disabled={isUploading}
            />
          </div>
          
          <button 
            className="upload-btn"
            onClick={uploadFile}
            disabled={isUploading}
          >
            {isUploading ? '上传中...' : '上传文件'}
          </button>
        </div>
      )}

      {/* 上传进度 */}
      {isUploading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p>{Math.round(uploadProgress)}%</p>
        </div>
      )}

      {/* 上传结果 */}
      {uploadResult && (
        <div className={`upload-result ${uploadResult.success ? 'success' : 'error'}`}>
          {uploadResult.success ? (
            <>
              <h4>✅ 上传成功!</h4>
              <p><strong>文件路径:</strong> {uploadResult.path}</p>
              <p><strong>访问URL:</strong> 
                <a href={uploadResult.url} target="_blank" rel="noopener noreferrer">
                  {uploadResult.url}
                </a>
              </p>
            </>
          ) : (
            <>
              <h4>❌ 上传失败</h4>
              <p>{uploadResult.error}</p>
            </>
          )}
        </div>
      )}

      {/* 文件列表 */}
      <div className="file-list-section">
        <div className="file-list-header">
          <h3>今日文件列表</h3>
          <button 
            className="refresh-btn"
            onClick={loadTodayFiles}
          >
            刷新列表
          </button>
        </div>
        
        {fileList.length > 0 ? (
          <div className="file-list">
            {fileList.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-details">
                  <p><strong>文件:</strong> {file.key}</p>
                  <p><strong>大小:</strong> {formatFileSize(file.size)}</p>
                  <p><strong>上传时间:</strong> {new Date(file.uploaded).toLocaleString()}</p>
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => deleteFile(file.key.replace(/^\//, ''))}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-files">今日暂无文件</p>
        )}
      </div>
    </div>
  );
};

export default AudioUpload; 
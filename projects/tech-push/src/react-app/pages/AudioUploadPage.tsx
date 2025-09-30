import React from 'react';
import AudioUpload from '../components/AudioUpload';
import './AudioUploadPage.css';

const AudioUploadPage: React.FC = () => {
  return (
    <div className="audio-upload-page">
      <header className="page-header">
        <div className="header-content">
          <h1>🎵 音频文件管理平台</h1>
          <p>上传、管理和分享你的音频文件</p>
        </div>
      </header>
      
      <main className="page-main">
        <AudioUpload />
      </main>
      
      <footer className="page-footer">
        <div className="footer-content">
          <p>© 2025 音频文件管理平台 | 基于 Cloudflare Workers + R2 存储</p>
          <div className="footer-links">
            <a href="/" className="footer-link">返回首页</a>
            <a href="/api/audio/status" className="footer-link" target="_blank">API 状态</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AudioUploadPage; 
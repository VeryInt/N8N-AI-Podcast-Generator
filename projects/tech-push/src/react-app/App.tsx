// src/App.tsx

import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import cloudflareLogo from "./assets/Cloudflare_Logo.svg";
import honoLogo from "./assets/hono.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("unknown");

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://hono.dev/" target="_blank">
          <img src={honoLogo} className="logo cloudflare" alt="Hono logo" />
        </a>
        <a href="https://workers.cloudflare.com/" target="_blank">
          <img
            src={cloudflareLogo}
            className="logo cloudflare"
            alt="Cloudflare logo"
          />
        </a>
      </div>
      <h1>Vite + React + Hono + Cloudflare</h1>
      
      <div className="card">
        <button
          onClick={() => setCount((count) => count + 1)}
          aria-label="increment"
        >
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      
      <div className="card">
        <button
          onClick={() => {
            fetch("/api/")
              .then((res) => res.json() as Promise<{ name: string }>)
              .then((data) => setName(data.name));
          }}
          aria-label="get name"
        >
          Name from API is: {name}
        </button>
        <p>
          Edit <code>worker/index.ts</code> to change the name
        </p>
      </div>

      {/* 功能链接 */}
      <div className="feature-links">
        <h3>🚀 功能页面</h3>
        <div className="link-grid">
          <a href="/audio-upload" className="feature-link">
            <div className="feature-icon">🎵</div>
            <div className="feature-content">
              <h4>音频文件管理</h4>
              <p>上传、管理和分享音频文件</p>
            </div>
          </a>
          <a href="/podcast-admin" className="feature-link">
            <div className="feature-icon">🎙️</div>
            <div className="feature-content">
              <h4>播客管理</h4>
              <p>创建和管理播客节目，生成 RSS Feed</p>
            </div>
          </a>
          <a href="/api/audio/status" className="feature-link" target="_blank">
            <div className="feature-icon">📊</div>
            <div className="feature-content">
              <h4>API 状态</h4>
              <p>查看服务运行状态</p>
            </div>
          </a>
        </div>
      </div>
      
      <p className="read-the-docs">Click on the logos to learn more</p>
    </>
  );
}

export default App;

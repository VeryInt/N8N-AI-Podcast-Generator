import React, { useState, useEffect } from 'react';
import './PodcastPage.css';

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  content?: string;
  audio_url: string;
  audio_path: string;
  duration?: number;
  file_size?: number;
  publish_date: string;
  author?: string;
  keywords?: string[];
  image_url?: string;
  explicit?: boolean;
  season?: number;
  episode?: number;
  created_at: string;
  updated_at: string;
}

interface PodcastChannel {
  id: string;
  title: string;
  description: string;
  language: string;
  author: string;
  email: string;
  category: string;
  subcategory?: string;
  image_url: string;
  website_url?: string;
  explicit: boolean;
  created_at: string;
  updated_at: string;
}

const PodcastPage: React.FC = () => {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [channel, setChannel] = useState<PodcastChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showChannelForm, setShowChannelForm] = useState(false);

  // 新节目表单状态
  const [newEpisode, setNewEpisode] = useState({
    title: '',
    description: '',
    content: '',
    audio_url: '',
    audio_path: '',
    duration: '',
    file_size: '',
    author: '',
    keywords: '',
    image_url: '',
    explicit: false,
    season: '',
    episode: ''
  });

  // 频道信息表单状态
  const [channelForm, setChannelForm] = useState({
    title: '',
    description: '',
    language: 'zh-CN',
    author: '',
    email: '',
    category: '',
    subcategory: '',
    image_url: '',
    website_url: '',
    explicit: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [episodesRes, channelRes] = await Promise.all([
        fetch('/api/podcast/episodes', {
          headers: {
            'X-API-Key': '1234567890'
          }
        }),
        fetch('/api/podcast/channel', {
          headers: {
            'X-API-Key': '1234567890'
          }
        })
      ]);

      if (episodesRes.ok) {
        const episodesData = await episodesRes.json();
        setEpisodes(episodesData.episodes || []);
      }

      if (channelRes.ok) {
        const channelData = await channelRes.json();
        setChannel(channelData.channel);
        // 填充频道表单
        setChannelForm({
          title: channelData.channel.title,
          description: channelData.channel.description,
          language: channelData.channel.language,
          author: channelData.channel.author,
          email: channelData.channel.email,
          category: channelData.channel.category,
          subcategory: channelData.channel.subcategory || '',
          image_url: channelData.channel.image_url || '',
          website_url: channelData.channel.website_url || '',
          explicit: channelData.channel.explicit
        });
      }
    } catch (err) {
      setError('加载数据失败');
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const episodeData = {
        ...newEpisode,
        duration: newEpisode.duration ? parseInt(newEpisode.duration) : undefined,
        file_size: newEpisode.file_size ? parseInt(newEpisode.file_size) : undefined,
        season: newEpisode.season ? parseInt(newEpisode.season) : undefined,
        episode: newEpisode.episode ? parseInt(newEpisode.episode) : undefined,
        keywords: newEpisode.keywords ? newEpisode.keywords.split(',').map(k => k.trim()) : undefined
      };

      const response = await fetch('/api/podcast/episodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '1234567890'
        },
        body: JSON.stringify(episodeData)
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewEpisode({
          title: '', description: '', content: '', audio_url: '', audio_path: '',
          duration: '', file_size: '', author: '', keywords: '', image_url: '',
          explicit: false, season: '', episode: ''
        });
        loadData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || '创建节目失败');
      }
    } catch (err) {
      setError('创建节目失败');
      console.error('创建节目失败:', err);
    }
  };

  const handleUpdateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/podcast/channel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '1234567890'
        },
        body: JSON.stringify(channelForm)
      });

      if (response.ok) {
        setShowChannelForm(false);
        loadData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || '更新频道信息失败');
      }
    } catch (err) {
      setError('更新频道信息失败');
      console.error('更新频道信息失败:', err);
    }
  };

  const handleDeleteEpisode = async (id: string) => {
    if (!confirm('确定要删除这个节目吗？')) return;

    try {
      const response = await fetch(`/api/podcast/episodes/${id}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': '1234567890'
        }
      });

      if (response.ok) {
        loadData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || '删除节目失败');
      }
    } catch (err) {
      setError('删除节目失败');
      console.error('删除节目失败:', err);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '未知';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '未知';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return <div className="podcast-page loading">加载中...</div>;
  }

  return (
    <div className="podcast-page">
      <header className="podcast-header">
        <h1>🎙️ 播客管理</h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            ➕ 新建节目
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowChannelForm(true)}
          >
            ⚙️ 频道设置
          </button>
          <a 
            href="/api/podcast/feed" 
            target="_blank" 
            className="btn btn-outline"
          >
            📡 RSS Feed
          </a>
        </div>
      </header>

      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* 频道信息 */}
      {channel && (
        <div className="channel-info">
          <h2>📻 频道信息</h2>
          <div className="channel-details">
            <div className="channel-image">
              <img src={channel.image_url || '/default-podcast-image.jpg'} alt="频道封面" />
            </div>
            <div className="channel-text">
              <h3>{channel.title}</h3>
              <p>{channel.description}</p>
              <div className="channel-meta">
                <span>👤 {channel.author}</span>
                <span>📧 {channel.email}</span>
                <span>🏷️ {channel.category}</span>
                <span>🌐 {channel.language}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 节目列表 */}
      <div className="episodes-section">
        <h2>📝 节目列表 ({episodes.length})</h2>
        
        {episodes.length === 0 ? (
          <div className="empty-state">
            <p>还没有节目，点击"新建节目"开始创建吧！</p>
          </div>
        ) : (
          <div className="episodes-grid">
            {episodes.map(episode => (
              <div key={episode.id} className="episode-card">
                <div className="episode-image">
                  <img 
                    src={episode.image_url || channel?.image_url || '/default-episode-image.jpg'} 
                    alt={episode.title} 
                  />
                </div>
                <div className="episode-content">
                  <h3>{episode.title}</h3>
                  <p className="episode-description">{episode.description}</p>
                  <div className="episode-meta">
                    <span>⏱️ {formatDuration(episode.duration)}</span>
                    <span>📦 {formatFileSize(episode.file_size)}</span>
                    <span>📅 {new Date(episode.publish_date).toLocaleDateString()}</span>
                  </div>
                  <div className="episode-actions">
                    <a href={episode.audio_url} target="_blank" className="btn btn-small">
                      🎵 播放
                    </a>
                    <button 
                      onClick={() => handleDeleteEpisode(episode.id)}
                      className="btn btn-small btn-danger"
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新建节目表单 */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>新建节目</h3>
              <button onClick={() => setShowCreateForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateEpisode} className="episode-form">
              <div className="form-group">
                <label>标题 *</label>
                <input
                  type="text"
                  value={newEpisode.title}
                  onChange={(e) => setNewEpisode({...newEpisode, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>描述 *</label>
                <textarea
                  value={newEpisode.description}
                  onChange={(e) => setNewEpisode({...newEpisode, description: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>详细内容</label>
                <textarea
                  value={newEpisode.content}
                  onChange={(e) => setNewEpisode({...newEpisode, content: e.target.value})}
                  rows={4}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>音频URL *</label>
                  <input
                    type="url"
                    value={newEpisode.audio_url}
                    onChange={(e) => setNewEpisode({...newEpisode, audio_url: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>音频路径 *</label>
                  <input
                    type="text"
                    value={newEpisode.audio_path}
                    onChange={(e) => setNewEpisode({...newEpisode, audio_path: e.target.value})}
                    placeholder="/2025/0730/episode.mp3"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>时长（秒）</label>
                  <input
                    type="number"
                    value={newEpisode.duration}
                    onChange={(e) => setNewEpisode({...newEpisode, duration: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>文件大小（字节）</label>
                  <input
                    type="number"
                    value={newEpisode.file_size}
                    onChange={(e) => setNewEpisode({...newEpisode, file_size: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>作者</label>
                  <input
                    type="text"
                    value={newEpisode.author}
                    onChange={(e) => setNewEpisode({...newEpisode, author: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>关键词（逗号分隔）</label>
                  <input
                    type="text"
                    value={newEpisode.keywords}
                    onChange={(e) => setNewEpisode({...newEpisode, keywords: e.target.value})}
                    placeholder="技术,编程,AI"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>封面图片URL</label>
                  <input
                    type="url"
                    value={newEpisode.image_url}
                    onChange={(e) => setNewEpisode({...newEpisode, image_url: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newEpisode.explicit}
                      onChange={(e) => setNewEpisode({...newEpisode, explicit: e.target.checked})}
                    />
                    包含成人内容
                  </label>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>季数</label>
                  <input
                    type="number"
                    value={newEpisode.season}
                    onChange={(e) => setNewEpisode({...newEpisode, season: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>集数</label>
                  <input
                    type="number"
                    value={newEpisode.episode}
                    onChange={(e) => setNewEpisode({...newEpisode, episode: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  创建节目
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 频道设置表单 */}
      {showChannelForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>频道设置</h3>
              <button onClick={() => setShowChannelForm(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateChannel} className="channel-form">
              <div className="form-group">
                <label>频道标题 *</label>
                <input
                  type="text"
                  value={channelForm.title}
                  onChange={(e) => setChannelForm({...channelForm, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>频道描述 *</label>
                <textarea
                  value={channelForm.description}
                  onChange={(e) => setChannelForm({...channelForm, description: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>作者 *</label>
                  <input
                    type="text"
                    value={channelForm.author}
                    onChange={(e) => setChannelForm({...channelForm, author: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>邮箱 *</label>
                  <input
                    type="email"
                    value={channelForm.email}
                    onChange={(e) => setChannelForm({...channelForm, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>分类 *</label>
                  <select
                    value={channelForm.category}
                    onChange={(e) => setChannelForm({...channelForm, category: e.target.value})}
                    required
                  >
                    <option value="">选择分类</option>
                    <option value="Technology">技术</option>
                    <option value="Business">商业</option>
                    <option value="Education">教育</option>
                    <option value="Entertainment">娱乐</option>
                    <option value="News">新闻</option>
                    <option value="Sports">体育</option>
                    <option value="Health">健康</option>
                    <option value="Science">科学</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>语言 *</label>
                  <select
                    value={channelForm.language}
                    onChange={(e) => setChannelForm({...channelForm, language: e.target.value})}
                    required
                  >
                    <option value="zh-CN">中文（简体）</option>
                    <option value="zh-TW">中文（繁体）</option>
                    <option value="en-US">English</option>
                    <option value="ja-JP">日本語</option>
                    <option value="ko-KR">한국어</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>封面图片URL</label>
                <input
                  type="url"
                  value={channelForm.image_url}
                  onChange={(e) => setChannelForm({...channelForm, image_url: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>网站URL</label>
                <input
                  type="url"
                  value={channelForm.website_url}
                  onChange={(e) => setChannelForm({...channelForm, website_url: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={channelForm.explicit}
                    onChange={(e) => setChannelForm({...channelForm, explicit: e.target.checked})}
                  />
                  包含成人内容
                </label>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowChannelForm(false)} className="btn btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存设置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastPage; 
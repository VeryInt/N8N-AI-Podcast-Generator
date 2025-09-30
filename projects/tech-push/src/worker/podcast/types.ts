// 播客节目类型定义
export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  content?: string; // 详细内容（可选）
  audio_url: string;
  audio_path: string; // R2 中的文件路径
  duration?: number; // 音频时长（秒）
  file_size?: number; // 文件大小（字节）
  publish_date: string; // ISO 日期字符串
  author?: string;
  keywords?: string | string[];
  image_url?: string; // 封面图片
  explicit?: boolean; // 是否包含成人内容
  season?: number;
  episode?: number;
  created_at: string;
  updated_at: string;
}

// 播客频道信息
export interface PodcastChannel {
  id: string;
  title: string;
  description: string;
  language: string; // 语言代码，如 'zh-CN'
  author: string;
  email: string;
  category: string; // 播客分类
  subcategory?: string;
  image_url: string; // 频道封面
  website_url?: string;
  explicit: boolean;
  created_at: string;
  updated_at: string;
}

// XML Feed 生成选项
export interface PodcastFeedOptions {
  channel: PodcastChannel;
  episodes: PodcastEpisode[];
  baseUrl: string; // 你的 Worker 域名
} 
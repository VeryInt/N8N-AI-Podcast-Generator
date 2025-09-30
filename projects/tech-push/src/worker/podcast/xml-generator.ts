import { PodcastChannel, PodcastEpisode, PodcastFeedOptions } from './types';

export class PodcastXmlGenerator {
  /**
   * 生成符合 Apple Podcasts 标准的 RSS XML
   */
  static generateRssFeed(options: PodcastFeedOptions): string {
    const { channel, episodes, baseUrl } = options;
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${this.escapeXml(channel.title)}</title>
    <description>${this.escapeXml(channel.description)}</description>
    <link>${baseUrl}/podcast</link>
    <language>${channel.language}</language>
    <itunes:author>${this.escapeXml(channel.author)}</itunes:author>
    <itunes:category text="${this.escapeXml(channel.category)}">
      ${channel.subcategory ? `<itunes:category text="${this.escapeXml(channel.subcategory)}" />` : ''}
    </itunes:category>
    <itunes:explicit>${channel.explicit ? 'yes' : 'no'}</itunes:explicit>
    <itunes:image href="${channel.image_url}" />
    ${channel.website_url ? `<itunes:owner>
      <itunes:name>${this.escapeXml(channel.author)}</itunes:name>
      <itunes:email>${channel.email}</itunes:email>
    </itunes:owner>` : ''}
    <atom:link href="${baseUrl}/podcast" rel="self" type="application/rss+xml" />
    
    ${episodes.map(episode => this.generateEpisodeXml(episode, baseUrl)).join('\n    ')}
  </channel>
</rss>`;

    return xml;
  }

  /**
   * 生成单个节目的 XML
   */
  private static generateEpisodeXml(episode: PodcastEpisode, baseUrl: string): string {
    const duration = episode.duration ? this.formatDuration(episode.duration) : '';
    const file_size = episode.file_size ? episode.file_size.toString() : '';
    const keywords = this.parseKeywords(episode.keywords as string);
    const audio_url = episode.audio_url.replace(/\/$/, '') + '/' + episode.audio_path.replace(/^\//, '');
    return `<item>
      <title>${this.escapeXml(episode.title)}</title>
      <description>${this.escapeXml(episode.description)}</description>
      ${episode.content ? `<content:encoded><![CDATA[${episode.content}]]></content:encoded>` : ''}
      <link>${baseUrl}/api/podcast/episodes/${episode.id}</link>
      <guid isPermaLink="false">${episode.id}</guid>
      <pubDate>${this.formatDate(episode.publish_date)}</pubDate>
      <enclosure url="${audio_url}" length="${file_size}" type="audio/mpeg" />
      <itunes:duration>${duration}</itunes:duration>
      <itunes:explicit>${episode.explicit ? 'yes' : 'no'}</itunes:explicit>
      ${episode.author ? `<itunes:author>${this.escapeXml(episode.author)}</itunes:author>` : ''}
      ${episode.image_url ? `<itunes:image href="${episode.image_url}" />` : ''}
      ${keywords && keywords.length > 0 ? `<itunes:keywords>${keywords.join(',')}</itunes:keywords>` : ''}
      ${episode.season ? `<itunes:season>${episode.season}</itunes:season>` : ''}
      ${episode.episode ? `<itunes:episode>${episode.episode}</itunes:episode>` : ''}
    </item>`;
  }

  /**
   * 转义 XML 特殊字符
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 格式化日期为 RSS 标准格式
   */
  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toUTCString();
  }

  /**
   * 格式化音频时长为 HH:MM:SS 格式
   */
  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }

  private static parseKeywords(keywords: string) {
    if (!keywords) return [];
    try {
      return JSON.parse(keywords);
    } catch (error) {
      return [];
    }
  }
} 
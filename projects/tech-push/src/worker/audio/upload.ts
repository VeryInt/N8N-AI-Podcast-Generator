interface AudioUploadRequest {
  file: File;
  filename?: string;
}

interface Env {
  INSIGHTCAST_BUCKET: R2Bucket;
}

export class AudioUploadService {
  private bucket: R2Bucket;
  private baseUrl: string;

  constructor(bucket: R2Bucket, baseUrl?: string) {
    this.bucket = bucket;
    this.baseUrl = baseUrl || 'https://insightcast-bucket.r2.cloudflarestorage.com/';
  }

  /**
   * 生成基于日期的文件路径
   * 格式: /YYYY/MMDD/filename.mp3
   */
  private generateDateBasedPath(filename: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 确保文件名有扩展名
    const extension = filename.includes('.') ? '' : '.mp3';
    const finalFilename = filename.includes('.') ? filename : `${filename}${extension}`;
    
    return `${year}/${month}${day}/${finalFilename}`;
  }

  /**
   * 验证音频文件
   */
  private validateAudioFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/m4a'
    ];

    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `不支持的文件类型: ${file.type}。支持的类型: ${allowedTypes.join(', ')}`
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `文件大小超过限制: ${file.size} bytes。最大允许: ${maxSize} bytes`
      };
    }

    return { valid: true };
  }

  /**
   * 上传音频文件到R2
   */
  async uploadAudio(file: File, customFilename?: string): Promise<{
    success: boolean;
    path?: string;
    error?: string;
    url?: string;
    baseUrl?: string;
  }> {
    try {
      // 验证文件
      const validation = this.validateAudioFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // 生成文件路径
      const filename = customFilename || file.name;
      const filePath = this.generateDateBasedPath(filename);

      // 上传到R2
      await this.bucket.put(filePath, file.stream(), {
        httpMetadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000', // 1年缓存
        },
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size.toString(),
        }
      });

      // 生成访问URL
      // 生产环境建议使用 R2 自定义域名，这里提供配置选项
      const url = `${this.baseUrl}${filePath}`;
      
      // 如果配置了自定义域名，可以使用：
      // const url = `https://files.yourdomain.com${filePath}`;

      return {
        success: true,
        path: filePath,
        url: url,
        baseUrl: this.baseUrl,
      };

    } catch (error) {
      console.error('上传音频文件失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取指定日期的文件列表
   */
  async listFilesByDate(year: string, monthDay: string): Promise<{
    success: boolean;
    files?: Array<{ key: string; size: number; uploaded: string }>;
    error?: string;
  }> {
    try {
      const prefix = `${year}/${monthDay}/`;
      const objects = await this.bucket.list({ prefix });

      const files = objects.objects.map(obj => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString()
      }));

      return {
        success: true,
        files
      };

    } catch (error) {
      console.error('获取文件列表失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 删除音频文件
   */
  async deleteAudio(filePath: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.bucket.delete(filePath);
      return { success: true };
    } catch (error) {
      console.error('删除音频文件失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
} 
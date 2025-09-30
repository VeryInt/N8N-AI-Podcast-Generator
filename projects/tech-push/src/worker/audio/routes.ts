import { Hono } from "hono";
import { AudioUploadService } from "./upload";
import { authenticateApiKey } from "../middleware/auth";

interface Env {
  INSIGHTCAST_BUCKET: R2Bucket;
  ENVIRONMENT?: string;
  R2_BASE_URL?: string;
  API_SECRET_KEY?: string;
}

export const audioRoutes = new Hono<{ Bindings: Env }>();

// 上传音频文件（需要认证）
audioRoutes.post("/upload", authenticateApiKey, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const customFilename = formData.get("filename") as string | null;

    if (!file) {
      return c.json({
        success: false,
        error: "未找到文件"
      }, 400);
    }

    const baseUrl = c.env.R2_BASE_URL || 'https://insightcast-bucket.r2.cloudflarestorage.com';
    const audioService = new AudioUploadService(c.env.INSIGHTCAST_BUCKET, baseUrl);
    const result = await audioService.uploadAudio(file, customFilename || undefined);

    if (result.success) {
      return c.json({
        success: true,
        path: result.path,
        url: result.url,
        baseUrl: result.baseUrl,
        message: "文件上传成功"
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }

  } catch (error) {
    console.error("处理上传请求失败:", error);
    return c.json({
      success: false,
      error: "服务器内部错误"
    }, 500);
  }
});

// 获取指定日期的文件列表
audioRoutes.get("/files/:year/:monthDay", async (c) => {
  try {
    const year = c.req.param("year");
    const monthDay = c.req.param("monthDay");

    if (!year || !monthDay) {
      return c.json({
        success: false,
        error: "年份和日期参数是必需的"
      }, 400);
    }

    const baseUrl = c.env.R2_BASE_URL || 'https://insightcast-bucket.r2.cloudflarestorage.com';
    const audioService = new AudioUploadService(c.env.INSIGHTCAST_BUCKET, baseUrl);
    const result = await audioService.listFilesByDate(year, monthDay);

    if (result.success) {
      return c.json({
        success: true,
        files: result.files,
        count: result.files?.length || 0
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }

  } catch (error) {
    console.error("获取文件列表失败:", error);
    return c.json({
      success: false,
      error: "服务器内部错误"
    }, 500);
  }
});

// 删除音频文件（需要认证）
audioRoutes.delete("/files/:path", authenticateApiKey, async (c) => {
  try {
    const filePath = c.req.param("path");
    
    if (!filePath) {
      return c.json({
        success: false,
        error: "文件路径参数是必需的"
      }, 400);
    }

    const baseUrl = c.env.R2_BASE_URL || 'https://insightcast-bucket.r2.cloudflarestorage.com';
    const audioService = new AudioUploadService(c.env.INSIGHTCAST_BUCKET, baseUrl);
    const result = await audioService.deleteAudio(`/${filePath}`);

    if (result.success) {
      return c.json({
        success: true,
        message: "文件删除成功"
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }

  } catch (error) {
    console.error("删除文件失败:", error);
    return c.json({
      success: false,
      error: "服务器内部错误"
    }, 500);
  }
});

// 获取上传状态信息
audioRoutes.get("/status", async (c) => {
  try {
    const baseUrl = c.env.R2_BASE_URL || 'https://insightcast-bucket.r2.cloudflarestorage.com';
    const audioService = new AudioUploadService(c.env.INSIGHTCAST_BUCKET, baseUrl);
    
    // 获取今天的文件列表作为状态信息
    const today = new Date();
    const year = today.getFullYear().toString();
    const monthDay = String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
    
    const result = await audioService.listFilesByDate(year, monthDay);
    
    return c.json({
      success: true,
      today: {
        date: `${year}/${monthDay}`,
        fileCount: result.files?.length || 0,
        files: result.files || []
      },
      service: "Audio Upload Service",
      status: "running"
    });

  } catch (error) {
    console.error("获取状态失败:", error);
    return c.json({
      success: false,
      error: "服务器内部错误"
    }, 500);
  }
}); 
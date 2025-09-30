import { Hono } from "hono";
import { audioRoutes } from "./audio/routes";
import { podcastRoutes, podcastFeed } from "./podcast/routes";
import { huggingFaceRoutes } from "./huggingface/routes";

// 根据文件扩展名获取 Content-Type
function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    case 'aac':
      return 'audio/aac';
    case 'm4a':
      return 'audio/mp4';
    default:
      return 'application/octet-stream';
  }
}

interface Env {
  INSIGHTCAST_BUCKET: R2Bucket;
  PODCAST_DB: D1Database;
  API_SECRET_KEY?: string;
}

const app = new Hono<{ Bindings: Env }>();

// podcast feed
app.get("/podcast", podcastFeed);

// 页面路由 - 重定向到构建好的HTML文件
app.get("/audio-upload", async (c) => {
  // 重定向到构建好的音频上传页面
  return c.redirect("/src/react-app/audio-upload.html");
});

app.get("/podcast-admin", async (c) => {
  // 重定向到构建好的播客管理页面
  return c.redirect("/src/react-app/podcast.html");
});

// API路由
app.route("/api/huggingface", huggingFaceRoutes);

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// 可选：保留用于特殊需求的受保护文件访问路由
// 例如：需要认证、付费内容、访问统计等
app.get("/protected/:year/:monthDay/:filename", async (c) => {
  try {
    const year = c.req.param("year");
    const monthDay = c.req.param("monthDay");
    const filename = c.req.param("filename");
    
    if (!year || !monthDay || !filename) {
      return c.text("Invalid file path", 400);
    }
    
    // 这里可以添加认证逻辑
    // const isAuthorized = await checkAuthorization(c);
    // if (!isAuthorized) return c.text("Unauthorized", 401);
    
    const filePath = `/${year}/${monthDay}/${filename}`;
    const object = await c.env.INSIGHTCAST_BUCKET.get(filePath);
    
    if (!object) {
      return c.text(`File not found: ${filePath}`, 404);
    }
    
    const contentType = getContentType(filename);
    
    return new Response(object.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error serving protected file:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.text(`Internal server error: ${errorMessage}`, 500);
  }
});

// 音频上传相关路由
app.route("/api/audio", audioRoutes);

// 播客相关路由
app.route("/api/podcast", podcastRoutes);

export default app;


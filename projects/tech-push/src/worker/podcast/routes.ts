import { Hono, Context } from "hono";
import { PodcastXmlGenerator } from "./xml-generator";
import { PodcastChannel, PodcastEpisode } from "./types";
import { authenticateApiKey } from "../middleware/auth";

interface Env {
  INSIGHTCAST_BUCKET: R2Bucket;
  PODCAST_DB: D1Database;
  R2_BASE_URL?: string;
  API_SECRET_KEY?: string;
}

export const podcastRoutes = new Hono<{ Bindings: Env }>();



export const podcastFeed = async (c: Context) => {
  try {
    // 从数据库获取频道信息和节目列表
    const channel = await getChannelInfo(c.env.PODCAST_DB);
    const episodes = await getEpisodes(c.env.PODCAST_DB);
    
    if (!channel) {
      return c.json({ error: "频道信息未找到" }, 404);
    }

    // const baseUrl = c.req.url.replace('/feed', '');
    const host = c.req.header('host');
    const protocol = c.req.header('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;
    const xml = PodcastXmlGenerator.generateRssFeed({
      channel,
      episodes,
      baseUrl
    });

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600' // 1小时缓存
      }
    });

  } catch (error) {
    console.error("生成 RSS Feed 失败:", error);
    return c.json({ error: "服务器内部错误" }, 500);
  }
}

// 获取 RSS Feed XML
podcastRoutes.get("/feed", podcastFeed);


// 创建新节目（需要认证）
podcastRoutes.post("/episodes", authenticateApiKey, async (c) => {
  try {
    const body = await c.req.json();
    // 验证必需字段
    if (!body.title || !body.description || !body.audio_url || !body.audio_path) {
      return c.json({
        success: false,
        error: "缺少必需字段：title, description, audio_url, audio_path"
      }, 400);
    }

    const episode: Omit<PodcastEpisode, 'id' | 'created_at' | 'updated_at'> = {
      title: body.title,
      description: body.description,
      content: body.content || undefined,
      audio_url: body.audio_url,
      audio_path: body.audio_path,
      duration: body.duration || undefined,
      file_size: body.file_size || undefined,
      publish_date: body.publish_date || new Date().toISOString(),
      author: body.author || undefined,
      keywords: body.keywords || undefined,
      image_url: body.image_url || undefined,
      explicit: body.explicit || false,
      season: body.season || undefined,
      episode: body.episode || undefined
    };

    const result = await createEpisode(c.env.PODCAST_DB, episode);
    
    if (result.success) {
      return c.json({
        success: true,
        episode: result.episode,
        message: "节目创建成功"
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }

  } catch (error) {
    console.error("创建节目失败:", error);
    return c.json({ error: "服务器内部错误" }, 500);
  }
});

// 获取节目列表
podcastRoutes.get("/episodes", async (c) => {
  try {
    const episodes = await getEpisodes(c.env.PODCAST_DB);
    return c.json({
      success: true,
      episodes,
      count: episodes.length
    });

  } catch (error) {
    console.error("获取节目列表失败:", error);
    return c.json({ error: "服务器内部错误" }, 500);
  }
});

// 获取单个节目
podcastRoutes.get("/episodes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const episode = await getEpisode(c.env.PODCAST_DB, id);
    
    if (!episode) {
      return c.json({ error: "节目未找到" }, 404);
    }

    return c.json({
      success: true,
      episode
    });

  } catch (error) {
    console.error("获取节目失败:", error);
    return c.json({ error: "服务器内部错误" }, 500);
  }
});

// 更新节目（需要认证）
podcastRoutes.put("/episodes/:id", authenticateApiKey, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const result = await updateEpisode(c.env.PODCAST_DB, id, body);
    
    if (result.success) {
      return c.json({
        success: true,
        episode: result.episode,
        message: "节目更新成功"
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }

  } catch (error) {
    console.error("更新节目失败:", error);
    return c.json({ error: "服务器内部错误" }, 500);
  }
});

// 删除节目（需要认证）
podcastRoutes.delete("/episodes/:id", authenticateApiKey, async (c) => {
  try {
    const id = c.req.param("id");
    const result = await deleteEpisode(c.env.PODCAST_DB, id);
    
    if (result.success) {
      return c.json({
        success: true,
        message: "节目删除成功"
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }

  } catch (error) {
    console.error("删除节目失败:", error);
    return c.json({ error: "服务器内部错误" }, 500);
  }
});

// 获取频道信息
podcastRoutes.get("/channel", async (c) => {
  try {
    // @ts-ignore
    console.log("getChannelInfo, dbname: ", c.env.PODCAST_DB);  
    const channel = await getChannelInfo(c.env.PODCAST_DB);
    
    if (!channel) {
      return c.json({ error: "频道信息未找到" }, 404);
    }

    return c.json({
      success: true,
      channel
    });

  } catch (error) {
    console.error("获取频道信息失败:", error);
    return c.json({ error: "服务器内部错误" }, 500);
  }
});

// 更新频道信息（需要认证）
podcastRoutes.put("/channel", authenticateApiKey, async (c) => {
  try {
    const body = await c.req.json();
    const result = await updateChannelInfo(c.env.PODCAST_DB, body);
    
    if (result.success) {
      return c.json({
        success: true,
        channel: result.channel,
        message: "频道信息更新成功"
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }

  } catch (error) {
    console.error("更新频道信息失败:", error);
    return c.json({ error: "服务器内部错误" }, 500);
  }
});

// 数据库操作函数
async function getChannelInfo(db: D1Database): Promise<PodcastChannel | null> {

  const result = await db.prepare(`
    SELECT * FROM podcast_channels 
    ORDER BY created_at DESC 
    LIMIT 1
  `).first();
  
  return result as PodcastChannel | null;
}

async function getEpisodes(db: D1Database): Promise<PodcastEpisode[]> {
  const result = await db.prepare(`
    SELECT * FROM podcast_episodes 
    ORDER BY publish_date DESC
  `).all();
  
  return result.results as unknown as PodcastEpisode[];
}

async function getEpisode(db: D1Database, id: string): Promise<PodcastEpisode | null> {
  const result = await db.prepare(`
    SELECT * FROM podcast_episodes 
    WHERE id = ?
  `).bind(id).first();
  
  return result as PodcastEpisode | null;
}

async function createEpisode(db: D1Database, episode: Omit<PodcastEpisode, 'id' | 'created_at' | 'updated_at'>): Promise<{
  success: boolean;
  episode?: PodcastEpisode;
  error?: string;
}> {
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO podcast_episodes (
        id, title, description, content, audio_url, audio_path, 
        duration, file_size, publish_date, author, keywords, 
        image_url, explicit, season, episode, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, 
      episode.title, 
      episode.description, 
      episode.content ?? null,
      episode.audio_url, 
      episode.audio_path, 
      episode.duration ?? null,
      episode.file_size ?? null, 
      episode.publish_date, 
      episode.author ?? null,
      JSON.stringify(episode.keywords ?? []), 
      episode.image_url ?? null,
      episode.explicit ? 1 : 0, 
      episode.season ?? null, 
      episode.episode ?? null,
      now, 
      now
    ).run();

    const newEpisode = await getEpisode(db, id);
    return { success: true, episode: newEpisode! };

  } catch (error) {
    console.error("创建节目数据库错误:", error);
    return { success: false, error: "数据库操作失败" };
  }
}

async function updateEpisode(db: D1Database, id: string, updates: Partial<PodcastEpisode>): Promise<{
  success: boolean;
  episode?: PodcastEpisode;
  error?: string;
}> {
  try {
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE podcast_episodes SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        content = COALESCE(?, content),
        audio_url = COALESCE(?, audio_url),
        audio_path = COALESCE(?, audio_path),
        duration = COALESCE(?, duration),
        file_size = COALESCE(?, file_size),
        publish_date = COALESCE(?, publish_date),
        author = COALESCE(?, author),
        keywords = COALESCE(?, keywords),
        image_url = COALESCE(?, image_url),
        explicit = COALESCE(?, explicit),
        season = COALESCE(?, season),
        episode = COALESCE(?, episode),
        updated_at = ?
      WHERE id = ?
    `).bind(
      updates.title ?? null, 
      updates.description ?? null, 
      updates.content ?? null,
      updates.audio_url ?? null, 
      updates.audio_path ?? null, 
      updates.duration ?? null,
      updates.file_size ?? null, 
      updates.publish_date ?? null, 
      updates.author ?? null,
      updates.keywords ? JSON.stringify(updates.keywords) : null,
      updates.image_url ?? null, 
      updates.explicit !== undefined ? (updates.explicit ? 1 : 0) : null,
      updates.season ?? null, 
      updates.episode ?? null, 
      now, 
      id
    ).run();

    const updatedEpisode = await getEpisode(db, id);
    return { success: true, episode: updatedEpisode! };

  } catch (error) {
    console.error("更新节目数据库错误:", error);
    return { success: false, error: "数据库操作失败" };
  }
}

async function deleteEpisode(db: D1Database, id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await db.prepare(`
      DELETE FROM podcast_episodes WHERE id = ?
    `).bind(id).run();

    return { success: true };

  } catch (error) {
    console.error("删除节目数据库错误:", error);
    return { success: false, error: "数据库操作失败" };
  }
}

async function updateChannelInfo(db: D1Database, updates: Partial<PodcastChannel>): Promise<{
  success: boolean;
  channel?: PodcastChannel;
  error?: string;
}> {
  try {
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE podcast_channels SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        language = COALESCE(?, language),
        author = COALESCE(?, author),
        email = COALESCE(?, email),
        category = COALESCE(?, category),
        subcategory = COALESCE(?, subcategory),
        image_url = COALESCE(?, image_url),
        website_url = COALESCE(?, website_url),
        explicit = COALESCE(?, explicit),
        updated_at = ?
      WHERE id = (SELECT id FROM podcast_channels ORDER BY created_at DESC LIMIT 1)
    `).bind(
      updates.title ?? null, 
      updates.description ?? null, 
      updates.language ?? null,
      updates.author ?? null, 
      updates.email ?? null, 
      updates.category ?? null,
      updates.subcategory ?? null, 
      updates.image_url ?? null, 
      updates.website_url ?? null,
      updates.explicit !== undefined ? (updates.explicit ? 1 : 0) : null, 
      now
    ).run();

    const updatedChannel = await getChannelInfo(db);
    return { success: true, channel: updatedChannel! };

  } catch (error) {
    console.error("更新频道信息数据库错误:", error);
    return { success: false, error: "数据库操作失败" };
  }
} 
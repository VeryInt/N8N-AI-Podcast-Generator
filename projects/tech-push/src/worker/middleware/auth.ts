import { Context, Next } from "hono";

interface Env {
  API_SECRET_KEY?: string;
}

/**
 * API 密钥认证中间件
 * 验证请求头中的 X-API-Key 是否与配置的 API_SECRET_KEY 匹配
 */
export async function authenticateApiKey(c: Context<{ Bindings: Env }>, next: Next) {
  const apiKey = c.req.header("X-API-Key");
  const expectedApiKey = c.env.API_SECRET_KEY;
  
  console.log("Debug - API Key from header:", apiKey);
  console.log("Debug - Expected API Key:", expectedApiKey);
  
  if (!expectedApiKey) {
    console.warn("API_SECRET_KEY not configured");
    return c.json({ 
      success: false,
      error: "API authentication not configured" 
    }, 500);
  }
  
  if (!apiKey || apiKey !== expectedApiKey) {
    console.warn("Invalid API key attempt:", apiKey ? "provided" : "missing");
    return c.json({ 
      success: false,
      error: "Unauthorized" 
    }, 401);
  }
  
  await next();
}

/**
 * 可选的 API 密钥认证中间件
 * 如果提供了 API 密钥就验证，没有提供就跳过
 */
export async function optionalAuthenticateApiKey(c: Context<{ Bindings: Env }>, next: Next) {
  const apiKey = c.req.header("X-API-Key");
  const expectedApiKey = c.env.API_SECRET_KEY;
  
  // 如果没有配置 API_SECRET_KEY，跳过认证
  if (!expectedApiKey) {
    await next();
    return;
  }
  
  // 如果提供了 API 密钥，验证它
  if (apiKey && apiKey === expectedApiKey) {
    await next();
    return;
  }
  
  // 如果配置了 API_SECRET_KEY 但没有提供或提供错误，拒绝访问
  console.warn("API key required but not provided or invalid");
  return c.json({ 
    success: false,
    error: "API key required" 
  }, 401);
} 
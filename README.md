# N8N-AI-Podcast-Generator

## AI 智播

这是一个利用 **n8n** 和 **Cloudflare** 搭建的 **AI 播客自动化工作流**。它通过 **AI** 整合信息并使用 TTS 技术生成音频，实现播客内容的自动生成与发布。

工作流主要包括3部分内容，收集整合，AI生成，发布。

## 前置条件

- VPS(可选)

- Cloudflare账号 

- 域名

- AI API Key(包括文本对话和语音TTS)

- 飞书机器人(可选)

## Step by Step

### 安装n8n

由于整个生成功能都基于n8n的工作流，因此我们需要先安装n8n，安装教程可以参考[n8n官网](https://docs.n8n.io/hosting/installation/npm/)。

可以选择安装在本机或者VPS，两者的对比如下

本机：

- 性能更好

- 安装便捷

VPS：

- 持久开机，支持定时任务

- 随时随地访问/操作

### 数据源

我们的数据来自3个来源

1. 国外科技媒体的rss

2. huggingface的Daily Trending

3. 推特(X) 的科技推文

## 工作流详解

### 1. 定时任务触发器
新建一个 **Schedule Trigger**
|Trigger Rules|Value|
|--|--|
|Trigger Interval|Days|
|Days Between Triggers|1|
|Trigger at Hour|8am|

### 2. RSS数据收集
从 **Schedule Trigger** 上链接出一个 **RSS Read**, 用于获取科技站点 **theverge** 的信息
|Parameters|Value|
|--|--|
|URL|https://www.theverge.com/rss/index.xml|

### 3. Twitter/X数据收集
由于 twitter 开发者账号比较昂贵，我们可以使用第三方的 API 来获取一些 X 上的科技KOL的每日推文<br />
在开始获取之前，我们需要先创建一个 List 来设置需要追踪的 KOL 账号<br />
#### 3.1 从 **Schedule Trigger** 上增加一个 **Code** 节点，我们直接以 JS 的方式来输出想要的列表
|Parameters|Value|
|--|--|
|Mode|Run Once for All Items|
|Language|Javascript|
```javascript
let twitterUserList = [
  {userName: "msjiaozhu"},
  {userName: "aigclink"},
  {userName: "alibaba_qwen"},
  {userName: "imxiaohu"},
  {userName: "karminski3"},
  {userName: "googlelabs"},
  {userName: "geekbb"},
  {userName: "realmrfakename"},
  {userName: "op7418"},
  {userName: "dotey"},
]

return twitterUserList
```

#### 3.2 从上面的 **Code** 在连出一个 **HTTP Request** 节点
|Parameters|Value|
|--|--|
|Method|GET|
|URL|https://api.twitterapi.io/twitter/user/last_tweets?userName={{ $json.userName }}|
|Authentication|Generic Credential Type|
|Generic Auth Type|Header Auth|
|Header Auth|**twitterapi.io Auth**|

这里你需要注册一个 [twitterapi.io](https://twitterapi.io/) 的账号，获取到 API Key 之后创建一个名为 **twitterapi.io Auth** 的Header Auth<br />
另外，为了避免触发 QPS Limits, 可以在 **HTTP Request** 的 Options 里面添加 Batching，设置为10秒间隔：
|Batching Option|Value|
|--|--|
|Items per Batch|1|
|Batch Interval (ms)|10000|

#### 3.3 过滤最新24小时的推文
由于 **twitterapi.io** 的 API 并不支持时间维度的查询，只能查询最新的20条推文，因为我们还需要过滤一下，只获取此时间点24小时之内的推文<br />
在上面的 **HTTP Request** 后连一个 **Code** 节点
|Parameters|Value|
|--|--|
|Mode|Run Once for All Items|
|Language|Javascript|
```javascript
function getData(){
  let now = Date.now();
  let oneDay = 86400000;
  let allRequests = $input.all()
  // @ts-ignore
  let filterTweets = [];
  if(allRequests?.length > 0){

    allRequests.forEach(request=>{
      let tweets = request?.json?.data?.tweets;
      if(tweets?.length > 0){
        for (const item of tweets) {
          // @ts-ignore
          const { createdAt, url, text, quoted_tweet, extendedEntities, author } = item || {}
          // @ts-ignore
          let media = []
          if(extendedEntities?.media?.length > 0){
            extendedEntities.media.forEach(mediaItem=>{
              media.push({
                mediaUrl: mediaItem?.media_url_https || null
              })
            })
          }
          const authorName = author?.name || author?.userName || ''
          let createdAtTime = new Date(createdAt).getTime() || 0
          if(createdAtTime + oneDay > now){
            filterTweets.push({
              author: authorName,
              createdAt: createdAt,
              url: url,
              fullText: text + (quoted_tweet?.text ? "\nquoted_tweet:\n" + quoted_tweet.text : ""),
              media: media,
            })
          }
        }
      }
    })
  }
  return filterTweets
}

return getData()
```


### 1. 定时任务触发器 (Cron)

**用途**: 设置播客生成的时间间隔，比如每天或每周自动执行

**配置说明**:

- **Cron Expression**: `0 9 * * 1-5` (工作日每天早上9点)
- **Timezone**: 根据你的时区设置，如 `Asia/Shanghai`

**输出数据**: 触发信号，用于启动后续工作流

```
{
  "executionId": "xxx",
  "timestamp": "2024-01-15T09:00:00.000Z"
}
```

**注意事项**:

- 建议设置在非高峰时段运行
- 考虑API调用频率限制

---

### 2. RSS数据收集

**用途**: 从国外科技媒体RSS源获取最新资讯

**配置说明**:

- **URL**: RSS源地址
- **Request Method**: GET
- **Headers**: 设置User-Agent避免被屏蔽

**输入数据**: 来自定时触发器的信号

**输出数据**: RSS文章列表

```json
{
  "items": [
    {
      "title": "文章标题",
      "link": "文章链接", 
      "description": "文章摘要",
      "pubDate": "发布时间",
      "content": "文章内容"
    }
  ]
}
```

---

### 3. Hugging Face Trending数据

**用途**: 获取Hugging Face每日热门模型/数据集

**配置说明**:

- **URL**: `https://huggingface.co/api/models?sort=trending`
- **Request Method**: GET
- **Authentication**: 可选，使用HF Token获得更高限制

**输出数据**: 热门AI模型信息

```json
{
  "models": [
    {
      "modelId": "模型名称",
      "downloads": 下载次数,
      "tags": ["标签1", "标签2"],
      "createdAt": "创建时间"
    }
  ]
}
```

---

### 4. Twitter/X数据收集

**用途**: 获取科技相关的热门推文

**配置说明**:

- **API**: Twitter API v2
- **Endpoint**: `/2/tweets/search/recent`
- **Query**: `#AI OR #MachineLearning OR #Tech lang:en`
- **Authentication**: Bearer Token

**输出数据**: 推文列表

```json
{
  "data": [
    {
      "id": "推文ID",
      "text": "推文内容",
      "author_id": "作者ID",
      "created_at": "发布时间"
    }
  ]
}
```

---

### 5. 数据整合节点

**用途**: 将多个数据源的信息合并整理

**配置说明**:

- **Operation**: Merge/Combine
- **Keys**: 根据时间、相关性等字段合并

**输入数据**: 来自RSS、HF、Twitter的数据

**输出数据**: 整合后的信息列表

```json
{
  "combinedData": [
    {
      "source": "rss|huggingface|twitter",
      "title": "标题",
      "content": "内容",
      "timestamp": "时间戳",
      "relevance_score": "相关性评分"
    }
  ]
}
```

---

### 6. AI内容生成

**用途**: 使用AI将收集的信息生成为播客脚本

**配置说明**:

- **AI Service**: OpenAI GPT-4 / Claude / 其他
- **Prompt**: 播客脚本生成提示词
- **Model**: 选择合适的模型
- **Temperature**: 0.7 (平衡创造性和一致性)

**输入数据**: 整合后的数据

**输出数据**: 播客脚本

```json
{
  "script": {
    "title": "播客标题",
    "intro": "开场白",
    "main_content": "主要内容",
    "outro": "结尾",
    "estimated_duration": "预计时长"
  }
}
```

---

### 7. TTS音频生成

**用途**: 将播客脚本转换为音频文件

**配置说明**:

- **TTS Service**: ElevenLabs / Azure Speech / 其他
- **Voice**: 选择合适的语音
- **Speed**: 1.0 (正常语速)
- **Format**: MP3

**输入数据**: 播客脚本

**输出数据**: 音频文件URL或base64

```json
{
  "audio": {
    "file_url": "音频文件地址",
    "duration": "音频时长",
    "format": "mp3",
    "size": "文件大小"
  }
}
```

---

### 8. 内容发布

**用途**: 将生成的播客发布到各个平台

**配置说明**:

- **Platforms**: 播客平台API
- **Metadata**: 标题、描述、标签等
- **Audio Upload**: 音频文件上传

**输入数据**: 脚本和音频

**输出数据**: 发布结果

```json
{
  "publish_results": [
    {
      "platform": "平台名称",
      "status": "success|failed",
      "url": "播客链接",
      "error": "错误信息(如有)"
    }
  ]
}
```

---

### 9. 通知推送 (可选)

**用途**: 通过飞书机器人通知播客生成完成

**配置说明**:

- **Webhook URL**: 飞书机器人webhook地址
- **Message Format**: 格式化通知消息

**输入数据**: 发布结果

**输出数据**: 通知发送状态
# N8N-AI-Podcast-Generator

## AI 智播

这是一个基于 **n8n** 与 **Cloudflare** 的一体化播客自动化方案。项目使用 AI 汇总每日科技资讯，借助 TTS 将脚本合成为音频，并自动上传与发布，最终产出可订阅的播客 RSS 与可视化后台。

## 前置条件
- VPS（可选）：[1vCPU / 1GB RAM / 60GB Disk / 年付$10.99](https://app.cloudcone.com/vps/405/create?ref=329&token=flash-q3-25-vps-1)
- 域名（可选）
- Cloudflare 账号（用于 Workers、R2、D1）
- 硅基流动账号（用于 文本模型 和 TTS 模型调用）

## 安装说明
### n8n
#### 安装 n8n
工作流运行依赖 n8n。请按[n8n 官方文档](https://docs.n8n.io/hosting/installation/npm/)进行安装。<br />
可选择安装在本机或 VPS：
|本机|VPS|
|--|--|
|性能更好|长期在线|
|安装便捷|便于定时任务|
|无需额外成本|可远程访问|

n8n 原生支持 cron 定时触发，适合每日资讯类自动化任务。

#### 导入工作流（workflow）
下载并导入 [n8nTechPodcast.json](https://github.com/VeryInt/N8N-AI-Podcast-Generator/blob/main/workflows/n8nTechPodcast.json)，按指引完成必要替换。
##### 替换 Host
将以下节点中的 `host`（例如 `tech-push.your.workers.dev`）替换为你自己的 Cloudflare Worker 地址：
- HuggingFace Daily Papers Request
- Upload Podcast Audio
- Upload Podcast Total Info

##### 替换上传 Podcast 音频与数据的 API Key
在以下节点中，将 `your_tech-push_api_key` 替换为你在 Cloudflare Worker 中配置的 API Key：
- Upload Podcast Audio
- Upload Podcast Total Info

##### 修改本地音频路径
工作流默认使用 Linux 路径。请将以下节点中的 `/root/n8n/files/` 替换为你机器上的实际路径：
- Save Dialog Audio to Local
- FFmpeg Merge Music and Dialog
- Read Podcast Audio Info
- Read Podcast in Data

##### 创建凭证（credentials）
- twitterapi.io（Header Auth）
- SiliconFlow Account（OpenAI 兼容）
- SiliconFlow Bear（Bearer Auth）

<img src="/assets/images/SCR-20250930-nngf.png" />

### FFmpeg
需在主机安装 FFmpeg，用于二次音频处理与信息提取。参考 [FFmpeg 官方下载](https://ffmpeg.org/download.html)完成安装。

### Cloudflare Worker：Tech-Push 项目
除工作流外，还需一个 Worker 服务来存储音频与生成 RSS。可直接使用本仓库的 [tech-push 项目](https://github.com/VeryInt/N8N-AI-Podcast-Generator/tree/main/projects/tech-push)。<br />
将 `wrangler.toml.example` 重命名为 `wrangler.toml`，并按文件内注释完成配置。<br />
请提前在 Cloudflare 开通 D1 数据库与 R2 存储桶。

## 工作流详解
整体流程包含三部分：获取数据、AI 处理与总结、发送与发布。完整工作流可在此[下载](https://github.com/VeryInt/N8N-AI-Podcast-Generator/blob/main/workflows/n8nTechPodcast.json)。

### 获取数据
数据主要来自三类来源：
1. 国外科技媒体 RSS<br />
[The Verge RSS](https://www.theverge.com/rss/index.xml)
2. Hugging Face Daily Trending / Daily Papers<br />
Hugging Face Daily Papers 由 [AK](https://x.com/_akhaliq) 与研究社区精选，每日汇总热门 AI 论文。其为网页形式，不直接提供 RSS。Tech-Push 中的[HuggingFace路由实现](https://github.com/VeryInt/N8N-AI-Podcast-Generator/blob/main/projects/tech-push/src/worker/huggingface/routes.ts) 基于 Cloudflare HTMLRewriter，可直接解析页面节点并结构化输出。按说明部署至 Cloudflare 后，你将获得可访问的 URL（也可绑定自定义域名）。
3. X（原 Twitter）科技推文<br />
请注册 [twitterapi.io](https://twitterapi.io/) 并获取 API Key，在 n8n 中创建名为 `twitterapi.io Auth` 的 Header Auth。为避免触发 QPS 限制，可在 HTTP Request 节点的 Options 中启用 Batching，并设置 10 秒间隔。

<img src="/assets/images/input_list.PNG" />

### AI 处理与总结
在聚合过去 24 小时的数据后，使用 AI 进行筛选与生成，产出以下三类内容：
1. 适配飞书的每日资讯卡片
2. 适用于公众号发布的长文
3. 适用于播客的双人对话脚本

#### 飞书每日资讯列表
1. 新增一个 AI Agent 节点，System Prompt 如下：
    ```text
    这是来自theverge rss以及twitter的最新资讯，请帮我对这些内容进行分拣，挑出你认为和科技/ai相关的信息，然后进行总结，需要使用中文总结，总结的内容中同时需要有引用链接。请以以下对象数组的格式输出，精选出你认为最有用的条目，最多10条。 title/content均支持简单的markdown语法：
    [{"title": "**戴雨森谈拥抱时代等力量**","content": "**<font color='grey'>内容</font>** ：<font color='grey'>涵盖 AI 的各个方面，从基础知识到最新技术</font>\n**<font color='grey'>学习路径</font>** ：<font color='grey'>帮助读者理解和应用 AI 技术，无论你是想学习如何使用现有的 AI 工具</font>\n**<font color='grey'>原理</font>** ：<font color='grey'>深入研究 AI 的原理，这本手册都能提供有价值的指导</font>","theme": "能源","detail_url": "https://x.com/"}]
    ```
2. 模型可选择 Kimi K2。由于输出较长，请将 max tokens 调大。整体流程示意：
    <img src="/assets/images/formatcard.PNG" />

#### 公众号长文
1. 新增一个 AI Agent 节点，System Prompt 如下：
    ```text
    这是来自各种科技文章，rss以及twitter的最新资讯，请帮我对这些内容进行分拣，挑出你认为和科技/ai相关的信息, 然后总结里面的内容，生成一篇详细的资讯文章，适用于微信公众号的传播。同时也需要在文章末尾加上引用的地址。整篇文章可以使用简单的html元素来实现，比如 <p>, <h2>, <h3>, <a> 等标签。同时也许需要给这篇文章生成一个适合传播的标题，标题需要简短一些。最终需要符合以下格式输出：
    {"title":"今日科技大爆炸","content":"今天的科技内容详细信息"}
    ```
2. 建议使用 Qwen 3 模型进行总结。文章较长，请调大 max tokens。
    <img src="/assets/images/2802064f-c64d-45db-bdb9-4e8013f692c1.png" />

#### 播客双人对话脚本
目标是生成可直接用于 TTS 合成的双人对话脚本。<br />
1. 新增一个 AI Agent 节点（用于生成双人脚本），System Prompt 如下：
    ```text
    这是来自各种科技文章，rss以及twitter的最近24小时内的最新资讯，请帮我对这些内容进行分拣，挑出你认为和科技/ai相关的信息，然后根据这些内容和信息，生成一段对话，我需要根据这些信息生成一段中文双人播客，对话要有互动性，对话的2人分别为Jessica和Chris。最终的内容为格式为：
    [{"speaker":"Jessica","content":"嗨大家好，今天我们来聊一聊最新的科技资讯"},{"speaker":"Chris","content":"是的，我们先看看今天的最新内容"}]
    ```
2. 该 AI Agent 可复用上文的 Qwen 3 模型与配置。
3. 获取脚本后，使用一个 code 节点进行格式化与文本拼接（format and stringify speaker content）。
4. 文本准备完成后，调用硅基流动的 TTS 模型生成音频，建议使用 `fnlp/MOSS-TTSD-v0.5`。
    > MOSS-TTSD（text to spoken dialogue）是一个开源的双语（支持中文和英文）口语对话合成模型。它可以将两位说话者之间的对话脚本转换为自然且富有表现力的对话语音。其主要亮点包括：生成表现力丰富、接近真人的对话语音；支持零样本（zero-shot）双人声音克隆；以及单次可生成长达 960 秒的长时程语音。该模型基于统一的语义-声学神经音频编解码器、一个预训练的大语言模型以及海量的语音数据构建而成，非常适合用于 AI 播客制作等场景

    模型支持不同人声参考。本工作流已预设了男女主持人的参考声音。
5. 获得音频流后，将其保存到本地，并与背景音乐（`music.mp3`）合成最终播客音频 `ainews.mp3`。
6. 生成播客音频后，分两路处理：
    - 上传音频到 Cloudflare R2 存储
    - 提取音频信息（时长、码率、声道、采样率等）

<img src="/assets/images/5a18bab5-cf1d-45e4-966c-051e2cbf1457.png" />

### 发送与发布
1. 此时你已有三类播客相关产物：播客文章、播客音频 URL、音频元信息。使用 Merge 与 code 节点整合为发布所需的完整数据结构。
2. 使用 HTTP Request 将整合后的数据上传至 Cloudflare（由 Tech-Push Worker 接收处理）。

<img src="/assets/images/af8cf44b-c444-43d6-8b99-31ae2927693e.png" />

为完成展示与接收能力，你需要部署上述 Cloudflare Worker 项目，用于管理与展示播客内容。工作流完成后，后台会出现最新节目，RSS XML 同步更新。

## 发布播客
完成全部流程后，你将获得播客 RSS 地址与后台管理站点。一般情况下，只需提供 RSS 即可在各平台分发。

### iPhone 播客
打开 iPhone「播客」App，切换到「资料库」，右上角选择「通过 URL 关注节目…」，粘贴你的 RSS 地址即可订阅。

| <img src="/assets/images/IMG_0142.PNG" width="49%" /> | <img src="/assets/images/IMG_0143.PNG" width="49%" /> |
|---------|---------|


### 小宇宙播客
打开[小宇宙官网](https://www.xiaoyuzhoufm.com/)，登录后进入主播后台，选择「创建节目 - 认领 RSS 节目」，按指引填写你的 RSS 地址并完成提交。通过审核后，即可拥有你自己的播客电台。

| <img src="/assets/images/bf4014f9-4270-4cf5-934f-ce5b0a410cb7.png" width="49%" /> | <img src="/assets/images/FAE64D40-FBBB-49E0-8AF6-D849C0BA580F.PNG" width="49%" /> |
|---------|---------|

# N8N-AI-Podcast-Generator

## AI 智播

这是一个利用 **n8n** 和 **Cloudflare** 搭建的 **AI 播客自动化工作流**。它通过 **AI** 整合信息并使用 TTS 技术生成音频，实现播客内容的自动生成与发布。

## 前置条件
- VPS(可选) [1vCPU,1 024MB RAM, 60GBs DISK, Los Angeles, $10.99/YR](https://app.cloudcone.com/vps/405/create?ref=329&token=flash-q3-25-vps-1)
- 域名(可选)
- [cloudflare](https://cloudflare.com/)账号
- [硅基流动](https://cloud.siliconflow.cn/i/qMPDxY41)账号

## 安装说明
### n8n
#### 安装n8n
由于整个生成功能都基于n8n的工作流，因此我们需要先安装n8n，安装教程可以参考[n8n官网](https://docs.n8n.io/hosting/installation/npm/)。<br />
可以选择安装在本机或者 vps，两者对比
|本机|VPS|
|--|--|
|性能更好|持久开机|
|安装便捷|定时任务|
|无需付费|随时随地访问/操作|

另外n8n相比dify的一个最明显的好处，n8n支持cron也就是定时任务自动触发。

#### 导入workflow
从GitHub上下载 [n8nTechPodcast.json](https://github.com/VeryInt/N8N-AI-Podcast-Generator/blob/main/workflows/n8nTechPodcast.json) 导入n8n，按照workflow中的说明进行替换。
##### Host 替换
将下面几个节点中的 host(tech-push.your.workers.dev) 地址改为自己的cloudflare worker 地址
- HuggingFace Daily Papers Request
- Upload Podcast Audio
- Upload Podcast Total Info

##### 替换上传Podcast音频和数据的 API Key
将下面节点里面的 your_tech-push_api_key 替换为你在cloudflare worker中设置的API Key
- Upload Podcast Audio
- Upload Podcast Total Info

##### 修改本地音频路径
由于当前workflow按照Linux系统路径处理，可以将下面几个节点中的路径 /root/n8n/files/替换为自己系统对应的路径地址
- Save Dialog Audio to Local
- FFmpeg Merge Music and Dialog
- Read Podcast Audio Info
- Read Podcast in Data

##### 创建 credential
- twitterAPI.io (Header Auth)
- siliconflow account (OpenAi)
- siliconflow Bear account (Bearer Auth)

<img src="/assets/images/SCR-20250930-nngf.png" />

### FFmepg
由于需要生成有声播客，并且对其进行二次加工以及获取信息，还需要在主机内安装 FFmepg。参考[FFmepg官网](https://ffmpeg.org/download.html)安装即可。

### Cloudflare Worker: Tech-Push Project
整个项目除了工作流之外，我们还需要一个站点来存储播客音频和处理播客RSS，因此需要在cloudflare上部署worker，可以直接拉取我的GitHub项目 [tech-push](https://github.com/VeryInt/N8N-AI-Podcast-Generator/tree/main/projects/tech-push)。<br />
重命名 wrangler.toml.example 文件为 wrangler.toml，并按照里面的说明进行操作。<br />
需要注意的是，需要预先开通cloudflare的 D1数据库 和 R2存储桶。

## 工作流详解
整个工作流分为 获取数据，AI处理总结，发送消息 三大块。完整的工作流可点击此[下载](https://github.com/VeryInt/N8N-AI-Podcast-Generator/blob/main/workflows/n8nTechPodcast.json)。

### 获取数据
数据主要来自3个来源
1. 国外科技媒体的rss <br />
[theverge RSS](https://www.theverge.com/rss/index.xml)
2. huggingface的Daily Trending<br />
Huggingface Daily Papers 是一个由 [AK](https://x.com/_akhaliq) 和研究社区精选的每日热门AI研究论文合集，但只有网页版，不支持 RSS，如果想要变成文本和结构化的数据，需要自己处理。<br/>
Tech-Push中的 [Huggingface路由](https://github.com/VeryInt/N8N-AI-Podcast-Generator/blob/main/projects/tech-push/src/worker/huggingface/routes.ts) 是一个基于 Cloudflare HTMLRewriter 的 wroker，可以直接读取 HuggingFace Daily Papers 页面上的 html 节点，并且对其进行格式化处理<br/>
参照此项目的说明部署至 Cloudflare 即可，部署完毕之后你会获得一个访问 URL，也可以配置自己的域名进行访问。
3. 推特(X) 的科技推文<br />
这里你需要注册一个 [twitterapi.io](https://twitterapi.io/) 的账号，获取到 API Key 之后创建一个名为 twitterapi.io Auth 的Header Auth<br/>
另外，为了避免触发 QPS Limits, 可以在 HTTP Request 的 Options 里面添加 Batching，设置为10秒间隔

<img src="/assets/images/input_list.PNG" />

### AI处理+总结
在获取到24小时的信息数据后，就可以引入AI进行处理和总结了。这部分分为了3块内容
1. 适用于飞书每日推送的AI新闻列表
2. 用于发布公众号的文章
3. 用于发布播客的双人对话脚本

#### 适用于飞书每日推送的AI新闻列表
1. 添加一个 AI Agent节点，System Prompt如下
    ```text
    这是来自theverge rss以及twitter的最新资讯，请帮我对这些内容进行分拣，挑出你认为和科技/ai相关的信息，然后进行总结，需要使用中文总结，总结的内容中同时需要有引用链接。请以以下对象数组的格式输出，精选出你认为最有用的条目，最多10条。 title/content均支持简单的markdown语法：
    [{"title": "**戴雨森谈拥抱时代等力量**","content": "**<font color='grey'>内容</font>** ：<font color='grey'>涵盖 AI 的各个方面，从基础知识到最新技术</font>\n**<font color='grey'>学习路径</font>** ：<font color='grey'>帮助读者理解和应用 AI 技术，无论你是想学习如何使用现有的 AI 工具</font>\n**<font color='grey'>原理</font>** ：<font color='grey'>深入研究 AI 的原理，这本手册都能提供有价值的指导</font>","theme": "能源","detail_url": "https://x.com/"}]
    ```
2. AI Agent可以选择 Kimi K2 模型，需要特别注意的是，max tokens需要设大一些。整体流程如下
    <img src="/assets/images/formatcard.PNG" />

#### 用于发布公众号的文章
1. 同样添加一个新的AI Agent节点，System Prompt如下
    ```text
    这是来自各种科技文章，rss以及twitter的最新资讯，请帮我对这些内容进行分拣，挑出你认为和科技/ai相关的信息, 然后总结里面的内容，生成一篇详细的资讯文章，适用于微信公众号的传播。同时也需要在文章末尾加上引用的地址。整篇文章可以使用简单的html元素来实现，比如 <p>, <h2>, <h3>, <a> 等标签。同时也许需要给这篇文章生成一个适合传播的标题，标题需要简短一些。最终需要符合以下格式输出：
    {"title":"今日科技大爆炸","content":"今天的科技内容详细信息"}
    ```
2. 可以使用 qwen3 模型进行总结，由于文章的内容可能比较长，同样也是需要讲max tokens设置大一些。
    <img src="/assets/images/2802064f-c64d-45db-bdb9-4e8013f692c1.png" />

#### 用于发布播客的双人对话脚本
这里我们需要生成一段对话，后续我们需要用这段对话生成真实的语音播客。<br />
1. 添加一个新的AI Agent节点，用于生成双人播客脚本，System Prompts 如下
    ```这是来自各种科技文章，rss以及twitter的最近24小时内的最新资讯，请帮我对这些内容进行分拣，挑出你认为和科技/ai相关的信息，然后根据这些内容和信息，生成一段对话，我需要根据这些信息生成一段中文双人播客，对话要有互动性，对话的2人分别为Jessia和Chris。最终的内容为格式为：
    [{"speaker":"Jessica","content":"嗨大家好，今天我们来聊一聊最新的科技资讯"},{"speaker":"Chris","content":"是的，我们先看看今天的最新内容"}]
    ```
2. 这里的AI Agent可以复用刚才的qwen3模型，保留相同的配置即可。
3. 在获取到脚本之后，还需一个code节点对内容进行格式化和文本转换 (format and stringify speaker content)
4. 在获取到文本化后的内容之后，我们就需要调用硅基流动的TTS模型来生成一个音频了，模型选择 fnlp/MOSS-TTSD-v0.5 
    >MOSS-TTSD（text to spoken dialogue）是一个开源的双语（支持中文和英文）口语对话合成模型。它可以将两位说话者之间的对话脚本转换为自然且富有表现力的对话语音。其主要亮点包括：生成表现力丰富、接近真人的对话语音；支持零样本（zero-shot）双人声音克隆；以及单次可生成长达 960 秒的长时程语音。该模型基于统一的语义-声学神经音频编解码器、一个预训练的大语言模型以及海量的语音数据构建而成，非常适合用于 AI 播客制作等场景

    完整的API说明可以参考这里，另外，模型支持不同的人声参考，工作流当中已经预先保存了男女不同主持人的声音
5. 在上一步中我们最终获得的是一个音频流，需要将其保存到本地，并且结合本地的背景音乐(music.mp3), 生成一个带有背景音乐的播客音频mp3(ainews.mp3)
6. 在获取到播客音频之后，我们又需要分叉2条分支：
    - 一条用于上传音频到cloudflare 的 r2 桶，
    - 一条获取音频数据，包括音频时长，码率，channel，sample等信息

<img src="/assets/images/5a18bab5-cf1d-45e4-966c-051e2cbf1457.png" />

### 发送消息
1. 现在我们有3个和播客相关的内容：播客文章，播客音频的地址，以及音频的信息，现在需要将他们整合在一起。通过添加 Merge 和 code 节点来处理播客所需要的所有信息。
2. 最后直接将处理完成的数据上传到cloudflare (Http Request).

<img src="/assets/images/af8cf44b-c444-43d6-8b99-31ae2927693e.png" />

在最后这一点，我们还需要一个项目用来部署到cloudflare worker来显示和接收播客内容，包括播客音频和播客后台。当工作流完成之后，可以看到播客后台界面上出现这个最新的节目，并且rss xml里面也会更新。

## 发布播客
在上面的流程都走完之后，你会获得一个播客的rss地址和后台管理站点。通常我们只需要一个播客的rss，即可进行传播。

### iPhone 播客
打开iPhone 的播客app，切换到 资料库 tab，右上角选择 通过URL关注节目... 即可将你的播客节目在app中呈现

| <img src="/assets/images/IMG_0142.PNG" width="49%" /> | <img src="/assets/images/IMG_0143.PNG" width="49%" /> |
|---------|---------|


### 小宇宙播客
打开[小宇宙PC网站](https://www.xiaoyuzhoufm.com/)，登陆后进入主播后台，选择创建节目 - 认领RSS节目，然后按照指引输入自己播客的rss地址，并且上传播客后台操作节目即可。<br/>
等审核通过后，你就会拥有一个你自己的播客电台啦。

| <img src="/assets/images/bf4014f9-4270-4cf5-934f-ce5b0a410cb7.png" width="49%" /> | <img src="/assets/images/FAE64D40-FBBB-49E0-8AF6-D849C0BA580F.PNG" width="49%" /> |
|---------|---------|

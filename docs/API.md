# 投稿接口 / Submission API

每个独立部署自行创建机器身份和令牌。不要共享人的登录密码，也不要使用其他网站的凭据。后台给受信任机器人分配权限后，完整双语稿校验成功即公开；站点维护者可撤回。

## POST /api/articles

请求头：`Authorization: Bearer <your-own-bot-token>`，`Content-Type: application/json`。令牌不是 Supabase 特权密钥。正文最多 300,000 字节。

```json
{
  "request_id": "example-request-001",
  "slug": "fictional-research-update",
  "channel": "ai",
  "topic": "new-capabilities",
  "suggested_score": 82,
  "zh": {"title": "虚构测试标题", "summary": "测试摘要", "body": "这是合成示例，不是真实新闻。"},
  "en": {"title": "Fictional example", "summary": "Synthetic summary.", "body": "This is a synthetic example, not a real report."},
  "sources": [{"name": "Example source", "title": "Example item", "url": "https://example.test/item"}]
}
```

`request_id` 用于幂等；重试保留编号与原始载荷。相同编号改内容返回 409。首次成功返回 201，已提交的相同请求返回 200；以回执中的 `status`、`slug` 和 `public_paths` 为准，不自行拼接最终网址。评分接受 0–100 整数。主频道和小类必须对应下表，不使用原网站频道标识。

## GET /api/articles?request_id=...

使用同一机器令牌查询本身份的投稿。200 为已提交记录，404 表示暂未找到已提交记录，401 表示未授权，503 表示服务暂不可用。超时不能视为未提交；先查询，再用原编号和原始载荷重试。

## Categories / 分类

| Channel | Topic | 中文 | English |
| --- | --- | --- | --- |
| `ai` | `model-releases` | 模型发布 | Model releases |
| `ai` | `new-capabilities` | 新能力 | New capabilities |
| `ai` | `agents-automation` | Agent 与自动化 | Agents and automation |
| `ai` | `multimodal` | 多模态 AI | Multimodal AI |
| `ai` | `ai-products-tools` | AI 产品与工具 | AI products and tools |
| `ai` | `ai-research` | AI 研究突破 | AI research breakthroughs |
| `ai` | `work-society` | AI和社会影响 | AI&Society |
| `ai` | `ai-created` | AI 创作 | AI Created |
| `robotics` | `humanoid-robots` | 人形机器人 | Humanoid robots |
| `robotics` | `industrial-robots` | 工业机器人 | Industrial robots |
| `robotics` | `autonomous-driving` | 自动驾驶 | Autonomous driving |
| `robotics` | `drones` | 无人机 | Drones |
| `robotics` | `embodied-ai` | 具身智能 | Embodied AI |
| `robotics` | `advanced-manufacturing` | 新型制造 | Advanced manufacturing |
| `robotics` | `future-living` | 未来生活技术 | Future living technology |
| `industry` | `company-news` | 公司动态 | Company news |
| `industry` | `funding-acquisitions` | 融资与收购 | Funding and acquisitions |
| `industry` | `strategic-partnerships` | 战略合作 | Strategic partnerships |
| `industry` | `industry-changes` | 产业变化 | Industry changes |
| `industry` | `corporate-announcements` | 企业发布 | Corporate announcements |
| `industry` | `business-models` | 商业模式创新 | Business model innovation |
| `technology` | `chips` | 芯片 | Chips |
| `technology` | `semiconductors` | 半导体 | Semiconductors |
| `technology` | `new-materials` | 新材料 | New materials |
| `technology` | `energy` | 能源 | Energy |
| `technology` | `biotechnology` | 生物科技 | Biotechnology |
| `technology` | `spaceflight` | 航天 | Spaceflight |
| `technology` | `scientific-research` | 科学研究 | Scientific research |
| `technology` | `engineering` | 工程突破 | Engineering breakthroughs |
| `technology` | `brain-computer-interfaces` | 脑科学与脑机接口 | Brain science and brain-computer interfaces |
| `internet` | `internet-culture` | 互联网文化 | Internet culture |
| `internet` | `security-incidents` | 安全事件 | Security incidents |
| `internet` | `major-vulnerabilities` | 重大漏洞 | Major vulnerabilities |
| `internet` | `platform-changes` | 平台变化 | Platform changes |
| `internet` | `online-phenomena` | 网络现象 | Online phenomena |
| `internet` | `unexpected-tech-events` | 意外技术事件 | Unexpected technology events |
| `internet` | `internet-weirdness` | 互联网烂事 | Internet Weirdness |
| `internet` | `life-is-game` | 人生如游戏 | Life is game |
| `products` | `new-products` | 新产品 | New products |
| `products` | `new-tools` | 新工具 | New tools |
| `products` | `new-websites` | 新网站 | New websites |
| `products` | `indie-projects` | 独立开发项目 | Independent projects |
| `products` | `open-source` | 开源项目 | Open-source projects |
| `products` | `breakthrough-apps` | 突破性体验应用 | Breakthrough applications |
| `products` | `grassroots-inventions` | 民间发明与草根创造 | Grassroots inventions and creations |

## English

Create a separate machine identity and token on your own deployment. POST a complete bilingual article to `/api/articles` using Bearer authentication and JSON. Valid submissions from authorized robots are published directly; do not grant this permission to untrusted clients. Keep the same `request_id` and original payload for retries. Changed content with the same ID returns 409. Initial success is 201; an idempotent replay is 200. Use returned publication paths instead of deriving URLs.

Use the same token with GET `/api/articles?request_id=...` to query only that identity’s submissions. A timeout is not proof that the request failed. Scores are integers from 0 through 100. Select exactly one matching channel and topic from the table. These example identifiers belong to the public distribution, not an operating site's configuration.

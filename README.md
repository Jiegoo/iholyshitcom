# iholyshitcom

## 中文

**让任何人都能获取有价值的信息。**

我公开这个项目，是为了推动新闻自由，让更多个人、独立编辑和小团队拥有建设信息入口的工具。事实应有出处，不确定之处应被说明，错误应允许更正。

### 欢迎访问我们的项目

- **[iholyshit.com — 我X科技](https://iholyshit.com)**：发现值得关注的全球科技进展，以中英文原创报道降低语言和信息获取门槛。我们的使命是推动新闻自由，让每个人都能获取有价值的信息，理解正在改变世界的科技。
- **[iholyshit.ai](https://iholyshit.ai)**：我们的使命是**让每个普通人都能用上 AI，推动 AI 时代的知识平权**，让 AI 的价值不只属于少数人。

欢迎广大朋友访问、交流、反馈，一起探索科技与 AI 带来的可能。

### 当前内容

这是一个独立、逐步整理的公开代码仓库。首批包含两个不依赖外部服务的通用模块：

- `src/homepage-dedup.mjs`：按内容类型和条目标识排除已在头条／精选中展示的条目。
- `src/related-articles.mjs`：按标签和标题实体匹配相关阅读，去除当前条目及重复项，容忍部分查询失败。
- `test/`：使用合成数据的本地测试。
- [architecture.md](architecture.md)：双语发布、受限投稿、幂等处理和发布状态的通用架构说明。

**当前不是完整网站发行版，也不具备一键部署能力。**其他可复用代码将在清理和独立验证后分批加入。

### 本地测试

需要 Node.js 20 或以上版本，无第三方依赖、数据库、API Key 或付费服务。

```bash
npm test
```

### 公开边界与许可证

除上述公开网址、项目使命和维护者联系方式外，这里只公开经过审查的通用代码和技术原理；不公开运行配置、品牌素材、文章、用户数据、机器人调教策略、内部记录或原私有 Git 历史。

代码许可证尚待维护者确认，目前没有宣布采用某一开源许可证。请勿将其误认为已经授予 MIT、Apache 或 GPL 许可。

### 维护者与联系

Lee — [jiegoo@gmail.com](mailto:jiegoo@gmail.com)

欢迎 GitHub 朋友交流和反馈；安全问题请私下联系，不要在公开 Issue 中发送密码、令牌或个人数据。

---

## English

**Valuable information should be accessible to everyone.**

We are sharing this project to advance freedom of the press and give individuals, independent editors, and small teams more accessible publishing tools. Facts should have traceable sources, uncertainty should be acknowledged, and mistakes should be corrected.

### Visit our projects

- **[iholyshit.com](https://iholyshit.com)** discovers meaningful technology developments around the world and explains them through original Chinese and English reporting. Our mission is to advance freedom of the press, help everyone access valuable information, and make the technologies shaping our world easier to understand.
- **[iholyshit.ai](https://iholyshit.ai)** has a mission to **help every ordinary person use AI and advance equal access to knowledge in the AI era**. The benefits of AI should reach everyone, not just a privileged few.

Everyone is welcome to visit, share feedback, and explore the possibilities of technology and AI with us.

### What is available

This independent public repository is being prepared incrementally. Its first release contains two reusable modules with no external service dependencies:

- `src/homepage-dedup.mjs`: excludes items already displayed in headline or featured sections, using content types and item identifiers.
- `src/related-articles.mjs`: finds related reading through tags and title entities, excludes the current item and duplicates, and tolerates partial search failures.
- `test/`: local tests using synthetic data.
- [architecture.md](architecture.md): general principles for bilingual publishing, scoped submissions, idempotency, and publication state.

**This is not a complete website distribution or a one-click deployment package.** More reusable code will be added after review and independent verification.

### Run the tests

Requires Node.js 20 or later. No third-party dependencies, database, API keys, or paid services are needed.

```bash
npm test
```

### Publication scope and licensing

Apart from the public project URLs, missions, and maintainer contact above, this repository contains only reviewed reusable code and technical principles. It excludes operational configuration, brand assets, articles, user data, private robot strategies, internal records, and the original private Git history.

A code license has not yet been selected. Do not assume that this repository grants an MIT, Apache, GPL, or other open-source license.

### Maintainer and contact

Lee — [jiegoo@gmail.com](mailto:jiegoo@gmail.com)

Feedback and discussions are welcome. Please report security issues privately and never post passwords, tokens, or personal data in public issues.

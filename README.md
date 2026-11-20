# iholyshitcom

## 中文

**让任何人都能获取有价值的信息。**

我公开这个项目，是为了推动新闻自由，让更多个人、独立编辑和小团队拥有建设信息入口的工具。事实应有出处，不确定之处应被说明，错误应允许更正。

### 欢迎访问我们的项目

- **[iholyshit.com — 我X科技](https://iholyshit.com)**：发现值得关注的全球科技进展，以中英文原创报道降低语言和信息获取门槛。使命是推动新闻自由，让每个人都能获取有价值的信息，理解正在改变世界的科技。
- **[iholyshit.ai](https://iholyshit.ai)**：让每个普通人都能用上 AI，推动 AI 时代的知识平权。

欢迎广大朋友访问、交流、反馈，一起探索科技与 AI 带来的可能。

### 本仓库提供什么

这是一套可以独立配置的双语新闻发布应用代码，采用 Next.js、TypeScript、Supabase PostgreSQL/Auth/Storage，并提供可选 Python 事件任务。

- 中英双语文章、频道与子分类、搜索、精选与趋势、分页和跨天事件时间轴。
- 独立的机器投稿身份、幂等回执与状态查询；受信任机器人提交完整稿并通过校验后直接发布。
- 人工编辑、更正、撤回、恢复，团队与会员管理界面。
- 匿名互动、评论管理、同意后统计、阅读字号、站内相关阅读。
- 多语言 SEO、RSS、站点地图及通用分享卡。
- 空数据库结构、自己的身份初始化脚本、私有图片存储规则，以及本地安装和回归测试。

公开版使用通用站点名称与分类，不包含运行网站的配置、品牌素材、文章、用户数据、原 Git 历史或私有机器人策略。原 Logo 与插画库未公开；默认提供通用文字标志、图标和分享卡，文章可使用部署者自己上传的图片。会员邮件和真实 AI 任务需要部署者另外配置。

### 代码目录

| 目录 | 内容 |
| --- | --- |
| `apps/web` | 阅读前台、编辑工作台、会员界面和投稿接口 |
| `packages` | 共享数据协议与通用分类 |
| `supabase` | 独立实例初始结构、安全默认值、私有媒体规则与数据库测试 |
| `workers/events` | 可选事件关联／摘要任务及离线测试，无 RSS 调度 |
| `src`、`test` | 独立的去重与相关阅读工具及测试 |
| `scripts` | 临时本地 PostgreSQL 与网站端到端安装检查 |
| `docs` | [安装说明](docs/INSTALL.md)、[投稿接口与分类](docs/API.md)、[事件任务](docs/EVENTS.md) |

[架构说明](architecture.md)介绍双语版本、受限投稿、幂等处理和发布状态。

### 开始使用与验证

需要 Node.js 22（最低 20.9）、npm；可选任务需要 Python 3.12。实际运行使用你自己的 Supabase 实例，**初始结构只适用于空实例，不要执行在已有网站数据库上**。

```bash
npm ci
npm run build
npm test
npm run test:install
```

本地启动前按[安装说明](docs/INSTALL.md)初始化自己的数据库和身份，复制 `.env.example` 到 `apps/web/.env.local` 并填写自己的配置，再运行 `npm run dev`。

本次验证包括 71 项网页测试、4 项独立工具测试、4 项数据库测试，以及 21 项 Python 测试。本地端到端安装检查验证空 PostgreSQL、自己的管理身份、机器 POST／重复请求／GET、中英文文章和首页、RSS 与地图。测试使用合成内容，不调用真实 AI。

这些结果不代表托管 Auth、SMTP、Storage HTTP 或供应商账户已为你配置完成；正式运行前需按自己的环境验证，并填写关于、隐私和条款页面的占位内容。默认无部署配置和计划任务，真实事件任务不会自动启用。

### 许可证与贡献

公开的第一方代码和文档采用 **[MIT License](LICENSE)**，版权署名 **Lee**。允许使用、修改与商用，须保留版权及许可声明。第三方依赖和图标沿用各自许可，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。原网站的内容、资产、私有策略和数据不在本次发布中。

欢迎提交问题和改进，参见 [CONTRIBUTING.md](CONTRIBUTING.md)。安全问题请按 [SECURITY.md](SECURITY.md) 私下联系。

### 维护者与联系

Lee — [jiegoo@gmail.com](mailto:jiegoo@gmail.com)

欢迎 GitHub 朋友交流和反馈；不要在公开 Issue 中发送密码、令牌或个人数据。

---

## English

**Valuable information should be accessible to everyone.**

We are sharing this project to advance freedom of the press and give individuals, independent editors, and small teams more accessible publishing tools. Facts should have traceable sources, uncertainty should be acknowledged, and mistakes should be corrected.

### Visit our projects

- **[iholyshit.com](https://iholyshit.com)** discovers meaningful technology developments around the world and explains them through original Chinese and English reporting. Our mission is to advance freedom of the press, help everyone access valuable information, and make the technologies shaping our world easier to understand.
- **[iholyshit.ai](https://iholyshit.ai)** aims to help every ordinary person use AI and advance equal access to knowledge in the AI era.

Everyone is welcome to visit, share feedback, and explore the possibilities of technology and AI with us.

### What this repository provides

An independently configurable bilingual publishing application using Next.js, TypeScript, Supabase PostgreSQL/Auth/Storage, and an optional Python event worker:

- Bilingual articles, channels and topics, search, featured and trending sections, pagination, and event timelines.
- Scoped machine identities, idempotent submissions and status lookup. Valid complete submissions from authorized robots publish directly.
- Manual editing, corrections, withdrawal and restoration, team and member management interfaces.
- Anonymous reactions, comment moderation, consent-gated analytics, reading preferences and related articles.
- Multilingual SEO, RSS, sitemaps and a neutral sharing card.
- Empty-instance schema, owner bootstrap, private media rules, and local installation tests.

The distribution uses neutral branding and categories. It excludes an operating site's configuration, brand assets, articles, user data, original Git history and private robot strategies. The original logo and illustration library are not included; neutral placeholders are supplied. Operators may upload their own images. Reader email and live AI tasks require separate configuration.

### Layout

- `apps/web`: public pages, editor workspace, member interfaces and submission API.
- `packages`: shared contracts and generic taxonomy.
- `supabase`: initial schema, safe defaults, private media rules and database tests.
- `workers/events`: optional event processing and offline tests; no RSS scheduler.
- `src` and `test`: independent deduplication and related-reading utilities.
- `scripts`: local PostgreSQL and application installation smoke test.
- `docs`: [installation](docs/INSTALL.md), [submission API and categories](docs/API.md), [optional events](docs/EVENTS.md).

See [architecture.md](architecture.md) for versioning, scoped submissions, idempotency and publication-state principles.

### Get started and verify

Requires Node.js 22 (minimum 20.9) and npm; Python 3.12 is needed for the optional worker. Use your own Supabase instance. **The initial schema is for a fresh empty instance, not an existing site's database.**

```bash
npm ci
npm run build
npm test
npm run test:install
```

Follow the [installation guide](docs/INSTALL.md), initialize your own database and identity, copy `.env.example` to `apps/web/.env.local`, enter your own settings, and run `npm run dev`.

Release checks include 71 web tests, 4 standalone utility tests, 4 database tests and 21 Python tests. The local end-to-end check exercises empty PostgreSQL initialization, an independently chosen owner, scoped bot POST/replay/GET, bilingual articles and homepages, RSS and the sitemap. It uses synthetic content and makes no live AI calls.

These checks do not configure or certify hosted Auth, SMTP, Storage HTTP, or provider accounts. Validate your own environment and replace the About, Privacy and Terms placeholders before public operation. No deployment settings or schedules are bundled, and live event processing is disabled by default.

### License and contributions

Published first-party code and documentation are licensed under the **[MIT License](LICENSE)**, copyright **Lee**. Preserve the copyright and license notices. Third-party components retain their respective licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Original-site content, assets, strategies and data are not part of this release.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contributions and [SECURITY.md](SECURITY.md) for private security reports.

### Maintainer and contact

Lee — [jiegoo@gmail.com](mailto:jiegoo@gmail.com)

Feedback is welcome. Never post passwords, tokens or personal data in public issues.

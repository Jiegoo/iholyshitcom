# Independent installation / 独立安装

## 中文

本版本面向**新的独立 Supabase 实例**。不要把初始结构迁移执行在已有网站数据库上，不要使用原项目的数据库、域名或凭据。这里没有预置管理员、文章、机器人密钥或原站素材。

### 1. 环境与本地检查

- Node.js 22（最低 20.9）与 npm。
- 可选事件任务需要 Python 3.12。
- 实际运行需要你自己的 Supabase Database、Auth 和 Storage；邮件功能另行配置。

```bash
npm ci
npm run build
npm test
npm run test:install
```

`test:install` 创建临时本地 PostgreSQL、兼容接口测试适配器与 Next.js 服务，使用合成身份和内容验证完整投稿读取链；结束后清理。它不连接远程数据库，不证明托管 Auth、SMTP、Storage HTTP 或 AI 账户已经配置完成。

### 2. 初始化你自己的 Supabase

可使用新托管项目，或安装 Docker 后通过本仓 `supabase/config.toml` 启动本地 Supabase：

```bash
npx supabase start
npx supabase db reset
```

上述 reset 默认操作本地数据库，会清空该本地实例。不要添加 `--remote`、不要关联已有生产项目。使用托管空项目时，在自己的 SQL Editor 中按文件名顺序执行 `supabase/migrations` 内三个 SQL 文件。

初始结构由全新的本地数据库重建，不包含原站迁移历史或任何数据导出。它保留了一些旧流程所需的兼容结构；公开版不提供旧 RSS／爬虫调度，相关表初始为空，不是新的运行要求。

### 3. 初始化自己的管理身份

在你自己的 Supabase Auth 中创建账号并完成相应确认。编辑 `supabase/bootstrap-owner.sql` 的 `owner_email`，填入该账号邮箱，再在自己的实例执行。未替换占位符时脚本拒绝运行；已存在另一主要管理身份时也会拒绝覆盖。

脚本只绑定已有账号，不创建密码、不附带默认登录凭据。后续通过 `/editor` 登录，管理成员与机器身份。

### 4. 配置网站

```bash
cp .env.example apps/web/.env.local
```

填写自己的 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`；后台创建账号及机器人投稿还需服务端 `SUPABASE_SERVICE_ROLE_KEY`。该特权密钥绝不能使用 `NEXT_PUBLIC_` 前缀或发给机器人。

在自己的初始化完成后设置：

```dotenv
NEWS_BILINGUAL_PUBLIC_READ=true
NEWS_MANUAL_PUBLIC_READ=true
NEWS_RSS_ENABLED=true
```

本地开发：`npm run dev`。部署后如需开放 SEO/RSS，另配置自己的 HTTPS `SITE_CANONICAL_ORIGIN`、`SITE_INDEXING_ENABLED=true`、`VERCEL_ENV=production`；未启用时保持 noindex/订阅关闭。不要填入原站的网址。

`NEWS_READER_EMAIL_ENABLED=false` 默认关闭会员确认与找回邮件；配置好自己的发信服务后再启用。隐私、条款和关于页面均为待填写占位文案，正式运营前必须根据自己的实际情况补齐。

### 5. 内容与素材

人工稿支持双语编辑、任意 0–100 整数评分、更正、撤回与恢复。机器身份在后台单独配置，受信任的机器人投稿校验成功后会直接发布，请妥善管理和撤销其权限。

图片使用独立实例内的私有 `manual-media` 桶；迁移仅在 Storage 表存在时创建桶与权限规则。读取通过已发布文章对应的媒体路由，视频仅支持外链。原站 Logo、插画与图片未包含；默认只提供通用文字标志、图标和分享卡，可自行替换。

### 6. 可选事件任务

默认没有计划任务，不会自动调用付费 AI。独立配置见 [EVENTS.md](EVENTS.md)。投稿和人工编辑不依赖启用该任务。

## English

This distribution targets a **new independent Supabase instance**. Never apply the initial schema to an existing website database or reuse another site's credentials.

1. Install Node.js 22 (minimum 20.9) and npm. Run `npm ci`, `npm run build`, `npm test`, and `npm run test:install`.
2. Use a fresh hosted Supabase project, or start local Supabase with Docker using `npx supabase start` and `npx supabase db reset`. Reset clears the local instance; never add `--remote` or link an existing production project. For a fresh hosted instance, apply the three migration files in order through your own SQL Editor.
3. Create and confirm your own Auth account. Set `owner_email` in `supabase/bootstrap-owner.sql`, then run it on your own instance. No default account or password is shipped.
4. Copy `.env.example` to `apps/web/.env.local`; fill in your own Supabase URL, publishable key, and server-only service-role key. Enable `NEWS_BILINGUAL_PUBLIC_READ`, `NEWS_MANUAL_PUBLIC_READ`, and, if desired, `NEWS_RSS_ENABLED` after initialization. Run `npm run dev` locally.
5. Public SEO/RSS additionally require your own HTTPS canonical origin, `SITE_INDEXING_ENABLED=true`, and `VERCEL_ENV=production`. Reader email remains disabled until your own mail service is configured. Replace the placeholder About, Privacy and Terms pages before operating publicly.
6. The `manual-media` bucket is private; media rules are installed when Storage is present. Only video links are supported. Original branding, illustrations and images are excluded; neutral placeholders are supplied.
7. The optional event worker has no bundled schedule and makes no AI calls unless explicitly configured and enabled. See [EVENTS.md](EVENTS.md).

The initial schema was reconstructed locally without operating-site data. It retains compatibility objects for retired workflows, but no RSS/crawler scheduler is included. `test:install` verifies local PostgreSQL, a test RPC adapter, and Next.js using synthetic data; it does not certify hosted Auth, SMTP, Storage HTTP, or any AI account.

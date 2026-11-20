# iholyshitcom

**让任何人都能获取有价值的信息。**

我公开这个项目，是为了推动新闻自由，让更多个人、独立编辑和小团队拥有建设信息入口的工具。事实应有出处，不确定之处应被说明，错误应允许更正。

We want to advance freedom of the press and help anyone access valuable information. By sharing reusable publishing code and technical principles, we hope to make independent publishing more accessible.

## 当前内容

这是一个独立、逐步整理的公开代码仓库。首批包含两个不依赖外部服务的通用模块：

- `src/homepage-dedup.mjs`：按内容类型和条目标识排除已在头条／精选中展示的条目。
- `src/related-articles.mjs`：按标签和标题实体匹配相关阅读，去除当前条目及重复项，容忍部分查询失败。
- `test/`：使用合成数据的本地测试。
- [architecture.md](architecture.md)：双语发布、受限投稿、幂等处理和发布状态的通用架构说明。

**当前不是完整网站发行版，也不具备一键部署能力。**其他可复用代码将在清理和独立验证后分批加入。

## 本地测试

需要 Node.js 20 或以上版本，无第三方依赖、数据库、API Key 或付费服务。

```bash
npm test
```

## 公开边界

这里只公开经过审查的通用代码和技术原理，不包含运行网站的域名与配置、品牌素材、文章、用户数据、机器人调教策略、内部记录或原私有 Git 历史。

## 许可证

代码许可证尚待维护者确认，目前没有宣布采用某一开源许可证。请勿将其误认为已经授予 MIT、Apache 或 GPL 许可。

## 维护者与联系

Lee — [jiegoo@gmail.com](mailto:jiegoo@gmail.com)

欢迎 GitHub 朋友交流和反馈；安全问题请私下联系，不要在公开 Issue 中发送密码、令牌或个人数据。

# Optional event worker / 可选事件任务

`workers/events` 只处理已发布文章的事件关联与摘要，不采集 RSS，不执行原站选题／写作策略。没有捆绑 GitHub 计划任务或外部账户配置。

本地离线测试：

```bash
python3.12 -m venv .venv
.venv/bin/python -m pip install -r workers/events/requirements.txt
PYTHONPATH=workers/events .venv/bin/python -m unittest discover -s workers/events/tests
```

真实运行需要部署者自行选择可用模型、检查供应商条款并配置：

| 环境变量 | 用途 |
| --- | --- |
| `NEWS_HOT_EVENTS_ENABLED` | 仅值为 `enabled` 时运行 |
| `NEWS_HOT_EVENTS_MODEL` | 部署者账户可用的模型 ID，无内置自动切换 |
| `NEWS_DEEPSEEK_API_KEY` | 独立的服务端供应商凭据 |
| `NEWS_DB_HOST` / `NEWS_DB_PORT` / `NEWS_DB_NAME` | 自己实例的连接位置 |
| `NEWS_DB_USER` / `NEWS_ARTICLE_DB_PASSWORD` | 自己的专用数据库身份及密码 |
| `NEWS_SUPABASE_CA_FILE` | 自己数据库的可信 CA 文件 |
| `NEWS_DB_SSLMODE` | 默认 `verify-full`，校验 TLS |

为自己的专用登录角色授予 `newsroom_article_worker` 角色；不使用网站浏览器账户或在仓库中放登录密码。执行：`PYTHONPATH=workers/events .venv/bin/python -m ingestion.hot_event_worker`。部署者自行安排调度和服务额度；启用真实调用会产生供应商费用。不要把密钥提交到 Git。

The optional worker groups already-published articles. It includes no RSS collector, private editorial strategy, production endpoints or schedule. Tests are offline. Real execution requires the explicitly enabled flag, a model available to your own account, your own provider credentials, and a dedicated TLS-verified database connection with the `newsroom_article_worker` role. There is no silent provider fallback. No live provider call was made during release verification.

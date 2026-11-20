# Public repository working rules

- This is a standalone public codebase; never copy private repository history, deployment settings, account data, articles, assets or private prompts into it.
- Keep code and documentation accurate, and preserve MIT and third-party notices.
- Read the relevant code before editing. Reuse existing patterns and dependencies; avoid unrelated changes.
- Validate all externally supplied content and identities. Do not relax authorization to make a test pass.
- Database changes use migrations. The initial baseline is for fresh independent instances only.
- Run tests for changed behavior. Use synthetic data, local services and mocked providers; never call paid APIs or operate a live site without explicit authorization.
- Never include credentials in code, logs, tests, issue bodies or commits. Real credentials are entered only in the deployer's own secret storage.
- Describe what was implemented and actually verified. Do not claim that local tests prove a hosted service, SMTP or provider account is configured.

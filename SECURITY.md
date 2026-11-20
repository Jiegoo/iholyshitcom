# Security

Report security issues privately to jiegoo@gmail.com. Include affected code, reproduction conditions and redacted evidence; do not post credentials, personal data or sensitive exploit details in a public issue.

Do not test against an operating website or accounts you do not own. Use the local synthetic test environment. Coordinate before any testing that could affect someone else's service.

There is no bug bounty or guaranteed response time. Secrets belong in the deployment's own server-side secret storage, never in frontend code, source files or Git history. A key accidentally committed to Git should be revoked or rotated rather than merely deleted from the latest file.

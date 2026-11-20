# Third-party components

The root MIT license covers the first-party code and documentation published in this repository. Third-party components retain their own copyright notices and licenses.

- `apps/web/public/social/`: Bootstrap social icons; the original MIT notice is retained in that directory's `LICENSE.txt`.
- JavaScript dependencies are identified and pinned by `package-lock.json`. Their source packages contain their respective license texts; those dependencies are not relicensed by this project's LICENSE.
- The optional Python event worker uses `psycopg`, pinned in `workers/events/requirements.txt`, under its upstream license.
- Generated database definitions use PostgreSQL and Supabase interfaces. No database contents or credentials are distributed.

The original operating site's articles, private configuration, branding, illustration library and robot strategies are not included in this distribution.

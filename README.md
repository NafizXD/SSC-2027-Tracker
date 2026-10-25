See [SETUP.md](SETUP.md) for the one-time free hosting and private sync setup.

Files included:
- `index.html` — responsive tracker + email login + per-user cloud snapshot sync
- `cloud-config.js` — fill in Supabase Project URL and public publishable/anon key
- `supabase-schema.sql` — private table with row-level security policies
- `service-worker.js`, `manifest.webmanifest`, `icons/` — installable PWA/offline shell
- `supabase.min.js` — locally bundled Supabase browser client

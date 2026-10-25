# Orbit SSC 2027 — website + private cloud sync

This is a mobile-friendly, installable web app. The hosted website is the same URL on your PC and phone. Progress is saved locally while offline and can sync to one private Supabase account when online.

## What the free setup needs

- A GitHub account for static hosting.
- A Supabase account/project for sign-in and the private progress database.
- One-time setup by you in those accounts. I cannot create or publish inside accounts I cannot access.

GitHub Pages publishes static files from a repository; with GitHub Free, the publishing repository needs to be public. The app source and the public Supabase publishable key will therefore be visible. **Your study progress is not stored in GitHub**; it is stored in Supabase with row-level security. Never put a Supabase `service_role` or secret key in this website.

## A. Make the private database

1. Create a project at [supabase.com](https://supabase.com/).
2. In the Supabase dashboard, open **SQL Editor → New query**.
3. Paste all of `supabase-schema.sql` and run it. This creates one private JSON backup row per signed-in user. Row-level security allows users to access only their own row.
4. Open **Project Settings → API** and copy the **Project URL** and the **publishable key** (or legacy `anon` key). Do not copy the `service_role`/secret key.
5. Edit `cloud-config.js` and replace both placeholders:
   - `https://YOUR-PROJECT-REF.supabase.co` → your Project URL.
   - `YOUR-PUBLISHABLE-OR-ANON-KEY` → your publishable/anon key.
6. In Supabase, go to **Authentication → URL Configuration**. After you know your GitHub Pages address (step B), set it as the **Site URL** and add it to **Redirect URLs**. Example: `https://YOUR-NAME.github.io/ssc-2027-tracker/`.
7. Make sure email sign-in is enabled under **Authentication → Providers → Email**. The app uses an email sign-in link; no password is stored in this app.

## B. Publish the website free on GitHub Pages

1. Create a **public** GitHub repository, for example `ssc-2027-tracker`.
2. Upload the contents of this folder to the repository root: `index.html`, `cloud-config.js`, `supabase.min.js`, `service-worker.js`, `manifest.webmanifest`, `icons/`, and `.nojekyll`.
3. In the repository, open **Settings → Pages**. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. Wait for GitHub Pages to publish. Your address will look like `https://YOUR-NAME.github.io/ssc-2027-tracker/`.
5. Go back to Supabase **Authentication → URL Configuration** and add that exact URL to **Site URL** and **Redirect URLs**. Save.
6. Open the website and choose **Settings & backup → Sync across PC and phone**. Enter your email, open the sign-in email on the same device, and return to the site.
7. The first time, choose **Upload this browser’s progress** if the browser already has the data you want to keep. On your other device, sign in with the same email; it will download the cloud copy.

## C. Add it to your phone like an app

- **Android:** open the published link in Chrome, then use **Install app** / **Add to Home screen** from the browser menu.
- **iPhone/iPad:** open the link in Safari, tap **Share → Add to Home Screen**.
- On a computer, use the browser's **Install app** icon/menu when available.

It works offline for the tracker itself. Cloud sign-in and syncing need internet. If you sign out, the browser’s local copy remains on that device.

## Important notes

- Use the **same email** on both devices.
- The cloud table is protected with row-level security; keep the SQL policies in place.
- The public publishable/anon key is expected in a browser app; security depends on the RLS policies. **Never publish a service-role or secret key.**
- Supabase's current Free plan is $0 and includes a small database/auth allowance; the provider says Free projects pause after a week of inactivity. See [Supabase pricing](https://supabase.com/pricing) before relying on it long-term.
- GitHub Pages sites are publicly viewable. Do not put private notes or credentials in the repository. User progress/notes go to the private Supabase table, not to the source files.
- `index.html` remains usable with local browser storage if cloud setup is not finished, but cross-device sync stays disabled until `cloud-config.js`, the SQL table, and allowed redirect URL are configured.

# MistiRinai — Setup Guide for Complete Beginners

This guide assumes you have never done this before. We'll go in this exact
order, because each step needs something from the one before it:

**1. VS Code (open the project)** → **2. Supabase (create the database)**
→ **3. VS Code (connect the project to Supabase, run it locally)**
→ **4. GitHub (save your code online)** → **5. Netlify (put it on the
internet)**

Take it one step at a time. Don't skip ahead — later steps need values
(like keys and URLs) that you'll copy from earlier steps.

---

## Before you start: install 3 programs

You only do this once, ever, on your computer.

1. **VS Code** — the program you'll write/edit code in.
   Go to https://code.visualstudio.com/ → click Download → install it like
   any normal program.

2. **Node.js** — lets your computer run JavaScript/TypeScript projects.
   Go to https://nodejs.org/ → download the **LTS** version → install it,
   clicking "Next" through the installer with default options.
   To check it worked: open VS Code, then open its built-in terminal
   (menu **Terminal → New Terminal**), type:
   ```bash
   node -v
   npm -v
   ```
   Press Enter. You should see two version numbers (like `v20.11.0` and
   `10.2.4`). If you see an error instead, restart your computer and try
   again — Node.js sometimes needs a restart to register.

3. **Git** — lets you save your code to GitHub.
   Go to https://git-scm.com/downloads → download → install with default
   options. Check it worked:
   ```bash
   git --version
   ```

---

## Step 1 — Open the project in VS Code

1. Unzip the `mistirinai.zip` file you were given, anywhere you like on
   your computer (e.g. your Desktop or Documents folder).
2. Open VS Code.
3. Menu **File → Open Folder...** → select the unzipped `mistirinai`
   folder → click **Select Folder** (or **Open** on Mac).
4. You should now see the file list on the left: `src`, `netlify`,
   `supabase`, `package.json`, and so on.
5. Open the terminal: **Terminal → New Terminal**. Make sure it shows
   you're inside the `mistirinai` folder (the prompt should end with
   `mistirinai>` or similar).
6. Install the project's dependencies (this downloads all the code
   libraries the project needs, like React):
   ```bash
   npm install
   ```
   This takes a minute or two the first time. You'll see a progress bar
   and then a summary. Some yellow "warnings" about deprecated packages
   are completely normal and safe to ignore — only worry about text that
   says "error".

Leave VS Code open — you'll come back to it in Step 3.

---

## Step 2 — Create your Supabase project (the database + file storage)

Supabase is the free service that stores your memories (in a database)
and your uploaded files (in private storage). Think of it as the
filing cabinet behind the scenes.

1. Go to https://supabase.com and click **Start your project**.
2. Sign up (GitHub sign-in is the fastest option if you already have a
   GitHub account — if not, use email).
3. Once logged in, click **New project**.
4. Fill in:
   - **Name**: `mistirinai` (or anything you like)
   - **Database password**: click "Generate a password", then **copy it
     somewhere safe** (a notes app) — you likely won't need it again for
     this project, but it's good practice to keep it.
   - **Region**: pick whichever is physically closest to you (lower
     latency = faster app).
   - **Plan**: Free is fine to start.
5. Click **Create new project**. Wait 1–2 minutes while Supabase sets
   things up (you'll see a progress screen).

### 2a. Run the database setup (SQL migrations)

1. In the Supabase left sidebar, click the **SQL Editor** icon (looks
   like `</>`).
2. Click **New query**.
3. Back in VS Code, open the file
   `supabase/migrations/0001_init.sql`. Select all its text (Ctrl+A /
   Cmd+A on Mac) and copy it (Ctrl+C / Cmd+C).
4. Paste it into the Supabase SQL editor. Click **Run** (bottom right, or
   Ctrl+Enter). You should see "Success. No rows returned."
5. Repeat exactly the same thing for
   `supabase/migrations/0002_storage_and_policies.sql`: open it in VS
   Code, copy all, paste into a **new query** in Supabase, click **Run**.

This created all your tables (`memories`, `calendar_events`, etc.) and a
private storage bucket called `memories`.

### 2b. Double-check the storage bucket is private

1. In the Supabase sidebar, click **Storage**.
2. You should see a bucket named `memories`.
3. Click on it, then check its settings (gear icon or "Configuration") —
   confirm **Public bucket is OFF**. If for any reason it shows as
   public, toggle it off and save. This is the single most important
   privacy setting in the whole project.

### 2c. Copy your Supabase keys

You'll need four values from Supabase. Keep this browser tab open.

1. In the Supabase sidebar, click the gear icon **Project Settings**,
   then **API** (or **Data API**, depending on the current Supabase
   layout).
2. You'll see:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`
   - **service_role** key (click "Reveal" if hidden) — another long
     string starting with `eyJ...`

   ⚠️ The **service_role** key is extremely sensitive — it has full
   access to your database, bypassing all privacy rules. Never put it
   in a file that starts with `VITE_`, never commit it to GitHub, and
   never paste it into frontend code. We'll only ever put it into
   Netlify's environment variables (Step 5) and your local `.env` file
   (which is never committed — see Step 3).

Keep this tab open, or copy these 3 values into a notes file for now:
Project URL, anon key, service_role key.

---

## Step 3 — Connect the project to Supabase and run it locally

Back in VS Code:

1. In the file list, find `.env.example` at the top level. Right-click
   it → **Copy**, then right-click the `mistirinai` folder (the very top
   one) → **Paste**. Rename the pasted copy to exactly `.env` (no
   `.example` at the end — in VS Code, right-click the new file →
   Rename).

   > If VS Code doesn't show a "paste" option in the file tree, you can
   > instead just create a new file called `.env` at the top level and
   > copy the entire contents of `.env.example` into it.

2. Open your new `.env` file and fill in the values using what you
   copied from Supabase in Step 2c, and one password of your choosing:

   ```
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co        ← your Project URL
   VITE_SUPABASE_ANON_KEY=eyJ...                           ← your anon public key

   SUPABASE_URL=https://abcdefgh.supabase.co               ← same Project URL again
   SUPABASE_SERVICE_ROLE_KEY=eyJ...                        ← your service_role key
   SUPABASE_STORAGE_BUCKET=memories

   INITIAL_ADMIN_PASSWORD=MistiRinai

   SESSION_SECRET=                                          ← see below
   SECURE_COOKIES=false
   SESSION_TTL_HOURS=12
   LOGIN_RATE_LIMIT_MAX=8
   LOGIN_RATE_LIMIT_WINDOW_MINUTES=15
   MAX_UPLOAD_MB_IMAGE=25
   MAX_UPLOAD_MB_VIDEO=500
   MAX_UPLOAD_MB_AUDIO=100
   MAX_UPLOAD_MB_DOCUMENT=25
   SIGNED_URL_TTL_SECONDS=300
   ```

   For `SESSION_SECRET`, you need a long random string. In the VS Code
   terminal, run:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   ```
   Copy the long string it prints out and paste it as the value of
   `SESSION_SECRET`.

   Note: `SECURE_COOKIES=false` is only for local testing on your own
   computer (`http://localhost`), because secure cookies require HTTPS.
   In Step 5 we'll set it back to `true` for the live Netlify site.

3. Save the `.env` file (Ctrl+S / Cmd+S).

4. Install the Netlify command-line tool globally, which lets you run
   the frontend and the backend functions together, exactly like they'll
   run in production:
   ```bash
   npm install -g netlify-cli
   ```

5. Start the local development server:
   ```bash
   netlify dev
   ```
   The first time, it may ask a few setup questions — just accept the
   defaults (or choose "no" if asked whether to link to an existing
   Netlify site — we'll do that properly in Step 5).

6. After a few seconds you'll see something like
   `Server now ready on http://localhost:8888`. Open that address in
   your browser.

7. You should see the animated **MistiRinai** login screen. Enter the
   password `MistiRinai` (or whatever you set as
   `INITIAL_ADMIN_PASSWORD`) and click **Enter Memory Booth**.

If it works, you're fully connected end-to-end locally: React frontend →
Netlify Functions → Supabase database & storage. Try adding a text
memory and a photo to confirm uploads work.

**If something goes wrong:** look at the terminal output in VS Code —
errors from the backend functions print there. The most common issues
are a typo in `.env` (double-check you copied the whole key, with no
extra spaces) or forgetting to run the SQL migrations in Step 2a.

To stop the server at any time, click into the terminal and press
`Ctrl+C`.

---

## Step 4 — Save your code to GitHub

GitHub is where your source code lives online — separate from Supabase
(your data) and Netlify (your live website).

1. Go to https://github.com and sign up (or log in).
2. Click the **+** icon (top right) → **New repository**.
3. Name it `mistirinai` (or anything). Leave it **Private** (recommended,
   since this is a personal project) or Public, your choice. **Do not**
   check "Add a README" or ".gitignore" — we already have those.
4. Click **Create repository**. GitHub will show you a page with some
   commands — keep that tab open.
5. Back in VS Code's terminal (still inside the `mistirinai` folder), run
   these commands one at a time, pressing Enter after each:
   ```bash
   git init
   git add .
   git commit -m "Initial commit — MistiRinai"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/mistirinai.git
   git push -u origin main
   ```
   Replace `YOUR-USERNAME` with your actual GitHub username (copy the
   exact URL from the GitHub page you kept open — it's shown there).

   If this is your first time using Git, it may ask you to log in to
   GitHub — a browser window will pop up; just follow the prompts to
   authorize.

6. Refresh your GitHub repository page in the browser. You should now
   see all your project files there.

7. **Double-check your secrets did NOT get uploaded:** on GitHub, use
   the search bar at the top of your repo and search for `.env`. You
   should see `.env.example` in the results but **not** `.env` itself —
   the `.gitignore` file is what keeps it out. This is an important
   safety check; if you ever do see a real `.env` file on GitHub,
   delete the repository, remove `.env` locally, and start Step 4 again.

---

## Step 5 — Deploy to Netlify (put it on the real internet)

1. Go to https://www.netlify.com and sign up/log in (using "Sign up with
   GitHub" is easiest, since it connects the two automatically).
2. Click **Add new site → Import an existing project**.
3. Choose **GitHub**, authorize Netlify to access your repositories if
   asked, then select your `mistirinai` repository from the list.
4. Netlify will try to auto-detect the build settings. Confirm they
   match:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - (Functions directory is picked up automatically from `netlify.toml`
     in the project, so you shouldn't need to set it.)
5. **Before clicking Deploy**, scroll down to **Environment variables**
   (or go to **Site configuration → Environment variables** after
   creating the site — either works). Add every single variable from
   your local `.env` file, one at a time (key on the left, value on the
   right):

   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |
   | `SUPABASE_URL` | your Supabase Project URL (same as above) |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key |
   | `SUPABASE_STORAGE_BUCKET` | `memories` |
   | `INITIAL_ADMIN_PASSWORD` | choose your real password now, e.g. `MistiRinai` or something only you know |
   | `SESSION_SECRET` | the long random string you generated in Step 3 (or generate a new one just for production) |
   | `SECURE_COOKIES` | `true` ← important: different from local! |
   | `SESSION_TTL_HOURS` | `12` |
   | `LOGIN_RATE_LIMIT_MAX` | `8` |
   | `LOGIN_RATE_LIMIT_WINDOW_MINUTES` | `15` |
   | `MAX_UPLOAD_MB_IMAGE` | `25` |
   | `MAX_UPLOAD_MB_VIDEO` | `500` |
   | `MAX_UPLOAD_MB_AUDIO` | `100` |
   | `MAX_UPLOAD_MB_DOCUMENT` | `25` |
   | `SIGNED_URL_TTL_SECONDS` | `300` |

6. Click **Deploy site**. Netlify will now install dependencies and
   build your project — this takes 1–3 minutes. You can watch the
   progress under the **Deploys** tab.
7. Once it says "Published", click the site URL Netlify gives you
   (something like `https://random-name-123.netlify.app`). You should
   see your MistiRinai login screen, live on the internet.

### Optional: a nicer URL

In Netlify, go to **Site configuration → Domain management → Options →
Edit site name** to change `random-name-123` to something like
`mistirinai-yourname` — your site becomes
`https://mistirinai-yourname.netlify.app`. (A fully custom domain like
`memories.yourname.com` is also possible from the same screen, but
requires you to own that domain separately.)

### Every time you make a change later

Whenever you edit code in VS Code and want the live site updated:

```bash
git add .
git commit -m "describe what you changed"
git push
```

Netlify automatically notices the new push to GitHub and rebuilds/
redeploys the site within a minute or two — you don't need to repeat any
of the Netlify setup steps.

---

## Verifying it's actually private (do this once, it matters)

Open a **private/incognito browser window** (so you're not logged in)
and visit your live Netlify URL:

1. You should see the login screen — never the dashboard.
2. Try guessing a wrong password a handful of times — after 8 tries
   within 15 minutes you should get a "Too many attempts" message.
3. With your browser's developer tools open (F12 → Network tab), copy
   the URL of an image you view inside the app, and try opening that
   exact URL in a new incognito tab a few minutes later — it should stop
   working after 5 minutes (that's the signed URL expiring, which is
   expected and correct).

If all three check out, your memories are genuinely private — not just
hidden behind a button in the interface.

---

## Changing the password later

1. In Supabase, go to **Table Editor → app_config**.
2. Delete the single row shown there (or edit `password_hash` to blank).
3. In Netlify, update the `INITIAL_ADMIN_PASSWORD` environment variable
   to the new password, then trigger a redeploy (**Deploys → Trigger
   deploy → Deploy site**).
4. The next login attempt will hash and store the new password
   automatically.

## If you get stuck

- **Blank page after deploy**: check Netlify's **Deploys** tab → click
  the failed deploy → read the build log for the actual error near the
  bottom.
- **"Something went wrong on our end" in the app**: check Netlify's
  **Functions** tab (or **Logs → Functions**) for the specific function
  that failed — the real error is logged there, even though the app
  itself never shows raw errors to you.
- **Login says password is wrong even though you're sure it's right**:
  double check `INITIAL_ADMIN_PASSWORD` doesn't have extra spaces, and
  that you cleared `app_config.password_hash` in Supabase if you changed
  the password after the first login ever happened.

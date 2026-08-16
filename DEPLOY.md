# Deploying Distill — first-time checklist

Follow these in order. Total time: ~15 minutes if you don't already have
Git/GitHub/Vercel accounts, ~5 minutes if you do.

## 1. Get the project onto your computer

Unzip the project folder you downloaded from this conversation. You should
end up with a `distill/` folder containing `index.html`, `css/`, `js/`,
`api/`, `package.json`, etc.

## 2. Install Git and create a GitHub account (skip if you already have both)

- Git: [git-scm.com/downloads](https://git-scm.com/downloads)
- GitHub account: [github.com/join](https://github.com/join)

## 3. Create a new, empty repository on GitHub

Go to [github.com/new](https://github.com/new):
- Name it (e.g. `distill`)
- Leave it **public or private**, your choice
- **Do NOT** check "Add a README" or "Add .gitignore" — your local folder
  already has those, and it'll cause a conflict when you push

Click **Create repository**. Keep the page open — it shows the exact
commands for the next step.

## 4. Push your project to GitHub

Open a terminal, `cd` into the `distill` folder you unzipped, then:

```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

Refresh the GitHub page — your files should now be there.

## 5. Get an Anthropic API key

- Go to [console.anthropic.com](https://console.anthropic.com) and sign up / log in
- Add billing (API usage isn't free — you'll need to add a card or prepay credits)
- Go to **Settings → API Keys → Create Key**
- Copy the key (starts with `sk-ant-...`) — you won't be able to see it again later

## 6. Import the repo into Vercel

- Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub
- Find your `distill` repo in the list and click **Import**
- Leave all settings as default (Vercel auto-detects the static files + `/api` function)
- Click **Deploy**

This first deploy will succeed for the site itself, but the summary
buttons won't work yet — that's expected, you haven't added the key.

## 7. Add your API key to Vercel

- In your new Vercel project, go to **Settings → Environment Variables**
- Add:
  - **Key:** `ANTHROPIC_API_KEY`
  - **Value:** the `sk-ant-...` key from step 5
  - **Environment:** Production (and Preview/Development if you want those to work too)
- Click **Save**

## 8. Redeploy and test

Vercel doesn't apply new environment variables to a deployment that
already ran, so trigger a fresh one:
- Go to the **Deployments** tab → find the latest deployment → click the
  **⋯** menu → **Redeploy**

Once that finishes, open the live URL Vercel gives you
(`your-project.vercel.app`). Upload or paste a document, click a format
tab, and confirm it actually generates a summary. That confirms the whole
chain — GitHub → Vercel → your API key → Anthropic — is working.

---

**If a format tab fails to generate:** open your browser's dev tools →
Network tab, click the tab again, and look at the response from
`/api/distill`. It will tell you directly (missing key, bad key, rate
limit, etc.) — that endpoint returns real error messages, not a silent
failure.

**Once this works**, everything else — a custom domain, real persistence
instead of the in-memory fallback, auth in front of `/api/distill` — is an
incremental improvement on a site that's already live. See the main
`README.md` for those.

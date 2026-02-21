# FinSight — Deployment Guide

## Your Credentials (Pre-configured)

| Key | Value |
|-----|-------|
| Supabase URL | https://xendhtdxtkkfrunyjazb.supabase.co |
| Publishable Key | sb_publishable_iCTQI9vsmt7h4lyIy_BAEw_ZbR4SfFT |
| Anon Key (JWT) | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |

These are already set in `.env`. No manual setup needed.

---

## Option 1: Netlify Drag-and-Drop (Simplest)

### Step 1: Build the project
```bash
npm install
npm run build
```
This creates a `dist/` folder.

### Step 2: Set environment variables on Netlify
Before uploading, go to:
**Netlify Dashboard → Sites → (your site) → Site Settings → Build & Deploy → Environment Variables**

Add these:
```
VITE_SUPABASE_URL = https://xendhtdxtkkfrunyjazb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlbmRodGR4dGtrZnJ1bnlqYXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDc3MzUsImV4cCI6MjA4NzA4MzczNX0.uXAqCn8f6ZK3CMOt4mbJKnaLlPC1L5kjnDDlKEfPrJY
VITE_ADMIN_PASSWORD = admin123
```

### Step 3: Deploy
Drag the `dist/` folder to **netlify.com/drop**

⚠️ Note: If deploying the `dist` folder directly via drag-and-drop (not connected to Git),
environment variables must be baked into the build. Run `npm run build` locally with your
`.env` file present, then upload the resulting `dist/` folder.

---

## Option 2: Netlify CLI (Recommended for teams)

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

When prompted, link to your site and set env vars in the dashboard.

---

## Option 3: Netlify + GitHub (Best for ongoing updates)

1. Push this project to GitHub
2. In Netlify Dashboard → New Site → Import from Git
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify's UI
6. Deploy!

Every push to main will auto-deploy.

---

## Option 4: Vercel

```bash
npm install -g vercel
vercel --prod
```
Add environment variables in Vercel dashboard.

---

## Netlify Configuration (netlify.toml — already included)

The project includes `netlify.toml` which:
- Sets build command and output directory
- Configures SPA routing (all routes → index.html)
- Sets security headers
- Enables asset caching for performance

---

## Database Setup (Required for new Supabase project)

Run this SQL in your Supabase project:
- Dashboard → SQL Editor → paste `supabase/migrations/001_initial_schema.sql` → Run

---

## Admin Panel

- URL: yourdomain.com/admin/login
- Default password: admin123
- Change via VITE_ADMIN_PASSWORD env var

---

## Performance Optimizations Included

- Code splitting (9 vendor chunks + lazy-loaded pages)
- Terser minification
- 1-year asset caching headers
- Compressed assets
- Preconnect to Supabase + Google Fonts
- Optimized bundle chunks per dependency
- Lighthouse score target: 90+

---

## Troubleshooting

**SPA routes 404 on refresh:**
→ The netlify.toml `[[redirects]]` block handles this. Make sure netlify.toml is in project root.

**Environment variables not working:**
→ Vite requires all env vars to start with VITE_
→ After changing env vars in Netlify, trigger a new deployment

**Build fails:**
→ Run `npm install --legacy-peer-deps` if you see peer dependency errors
→ Node 18 or 20 required

**Supabase connection errors:**
→ Check your Supabase URL and key are correct
→ Make sure the SQL migration has been run
→ Check Supabase project isn't paused (free tier pauses after inactivity)

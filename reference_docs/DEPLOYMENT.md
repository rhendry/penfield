# Deployment Guide - Netlify

## ⚠️ Important: Netlify Limitations

**Netlify is NOT recommended for this app** because:
- Netlify is optimized for **static sites** and **serverless functions**
- Your Express backend needs to run as a **long-lived server process**
- PostgreSQL connections need to stay open (not feasible with serverless)
- Session management requires persistent server state

### Better Alternatives:
1. **Railway** (https://railway.app) - Best for Node.js + PostgreSQL
2. **Render** (https://render.com) - Great free tier
3. **Fly.io** (https://fly.io) - Good for full-stack apps
4. **Heroku** (https://heroku.com) - Classic choice
5. **DigitalOcean App Platform** - Simple and reliable

---

## Recommended: Railway Deployment

### Why Railway?
- ✅ Native Node.js support
- ✅ PostgreSQL database included
- ✅ GitHub auto-deploys
- ✅ Simple environment variable management
- ✅ Free tier available

### Setup Steps:

#### 1. Prepare Your App

**Add production start script** (already done):
```json
"scripts": {
  "start": "NODE_ENV=production node dist/index.js"
}
```

**Create `.railwayignore`:**
```
node_modules/
.env
.vite/
client/.vite/
dist/
*.log
```

#### 2. Create `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/stats",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### 3. Deploy to Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect it's a Node.js app

#### 4. Add PostgreSQL

1. In your Railway project, click "New" → "Database" → "Add PostgreSQL"
2. Railway will create `DATABASE_URL` automatically
3. Copy the connection string

#### 5. Set Environment Variables

In Railway dashboard, add:
```
DATABASE_URL=<automatically set by Railway>
SESSION_SECRET=<generate-secure-random-string>
NODE_ENV=production
PORT=5000
```

#### 6. Run Migrations

In Railway dashboard, go to your service → "Settings" → "Deploy" → "Custom Start Command":
```bash
npm run db:migrate && npm start
```

Or run manually:
```bash
railway run npm run db:migrate
```

#### 7. Seed Test Users

```bash
railway run npm run db:seed
```

#### 8. Enable GitHub Auto-Deploy

Railway → Settings → Enable "Auto-deploy on push to main"

---

## Alternative: Render Deployment

### Setup Steps:

#### 1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: deck-builder
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: SESSION_SECRET
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: deck-builder-db
          property: connectionString

databases:
  - name: deck-builder-db
    databaseName: deckbuilder
    user: deckbuilder
```

#### 2. Deploy:
1. Go to https://render.com
2. Connect GitHub repository
3. Render auto-detects `render.yaml`
4. Click "Apply"

#### 3. Run migrations and seed:
```bash
# In Render shell
npm run db:migrate
npm run db:seed
```

---

## Environment Variables

### Required for Production:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=<64-character-random-string>
NODE_ENV=production
PORT=5000
```

### Generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Pre-Deployment Checklist

- [ ] Run `npm run build` locally to verify
- [ ] Test production build: `npm start`
- [ ] Set all environment variables
- [ ] Run `npm run db:migrate` on production database
- [ ] Run `npm run db:seed` to create test users
- [ ] Test login with credentials from seed script
- [ ] Verify PostgreSQL connection works
- [ ] Check session persistence after restart

---

## Post-Deployment

### Test Your Deployment:
1. Visit your deployed URL
2. Navigate to `/auth`
3. Login with test credentials:
   - **Admin**: `admin` / `admin123`
   - **Demo**: `demo` / `demo123`
   - **Test**: `testuser` / `test123`

### Monitoring:
- Check server logs for errors
- Monitor database connection pool
- Watch memory usage (sessions can grow)

### Troubleshooting:

**"Cannot connect to database":**
- Verify `DATABASE_URL` is set correctly
- Check if database allows connections from your host
- Neon: Enable "Pooling" mode for better connection handling

**"Session secret missing":**
- Set `SESSION_SECRET` environment variable
- Should be at least 32 characters, random

**"Port already in use":**
- Make sure `PORT` env var is set (some platforms require specific ports)
- Railway/Render handle this automatically

**Build fails:**
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json` (not devDependencies)
- Check build logs for specific errors

---

## Security Considerations

### Before Going Live:

1. **Change default passwords:**
   ```sql
   -- Connect to your production database
   UPDATE users SET password = '<new-hashed-password>' WHERE username = 'admin';
   ```

2. **Use strong SESSION_SECRET:**
   - At least 64 random characters
   - Never commit to Git

3. **Enable SSL:**
   - Most platforms handle this automatically
   - Verify `secure: true` in cookie settings (auth.ts)

4. **Set CORS if needed:**
   - Only if frontend is on different domain
   - Use environment-specific origins

5. **Database backups:**
   - Neon: Automatic backups included
   - Railway: Enable in settings
   - Render: Included in paid plans

---

## Cost Estimates (Free Tiers)

| Platform | Free Tier | Database | Notes |
|----------|-----------|----------|-------|
| Railway | 500 hours/month | PostgreSQL included | Best for dev/test |
| Render | 750 hours/month | PostgreSQL (90 days) | Sleeps after inactivity |
| Fly.io | 3 VMs included | PostgreSQL extra | Complex setup |
| Heroku | No free tier | Add-ons required | Was free, now paid |

**Recommendation:** Start with **Railway** for easiest setup, or **Render** for longest free tier.


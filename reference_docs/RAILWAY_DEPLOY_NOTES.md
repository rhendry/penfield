# Railway Deployment - Quick Reference

## ✅ Files Configured for Railway

- `.npmrc` - Uses legacy peer deps to handle React 19
- `nixpacks.toml` - Tells Railway how to build (Node 20, npm ci with legacy-peer-deps)
- `railway.json` - Railway configuration
- `.railwayignore` - Excludes unnecessary files

## 🚀 Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. Create Railway Project
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway auto-detects Node.js and deploys

### 3. Add PostgreSQL Database
1. In your Railway project dashboard
2. Click "New" → "Database" → "Add PostgreSQL"
3. Railway automatically sets `DATABASE_URL` environment variable

### 4. Set Environment Variables
Click on your service → "Variables" tab:
```
DATABASE_URL=<auto-set by Railway when you add Postgres>
SESSION_SECRET=<paste generated secret from below>
NODE_ENV=production
```

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Run Database Migrations
Option A - In Railway dashboard:
1. Click your service → "Settings"
2. Under "Deploy", add to "Custom Start Command":
   ```
   npm run db:migrate && npm start
   ```

Option B - Using Railway CLI:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migration
railway run npm run db:migrate

# Remove custom start command if you used Option A
```

### 6. Verify Deployment
1. Railway provides a URL (e.g., `your-app.up.railway.app`)
2. Visit `https://your-app.up.railway.app/auth`
3. Login with your existing credentials

## 🔧 Troubleshooting

### "npm ci failed" Error
✅ **Fixed!** We added `.npmrc` with `legacy-peer-deps=true` and `nixpacks.toml`

### Database Connection Issues
- Check that PostgreSQL is added to your project
- Verify `DATABASE_URL` is set automatically
- Neon: Make sure your Neon DB allows Railway's IPs (usually it does)

### "Cannot find module" Errors
- Make sure all dependencies are in `dependencies` (not `devDependencies`)
- Railway uses `npm ci` which installs from `package-lock.json`

### Build Succeeds but App Crashes
- Check Railway logs: Service → "Deployments" → Click latest → "View Logs"
- Common issue: Missing environment variables
- Check `SESSION_SECRET` is set

### Sessions Not Persisting
- Verify `SESSION_SECRET` is set
- Check that your PostgreSQL has the `session` table (created automatically by `connect-pg-simple`)

## 📝 Post-Deployment Checklist

- [ ] App loads at Railway URL
- [ ] Can access `/auth` page
- [ ] Can login with existing credentials
- [ ] Sessions persist after browser refresh
- [ ] Can create collections/cards/etc
- [ ] Database operations work
- [ ] Logout works

## 🔄 Continuous Deployment

Railway automatically redeploys when you push to GitHub!

```bash
# Make changes
git add .
git commit -m "Added new feature"
git push origin main
# Railway automatically detects and deploys
```

## 💰 Cost

**Free Tier:**
- $5 free credit per month
- ~500 hours of usage
- Includes PostgreSQL

**Paid:**
- $5/month for Hobby plan
- $20/month for Pro plan
- Only pay for what you use

## 🆘 Need Help?

1. **Railway Logs**: Service → Deployments → View Logs
2. **Railway Discord**: https://discord.gg/railway
3. **Docs**: https://docs.railway.app


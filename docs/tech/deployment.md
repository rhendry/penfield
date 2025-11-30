# Deployment Guide

Fieldpen is designed to be easily deployed to platforms that support Node.js and PostgreSQL, with **[Railway](https://railway.app/)** being the recommended target.

## Prerequisites
- A GitHub repository containing the Fieldpen code.
- A Railway account (or account on another PaaS like Render/Heroku).

## Deploying to Railway

### 1. Project Setup
1. Log in to Railway and create a **New Project**.
2. Select **Deploy from GitHub repo** and choose your Fieldpen repository.
3. Railway automatically detects the `package.json` and identifies it as a Node.js project.

### 2. Database Setup
1. In your Railway project, click **New** -> **Database** -> **Add PostgreSQL**.
2. This provisions a new Postgres instance and automatically provides a `DATABASE_URL` environment variable to your application service.

### 3. Configuration
1. The **Build Command** is configured as:
   ```bash
   npm run build
   ```
2. The **Start Command** is configured as:
   ```bash
   npm start
   ```
   *(Note: `npm start` runs `node dist/index.js`, which serves the built frontend and API)*

### 4. Environment Variables
The following variables are configured in the Railway service settings:
- `DATABASE_URL`: (Automatically set if you added Postgres in the same project)
- `PORT`: Railway sets this automatically (usually to `PORT` or expects the app to listen on `PORT`). Our app defaults to 5000 but respects the `PORT` env var.
- `NODE_ENV`: Set to `production`.

### 5. Deployment
- Railway triggers a deployment automatically on push to the main branch.
- Build logs and runtime logs are available in the Railway dashboard.

## Database Migrations

### Migration Creation
Database schema changes are defined in `shared/schema.ts`. Drizzle Kit generates SQL migration files based on changes to this schema.
```bash
npm run db:generate
```
This command compares the schema definition against the existing migration history and creates new SQL files in the `migrations/` directory.

### Local Application
Migrations are applied to the local development database using Drizzle Kit.
```bash
npm run db:migrate
```
This executes the pending SQL migration files against the local PostgreSQL instance defined in `DATABASE_URL`.

### Production Application
In the production environment, migrations are applied using the `deploy` script defined in `package.json`.

```bash
npm run deploy
```

**Configuration in Railway:**
This does *not* happen automatically. You must explicitly configure Railway to run this command.
1. Go to your service **Settings** in Railway.
2. Update the **Start Command** to chain the deploy script before starting the app:
   ```bash
   npm run deploy && npm start
   ```
   
This ensures that every time a new version is deployed, pending migrations are applied to the production database before the application starts serving traffic.

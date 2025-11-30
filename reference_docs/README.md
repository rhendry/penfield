# Deck Builder Prototyping Platform

Internal tool for rapid game mechanics exploration and simulation.

## Architecture

- **Backend**: Express.js + Drizzle ORM + Neon Postgres
- **Frontend**: React 19 + Vite + TanStack Query
- **Auth**: Passport.js (local strategy with PostgreSQL sessions)
- **Development**: Single process serving both API and frontend

## Development

### Prerequisites
- Node.js 18+
- Neon Postgres database (or any PostgreSQL instance)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL='postgresql://user:password@host/database?sslmode=require'
   SESSION_SECRET='your-secret-key-change-in-production'
   PORT=5000
   ```

3. **Run database migrations:**
   ```bash
   npm run db:generate  # Generate migration files from schema
   npm run db:migrate   # Apply migrations to database
   ```

### Running the App

**Development mode (recommended):**
```bash
npm run dev
```
This starts a single process on `http://localhost:5000` that serves:
- Backend API at `/api/*`
- Frontend with hot module replacement (HMR)

**Build for production:**
```bash
npm run build
npm start
```

### Development Workflow

1. **Start dev server:** `npm run dev`
2. **Visit:** `http://localhost:5000`
3. **First time:** Register a new user at `/auth`
4. **Make changes:** 
   - Edit files in `client/src/` (frontend)
   - Edit files in `server/` (backend - requires restart)
   - Edit `shared/schema.ts` (database schema)

### Database Changes

When modifying the database schema in `shared/schema.ts`:

1. Generate migration:
   ```bash
   npm run db:generate
   ```

2. Review the generated SQL in `migrations/`

3. Apply migration:
   ```bash
   npm run db:migrate
   ```

**Push schema directly (dev only):**
```bash
npm run db:push  # Directly syncs schema without migration files
```

### Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (backend + frontend) |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run check` | Type check with TypeScript |
| `npm run db:generate` | Generate migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:push` | Push schema directly to DB (dev only) |

## Project Structure

```
deck_builder_sim/
├── client/              # Frontend React app
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── hooks/       # Custom React hooks (auth, etc)
│       ├── lib/         # Utilities (query client, etc)
│       └── pages/       # Route pages
├── server/              # Backend Express app
│   ├── index.ts         # Entry point
│   ├── routes.ts        # API routes
│   ├── auth.ts          # Passport.js auth setup
│   ├── storage.ts       # Database operations
│   ├── db.ts            # Database connection
│   └── vite.ts          # Vite middleware for dev
├── shared/              # Shared types/schema
│   └── schema.ts        # Drizzle schema + Zod validation
├── migrations/          # Database migration files
└── .env                 # Environment variables (not in git)
```

## Features

### Core Entities
- **Collections**: Organize cards into themed sets
- **Cards**: Define game elements with arbitrary JSON attributes
- **Mechanics**: Codify game rules and logic
- **Decks**: Build card lists for gameplay
- **Scenarios**: Set up specific game states for testing
- **Simulations**: Run batch trials with statistical analysis
- **Game Sessions**: Interactive playthrough tracking

### Authentication
- Username/password authentication
- Session-based (PostgreSQL session store)
- Password hashing with scrypt

## Contributing

This is an internal tool. Follow SOLID principles:
- Single Responsibility: One class/function = one behavior
- Dependency Injection: Inject dependencies via constructor
- Async naming: Suffix async methods with `_async`
- Interfaces: Define abstract classes with ABC patterns
- Composition over inheritance

## Troubleshooting

**Port already in use:**
```bash
pkill -f "npm run dev"  # Kill existing dev servers
npm run dev             # Restart
```

**Database connection issues:**
- Verify `DATABASE_URL` in `.env`
- Check Neon dashboard for connection details
- Ensure database is provisioned and accessible

**Migration conflicts:**
- Review migration files in `migrations/`
- Manually resolve schema conflicts if needed
- Use `npm run db:push` to force sync (dev only)

**Type errors:**
```bash
npm run check  # Run TypeScript compiler
```


# Fieldpen Tech Stack

## Overview
Fieldpen is built as a monolithic full-stack TypeScript application. It uses a single process to serve both the backend API and the frontend application, simplifying development and deployment.

## Core Technologies

### Language
- **[TypeScript](https://www.typescriptlang.org/)**: Used across the entire stack (frontend, backend, shared types). Strict mode is enabled for type safety.

### Backend
- **[Express.js](https://expressjs.com/)**: The web server framework. Handles API requests and serves the frontend in production.
- **[Drizzle ORM](https://orm.drizzle.team/)**: Type-safe ORM for database interactions.
- **[Zod](https://zod.dev/)**: Schema validation, used in conjunction with Drizzle for type inference.

### Frontend
- **[React](https://react.dev/)**: UI library.
- **[Vite](https://vitejs.dev/)**: Build tool and development server. In development, it runs as middleware within Express to provide HMR.
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework.
- **[shadcn/ui](https://ui.shadcn.com/)**: Reusable component library built on Radix UI and Tailwind.
- **[TanStack Query](https://tanstack.com/query/latest)**: Data fetching and state management.
- **[wouter](https://github.com/molefrog/wouter)**: Minimalist routing for React.

## Database: PostgreSQL
We use **[PostgreSQL](https://www.postgresql.org/)** as our primary relational database.
- **Role**: Stores user data, assets, and application state.
- **Access**: Accessed via Drizzle ORM for type safety.
- **Migrations**: Managed using `drizzle-kit` to ensure schema consistency across environments.
- **Local Setup**: Developers run a local instance of Postgres.
- **Production**: Provisioned as a managed service (e.g., via Railway).

## Deployment: Railway
**[Railway](https://railway.app/)** is our chosen platform for deployment.
- **Integration**: Connects directly to the GitHub repository for continuous deployment.
- **Services**:
    - **Web Service**: Runs the Node.js application (Express + Vite build).
    - **Database Service**: Managed PostgreSQL instance.
- **Configuration**: Environment variables (like `DATABASE_URL`) are managed via the Railway dashboard.

## Development Workflow
The project is set up to run both backend and frontend with a single command:
```bash
npm run dev
```
This starts the Express server with Vite middleware, enabling full-stack hot reloading.

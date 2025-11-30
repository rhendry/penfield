# Deck Builder Prototyping Platform

## Overview

This is an internal tool designed for game designers to rapidly prototype and simulate deck builder game mechanics. The platform allows designers to create cards with arbitrary attributes, build decks, define game mechanics/rules, create test scenarios, and run batch simulations to analyze gameplay outcomes. The focus is on rapid iteration and data-driven design decisions rather than visual polish.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing:**
- React with TypeScript for type safety and component development
- Wouter for client-side routing (lightweight alternative to React Router)
- Single Page Application (SPA) architecture with protected routes requiring authentication

**State Management:**
- TanStack Query (React Query) for server state management and caching
- Local component state with React hooks for UI state
- Centralized query client configuration with custom error handling

**UI Component System:**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- "New York" style variant with productivity-focused design
- Custom color system supporting light/dark modes via CSS variables
- Typography using Inter for primary text and JetBrains Mono for code/data

**Design Philosophy:**
- Function-over-form approach prioritizing workflow efficiency
- Dense data presentation with clear information hierarchy
- Inspired by Linear (clean tables), Notion (flexible organization), and internal tools like Retool

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript for the REST API
- Session-based authentication using Passport.js with local strategy
- Custom middleware for request logging and JSON body parsing

**Authentication & Authorization:**
- Passport.js with local strategy (username/password)
- Session storage using PostgreSQL via connect-pg-simple
- Password hashing using Node.js crypto (scrypt algorithm with salts)
- Protected API routes requiring authentication
- User roles with admin flag support

**API Design:**
- RESTful endpoints organized by resource type (cards, decks, mechanics, scenarios, simulations)
- Standard CRUD operations (GET, POST, PATCH, DELETE)
- Centralized error handling with descriptive status codes
- Request/response logging for debugging

**Data Validation:**
- Drizzle-Zod integration for runtime schema validation
- Type-safe request/response handling with shared TypeScript types

### Data Storage

**Database:**
- PostgreSQL via Neon serverless
- Drizzle ORM for type-safe database queries and migrations
- Schema-first approach with TypeScript definitions

**Data Models:**

1. **Users** - Authentication and authorization
   - Username/password credentials
   - Admin role flag
   - Created timestamp

2. **Cards** - Flexible card definitions
   - Name and description
   - JSON-based arbitrary attributes (cost, damage, keywords, rarity, etc.)
   - Creator reference and timestamps
   - Rationale: JSON storage allows designers to prototype any card attribute without schema migrations

3. **Mechanics** - Game rule definitions
   - Name and description
   - Rule definition (stored as text/code/pseudo-code)
   - Creator reference and timestamps
   - Rationale: Text-based storage allows flexible rule representation (could be JavaScript, pseudo-code, or structured definitions)

4. **Collections** - Curated sets of distinct cards
   - Name and description
   - Array of unique card IDs (no duplicates)
   - Creator reference and timestamps
   - Rationale: Collections are definitional sets like "Fire Cards", "Starter Set", or "Expansion Pack 1" - each card appears only once

5. **Decks** - Gameplay card lists
   - Name and description
   - Array of card IDs (can include duplicates for gameplay)
   - Optional reference to a collection (for import)
   - Creator reference and timestamps
   - Rationale: Decks are built for actual gameplay and can have multiple copies of the same card (e.g., 3x "Fireball")

6. **Scenarios** - Test configurations
   - Name and description
   - Associated deck ID
   - Array of mechanic IDs (which rules apply)
   - JSON-based parameters for scenario configuration
   - Creator reference and timestamps

7. **Simulations** - Batch test runs
   - Name and associated scenario
   - Number of trials to run
   - Status tracking (pending, running, completed, failed)
   - JSON-based results storage
   - Runtime parameters and timestamps
   - Rationale: Flexible results storage allows capturing any simulation output data

**Migration Strategy:**
- Drizzle Kit for managing database migrations
- Schema changes tracked in `/migrations` directory
- Push-based deployment with `db:push` command

### External Dependencies

**Database Service:**
- Neon PostgreSQL (serverless, websocket-based connection)
- Connection via `@neondatabase/serverless` package
- Environment variable configuration (`DATABASE_URL`)

**UI Component Libraries:**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui as pre-styled component layer
- Lucide React for iconography

**Development Tools:**
- Vite for development server and production builds
- esbuild for server-side bundling
- TypeScript compiler for type checking
- Replit-specific plugins (cartographer, dev banner, runtime error overlay) for development environment

**Session Storage:**
- PostgreSQL-backed session store via connect-pg-simple
- Session secret from environment variables

**Build & Deployment:**
- Development: Vite dev server proxying to Express backend
- Production: Static frontend served by Express from `/dist/public`
- Server bundle created with esbuild targeting Node.js ESM

**Forms & Validation:**
- React Hook Form for form state management
- Zod schemas via Drizzle-Zod for validation
- @hookform/resolvers for Zod integration

**Date Handling:**
- date-fns for timestamp formatting and manipulation

## Recent Changes

### November 2, 2024 - Collection-Centric Refactor
- **Complete architectural change**: Cards now MUST belong to a collection (cannot exist independently)
- Schema changes:
  - Added required `collectionId` foreign key to cards table (with cascade delete)
  - Removed `cardIds` array from collections table
  - Cards reference their parent collection, collections own their cards
- Backend updates:
  - Added `getCardsByCollection` storage method
  - GET /api/cards supports optional `?collectionId=` filter
  - Card creation/update enforces collection requirement via Zod validation
- UI refactor:
  - Merged "Cards" and "Collections" into single "Collections & Cards" navigation item
  - New master-detail layout:
    - Left sidebar: Collections list with inline create/edit/delete
    - Right panel: Cards for selected collection
    - All forms use dialogs (no separate pages)
  - Card operations blocked until collection is selected
- Data integrity:
  - Collections are the primary organizing structure
  - Deleting a collection cascades to delete its cards
  - Decks continue to store card IDs (unchanged)
- Use case:
  - **Collections**: "Fire Cards", "Starter Set" - organizational units containing related cards
  - **Cards**: Individual game pieces that must belong to a collection
  - **Decks**: Gameplay builds that can pull cards from multiple collections

### November 2, 2024 - Game Sessions System
- Implemented complete game session persistence in database
- Auto-save every 10 seconds during play
- Comprehensive event logging system tracking all player actions
- Game history browser - load and continue previous sessions
- Arbitrary global game state management (add/remove any state variables)
- Real-time event log viewer with timestamps
- Each scenario playthrough creates a database-backed session
- Complete audit trail of draw, play, discard, shuffle, and state change events

### November 2, 2024 - Dashboard Removed
- Dashboard was removed per user feedback as it provided no value
- Home page now defaults to scenarios list (primary entry point)
- Scenarios list is the main landing page after login

### November 2, 2024 - Backend Pagination & Filtering for Deck Builder
- **Deck form UI improvements**:
  - Changed basic information layout from 1x4 to 2x2 grid for better space utilization
  - Fixed search box icon positioning with pointer-events-none
  - Reorganized attribute filters to display below search in full-width scrollable area
  - Improved card grid layout to 3-column responsive design matching Collections view
- **Backend pagination implementation**:
  - Added `queryCards()` method to storage interface with limit/offset pagination
  - GET /api/cards now supports pagination query parameters (limit, offset)
  - Returns `{ cards: Card[], total: number, attributeKeys: string[] }` format
  - Default page size: 30 cards
- **Backend filtering implementation**:
  - Search filter: Case-insensitive ILIKE search on card name and description
  - Collection filter: Filter cards by collectionId
  - Attribute filter: Filter cards that have ALL selected attributes (uses JSONB operators)
  - Contextual attribute keys: Returns only attribute keys from filtered cards (not full table scan)
- **Frontend pagination**:
  - Added pagination controls with Previous/Next buttons
  - Displays "Showing X-Y of Z cards" text
  - Page state automatically resets when filters change
  - Removed frontend filtering logic (now handled by backend)
- **Seed script**:
  - Created `scripts/seed.ts` to populate database with test data
  - Generates 6 thematic collections: Fire Cards, Ice Cards, Lightning Cards, Nature Cards, Dark Magic, Starter Set
  - Creates 100 cards distributed across collections with varied attributes
  - Each card has damage, cost, rarity, type, element, and keywords attributes
  - Run with: `npx tsx scripts/seed.ts`
- **Performance optimization**:
  - Attribute keys extracted from contextually filtered cards (based on search/collection)
  - Avoids unnecessary full table scans
  - Provides relevant attribute options based on current filter context
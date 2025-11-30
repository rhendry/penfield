# Design Guidelines: Deck Builder Prototyping & Simulation Platform

## Design Approach

**Selected Approach:** Design System - Productivity-Focused
**Rationale:** This is an internal tool for game designers emphasizing rapid prototyping and simulation over visual polish. The design should prioritize clarity, efficiency, and data comprehension.

**Reference Inspiration:** Linear (clean data tables, minimal interface), Notion (flexible content organization), Retool/internal tools (function-first dashboards)

**Core Design Principles:**
1. **Function over form** - Every element serves the prototyping workflow
2. **Information clarity** - Dense data presented readably
3. **Rapid interaction** - Quick access to common actions
4. **Flexible customization** - Support arbitrary card attributes and mechanics

---

## Typography

**Font Stack:**
- Primary: Inter (Google Fonts) - Clean, readable for data-dense interfaces
- Monospace: JetBrains Mono (Google Fonts) - For card attributes, JSON-like data structures

**Hierarchy:**
- Page Titles: text-2xl, font-semibold
- Section Headers: text-lg, font-medium
- Card/Item Titles: text-base, font-medium
- Body Text: text-sm, font-normal
- Labels/Meta: text-xs, font-medium, uppercase tracking-wide
- Monospace Data: text-sm, font-mono

---

## Layout System

**Spacing Units:** Tailwind primitives of **2, 4, 6, 8, 12, 16**
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Grid gaps: gap-4, gap-6
- Form field spacing: space-y-4

**Container Strategy:**
- Main app: max-w-7xl mx-auto px-6
- Modals/Panels: max-w-2xl (forms), max-w-4xl (simulation results)
- Sidebar navigation: w-64 fixed

---

## Component Library

### Navigation & Layout

**Top Navigation Bar:**
- Fixed header with logo/app name, primary nav links, user menu
- Height: h-16
- Items: Dashboard, Cards, Mechanics, Scenarios, Simulations, Admin (for admin only)

**Sidebar (Optional Secondary Nav):**
- Use for scenarios/simulation list when viewing detailed results
- Collapsible on smaller screens

### Core Components

**Card Definition Form:**
- Vertical form layout with labeled inputs
- Support for dynamic attribute addition (+ Add Attribute button)
- Attribute fields: Name (text), Type (select), Value (text/number)
- Preview panel showing card structure in JSON-like format

**Data Tables:**
- Sortable columns for cards, scenarios, simulation runs
- Row actions (Edit, Duplicate, Delete) on hover
- Pagination for large datasets
- Filters/search bar above table

**Scenario Builder:**
- Split view: Left panel (available cards/decks), Right panel (scenario setup)
- Drag-and-drop or click-to-add card selection
- Configuration panel for scenario parameters (starting energy, turn count, etc.)

**Simulation Runner:**
- Parameter input form (number of trials, ruleset selection)
- "Run Simulation" primary action button
- Progress indicator during execution
- Results section: Statistics cards, charts (win rate, average turns, distribution graphs)

**Mechanics/Rules Editor:**
- Code-like textarea with syntax hints
- Predefined templates dropdown
- Test/validate button before saving

### UI Elements

**Buttons:**
- Primary: Solid fill, medium weight
- Secondary: Outlined
- Danger: For delete actions
- Icon buttons: For table row actions
- Sizes: Small (forms), Medium (primary actions), Large (hero CTAs)

**Form Controls:**
- Text inputs: Clear labels above, helper text below
- Select dropdowns: Native styling with subtle custom arrow
- Checkboxes/radios: For boolean flags and options
- Number inputs: With increment/decrement controls for counters

**Cards (UI Containers):**
- Subtle border or shadow to define boundaries
- Padding: p-6
- Used for: Simulation results summaries, card previews, metric displays

**Modals:**
- Used for: Create new card/scenario, confirmation dialogs
- Backdrop with slight blur
- Close button in top-right
- Action buttons in footer (Cancel, Save/Create)

**Empty States:**
- Icon + message for empty card lists, no simulations run yet
- Clear CTA to create first item

### Data Visualization

**Statistics Display:**
- Metric cards showing: Total simulations run, average win rate, most used cards
- Grid layout: grid-cols-2 md:grid-cols-4 gap-4

**Charts (Use Chart.js or similar):**
- Bar charts: Card usage frequency
- Line charts: Performance over simulation iterations
- Pie/donut: Outcome distribution (win/loss/draw)

---

## Authentication & Admin

**Login Page:**
- Centered card (max-w-md) with simple username/password form
- "Deck Builder Prototyping Platform" title
- No hero imagery - clean, minimal

**Admin Panel:**
- User management table
- Create user form with role assignment (Admin/User)
- Password reset functionality

---

## Accessibility & Interaction

- All interactive elements keyboard navigable
- Focus states: ring-2 ring-offset-2
- Proper ARIA labels for dynamic content
- Form validation with clear error messages
- Loading states for async operations (simulation runs)

---

## Images

**No hero images or decorative imagery required.** This is a data-focused internal tool.

**Optional Icon Usage:**
- Font Awesome icons via CDN for: Navigation menu items, table row actions, empty states, metric card icons
- Small, subtle icons to aid recognition, not for decoration

---

## Page-Specific Layouts

**Dashboard:**
- Quick stats overview (4-column metric grid)
- Recent simulations table
- Quick actions: "Create New Card", "Run Simulation"

**Cards List:**
- Searchable, filterable data table
- Columns: Name, Type, Attributes count, Actions
- "Create New Card" button top-right

**Card Detail/Edit:**
- Two-column layout: Left (form), Right (preview)
- Attribute builder with add/remove rows

**Scenario Builder:**
- Three-section layout: Card library (left sidebar), Scenario setup (center), Parameters (right panel or tabs)

**Simulation Results:**
- Header: Scenario name, timestamp, parameters
- Statistics grid
- Charts section
- Detailed logs table (expandable rows for game-by-game breakdown)

---

**Overall Aesthetic:** Clean, minimal, data-centric interface inspired by modern productivity tools. Prioritize readability, rapid interaction, and clear information hierarchy over visual flourish. The design should feel professional and efficient, allowing game designers to focus on mechanics exploration rather than navigating complex UI.
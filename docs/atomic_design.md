# Atomic Design in Fieldpen

We use [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/) to organize our components. This methodology helps us create a consistent, reusable, and maintainable design system.

## Hierarchy

### 1. Atoms
Atoms are the basic building blocks of our user interface. They cannot be broken down any further without ceasing to be functional.
*   **Examples:** Buttons, Inputs, Labels, Icons, Colors, Typography.
*   **Location:** `client/src/components/ui` (mostly shadcn/ui primitives).

### 2. Molecules
Molecules are groups of atoms bonded together to be the smallest fundamental units of the compound. They take on their own properties and serve a single purpose.
*   **Examples:** Search bar (Input + Button), Form Field (Label + Input + Error Message), User Menu (Avatar + Dropdown).
*   **Location:** `client/src/components` (often composed of UI primitives).

### 3. Organisms
Organisms are groups of molecules joined together to form a relatively complex, distinct section of an interface.
*   **Examples:** Header, Footer, Pixel Editor, Project Card List.
*   **Location:** `client/src/components` or `client/src/components/editor`.

### 4. Templates
Templates consist of groups of organisms stitched together to form pages. They define the layout and structure but don't contain actual content.
*   **Examples:** Dashboard Layout, Auth Layout.
*   **Location:** `client/src/layouts` (if applicable) or defined within Page components.

### 5. Pages
Pages are specific instances of templates. They show what a UI looks like with real representative content in place.
*   **Examples:** Projects Page, Project Details Page, Login Page.
*   **Location:** `client/src/pages`.

## Usage Guidelines

1.  **Composition over Inheritance:** Build complex components by combining simpler ones.
2.  **Single Responsibility:** Each component should do one thing well.
3.  **Props Interface:** Define clear TypeScript interfaces for component props.
4.  **Styling:** Use Tailwind CSS utility classes. Avoid custom CSS files where possible.

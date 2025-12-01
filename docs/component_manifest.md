# Component Manifest

This document lists the components available in the Fieldpen application, categorized by their Atomic Design level.

## Atoms
*   **Button** (`components/ui/button.tsx`): Standard interactive button element.
*   **Input** (`components/ui/input.tsx`): Basic text input field.
*   **Label** (`components/ui/label.tsx`): Text label for form inputs.
*   **Select** (`components/ui/select.tsx`): Dropdown selection primitive.
*   **Toast** (`components/ui/toast.tsx`): Notification message element.
*   **Card** (`components/ui/card.tsx`): Container with border, background, and shadow.
*   **Dialog** (`components/ui/dialog.tsx`): Modal window primitive.
*   **DropdownMenu** (`components/ui/dropdown-menu.tsx`): Floating menu triggered by a button.

## Molecules
*   **Form** (`components/ui/form.tsx`): Wrapper for form handling using `react-hook-form`.
*   **ModeToggle** (`components/mode-toggle.tsx`): Button to switch between light/dark themes.
*   **ChangePasswordDialog** (`components/change-password-dialog.tsx`): Dialog containing the change password form.
*   **Toaster** (`components/ui/toaster.tsx`): Component to display multiple toasts.

## Organisms
*   **PixelEditor** (`components/editor/pixel-editor.tsx`): The core pixel art editing interface (Canvas + Color Picker + Tools).

## Pages
*   **ProjectsPage** (`pages/projects-page.tsx`): Dashboard for viewing and creating projects.
*   **ProjectDetailsPage** (`pages/project-details-page.tsx`): View for a single project and its assets.
*   **PixelEditorPage** (`pages/pixel-editor-page.tsx`): Full-page wrapper for the Pixel Editor.
*   **AuthPage** (`pages/auth-page.tsx`): Login and registration view.
*   **AdminDashboard** (`pages/admin-dashboard.tsx`): Administrative controls.
*   **NotFound** (`pages/not-found.tsx`): 404 error page.

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ProjectsPage from "@/pages/projects-page";
import ProjectDetailsPage from "@/pages/project-details-page";
import PixelEditorPage from "@/pages/pixel-editor-page";
import AdminDashboard from "@/pages/admin-dashboard";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/hooks/use-theme";

function Router() {
    return (
        <Switch>
            <ProtectedRoute path="/" component={ProjectsPage} />
            <ProtectedRoute path="/projects/:id" component={ProjectDetailsPage} />
            <ProtectedRoute path="/assets/:id/edit" component={PixelEditorPage} />
            <ProtectedRoute path="/admin" component={AdminDashboard} />
            <Route path="/auth" component={AuthPage} />
            <Route component={NotFound} />
        </Switch>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <AuthProvider>
                    <Router />
                    <Toaster />
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;

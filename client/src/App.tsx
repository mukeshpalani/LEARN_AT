import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import RoadmapsPage from "./pages/RoadmapsPage";
import DocumentsPage from "./pages/DocumentsPage";
import PythonLabPage from "./pages/PythonLabPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import RoleGuard from "./components/RoleGuard";

function Router() {
  return (
    <Switch>
      <Route path="/auth">{() => <AuthPage />}</Route>
      <Route path="/onboarding">{() => <OnboardingPage />}</Route>
      <Route path="/" component={Home} />
      <Route path="/roadmaps">
        {() => (
          <RoleGuard requiredRole="user">
            <div className="p-6 md:p-12 max-w-7xl mx-auto">
              <RoadmapsPage />
            </div>
          </RoleGuard>
        )}
      </Route>
      <Route path="/documents">
        {() => (
          <RoleGuard requiredRole="user">
            <div className="p-6 md:p-12 max-w-7xl mx-auto">
              <DocumentsPage />
            </div>
          </RoleGuard>
        )}
      </Route>
      <Route path="/python-lab">
        {() => (
          <RoleGuard requiredRole="user">
            <div className="p-6 md:p-12 max-w-7xl mx-auto">
              <PythonLabPage />
            </div>
          </RoleGuard>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <RoleGuard requiredRole="admin">
            <div className="p-6 md:p-12 max-w-7xl mx-auto">
              <AdminDashboardPage />
            </div>
          </RoleGuard>
        )}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Home from "@/pages/Home";
import AuthPage from "@/pages/AuthPage";
import UserDashboard from "@/pages/UserDashboard";
import WorkerDashboard from "@/pages/WorkerDashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect based on actual role
    if (user.role === 'worker') setLocation("/worker-dashboard");
    else setLocation("/dashboard");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected User Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={UserDashboard} allowedRoles={['user', 'admin']} />
      </Route>

      {/* Protected Worker Routes */}
      <Route path="/worker-dashboard">
        <ProtectedRoute component={WorkerDashboard} allowedRoles={['worker', 'admin']} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

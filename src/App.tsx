import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { SupportChat } from "@/components/SupportChat";

// Pages
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import PaymentPage from "@/pages/payment";
import DashboardPage from "@/pages/dashboard";
import SignalsPage from "@/pages/signals";
import BrokersPage from "@/pages/brokers";
import EAPage from "@/pages/ea";
import ScannerPage from "@/pages/scanner";
import ProfilePage from "@/pages/profile";
import AdminPage from "@/pages/admin/index";
import SupportPage from "@/pages/support";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: any }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen w-full flex items-center justify-center"><div className="animate-pulse-neon w-16 h-16 rounded-full" /></div>;
  if (!user) return <Redirect to="/login" />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Component />
      </main>
    </div>
  );
}

function AdminRoute({ component: Component }: { component: any }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen w-full flex items-center justify-center"><div className="animate-pulse-neon w-16 h-16 rounded-full" /></div>;
  if (!user || user.role !== "admin") return <Redirect to="/dashboard" />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Component />
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/payment" component={PaymentPage} />
      <Route path="/support" component={SupportPage} />
      
      <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
      <Route path="/signals"><ProtectedRoute component={SignalsPage} /></Route>
      <Route path="/brokers"><ProtectedRoute component={BrokersPage} /></Route>
      <Route path="/ea"><ProtectedRoute component={EAPage} /></Route>
      <Route path="/scanner"><ProtectedRoute component={ScannerPage} /></Route>
      <Route path="/profile"><ProtectedRoute component={ProfilePage} /></Route>
      
      <Route path="/admin"><AdminRoute component={AdminPage} /></Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
        <SupportChat />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

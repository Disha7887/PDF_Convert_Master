import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";

// Import pages
import { Body } from "@/pages/Body";
import { Contact } from "@/pages/Contact";
import { Pricing } from "@/pages/Pricing";
import { About } from "@/pages/About";
import { Tools } from "@/pages/Tools";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { TermsOfService } from "@/pages/TermsOfService";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import { Support } from "@/pages/Support";
import { Features } from "@/pages/Features";
import { LearnMore } from "@/pages/LearnMore";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Authentication routes */}
      <Route path="/login">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      
      <Route path="/register">
        {isAuthenticated ? <Dashboard /> : <Register />}
      </Route>

      {/* Protected Dashboard route */}
      <Route path="/dashboard">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>

      {/* Public pages */}
      <Route path="/">
        <Body />
      </Route>

      <Route path="/tools">
        <Tools />
      </Route>

      <Route path="/contact">
        <Contact />
      </Route>

      <Route path="/pricing">
        <Pricing />
      </Route>

      <Route path="/about">
        <About />
      </Route>

      <Route path="/features">
        <Features />
      </Route>

      <Route path="/learn-more">
        <LearnMore />
      </Route>

      <Route path="/terms">
        <TermsOfService />
      </Route>

      <Route path="/privacy">
        <PrivacyPolicy />
      </Route>

      <Route path="/support">
        <Support />
      </Route>

      {/* 404 Not Found */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
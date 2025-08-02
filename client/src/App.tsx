import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalLayout } from "@/components/GlobalLayout";
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
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      {/* Authentication routes - no header/footer for clean auth experience */}
      <Route path="/login">
        {isAuthenticated ? (
          <GlobalLayout>
            <Dashboard />
          </GlobalLayout>
        ) : (
          <Login />
        )}
      </Route>
      
      <Route path="/register">
        {isAuthenticated ? (
          <GlobalLayout>
            <Dashboard />
          </GlobalLayout>
        ) : (
          <Register />
        )}
      </Route>

      {/* Protected Dashboard route */}
      <Route path="/dashboard">
        {isAuthenticated ? (
          <GlobalLayout>
            <Dashboard />
          </GlobalLayout>
        ) : (
          <Login />
        )}
      </Route>

      {/* Public pages with full layout including header and footer */}
      <Route path="/">
        <GlobalLayout showHero={true}>
          <Body />
        </GlobalLayout>
      </Route>

      <Route path="/tools">
        <GlobalLayout>
          <Tools />
        </GlobalLayout>
      </Route>

      <Route path="/contact">
        <GlobalLayout>
          <Contact />
        </GlobalLayout>
      </Route>

      <Route path="/pricing">
        <GlobalLayout>
          <Pricing />
        </GlobalLayout>
      </Route>

      <Route path="/about">
        <GlobalLayout>
          <About />
        </GlobalLayout>
      </Route>

      <Route path="/features">
        <GlobalLayout>
          <Features />
        </GlobalLayout>
      </Route>

      <Route path="/learn-more">
        <GlobalLayout>
          <LearnMore />
        </GlobalLayout>
      </Route>

      <Route path="/terms">
        <GlobalLayout>
          <TermsOfService />
        </GlobalLayout>
      </Route>

      <Route path="/privacy">
        <GlobalLayout>
          <PrivacyPolicy />
        </GlobalLayout>
      </Route>

      <Route path="/support">
        <GlobalLayout>
          <Support />
        </GlobalLayout>
      </Route>

      {/* 404 Not Found */}
      <Route>
        <GlobalLayout>
          <NotFound />
        </GlobalLayout>
      </Route>
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
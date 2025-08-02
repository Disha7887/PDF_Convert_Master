import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavigationSection } from "@/pages/sections/NavigationSection";
import { FooterSection } from "@/pages/sections/FooterSection";
import { HeroSection } from "@/pages/sections/HeroSection";
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

// Layout wrapper for public pages (with header and footer)
function PublicPageLayout({ children, showHero = false }: { children: React.ReactNode; showHero?: boolean }) {
  return (

      </Route>

      {/* Public pages WITH header and footer */}
      <Route path="/">
        <PublicPageLayout showHero={true}>
          <Body />
        </PublicPageLayout>
      </Route>

      <Route path="/tools">
        <PublicPageLayout>
          <Tools />
        </PublicPageLayout>
      </Route>

      <Route path="/contact">
        <PublicPageLayout>
          <Contact />
        </PublicPageLayout>
      </Route>

      <Route path="/pricing">
        <PublicPageLayout>
          <Pricing />
        </PublicPageLayout>
      </Route>

      <Route path="/about">
        <PublicPageLayout>
          <About />
        </PublicPageLayout>
      </Route>

      <Route path="/features">
        <PublicPageLayout>
          <Features />
        </PublicPageLayout>
      </Route>

      <Route path="/learn-more">
        <PublicPageLayout>
          <LearnMore />
        </PublicPageLayout>
      </Route>

      <Route path="/terms">
        <PublicPageLayout>
          <TermsOfService />
        </PublicPageLayout>
      </Route>

      <Route path="/privacy">
        <PublicPageLayout>
          <PrivacyPolicy />
        </PublicPageLayout>
      </Route>

      <Route path="/support">
        <PublicPageLayout>
          <Support />
        </PublicPageLayout>
      </Route>

      {/* 404 Not Found */}
      <Route>
        <PublicPageLayout>
          <NotFound />
        </PublicPageLayout>
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
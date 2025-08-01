import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

import { Body } from "@/pages/Body";
import { Contact } from "@/pages/Contact";
import { Pricing } from "@/pages/Pricing";
import { About } from "@/pages/About";
import { Tools } from "@/pages/Tools";
import { Dashboard } from "@/pages/Dashboard";
import { UsageStatistics } from "@/pages/UsageStatistics";
import { APISetup } from "@/pages/APISetup";
import { APIReference } from "@/pages/APIReference";
import { ManagePlans } from "@/pages/ManagePlans";
import { LiveTools } from "@/pages/LiveTools";
import { TermsOfService } from "@/pages/TermsOfService";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";

function Router() {
  return (
    <Switch>
      {/* Dashboard routes without Layout */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/usage" component={UsageStatistics} />
      <Route path="/dashboard/api-setup" component={APISetup} />
      <Route path="/dashboard/api-reference" component={APIReference} />
      <Route path="/dashboard/manage-plans" component={ManagePlans} />
      <Route path="/dashboard/live-tools" component={LiveTools} />

      {/* Regular pages with Layout */}
      <Route>
        {(params) => (
          <Layout>
            <Switch>
              <Route path="/" component={Body} />
              <Route path="/tools" component={Tools} />
              <Route path="/contact" component={Contact} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/about" component={About} />
              <Route path="/terms-of-service" component={TermsOfService} />
              <Route path="/privacy-policy" component={PrivacyPolicy} />
              {/* Fallback to 404 */}
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

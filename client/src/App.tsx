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

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Add pages below */}
        <Route path="/" component={Body} />
        <Route path="/tools" component={Tools} />
        <Route path="/contact" component={Contact} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/about" component={About} />
        <Route path="/dashboard" component={Dashboard} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
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

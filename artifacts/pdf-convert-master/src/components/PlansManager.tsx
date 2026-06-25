import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Code2, Archive, FileImage, Loader2, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  type Plan,
  type UsageData,
  fetchPlans,
  fetchUsage,
  changePlan,
  formatBytes,
  formatLimit,
  usagePercent,
} from "@/lib/plans";
import type { User } from "@workspace/db";

export const PlansManager: React.FC = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    queryFn: fetchPlans,
  });

  const { data: usage } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
    queryFn: fetchUsage,
    enabled: isAuthenticated,
  });

  const currentPlanId = user?.plan ?? "free";
  const currentPlan = plans.find((p) => p.id === currentPlanId);
  const currentIndex = plans.findIndex((p) => p.id === currentPlanId);

  const mutation = useMutation({
    mutationFn: changePlan,
    onSuccess: (plan: Plan) => {
      if (user) {
        updateUser({ ...user, plan: plan.id } as User);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      toast({
        title: "Plan updated",
        description: `You're now on the ${plan.name} plan.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Could not change plan",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const meters =
    currentPlan && usage
      ? [
          {
            label: "API Calls",
            icon: Code2,
            used: usage.totals.apiCalls,
            limit: currentPlan.limits.apiCalls,
            fmt: (n: number) => n.toLocaleString(),
          },
          {
            label: "Storage",
            icon: Archive,
            used: usage.totals.dataProcessed,
            limit: currentPlan.limits.storageBytes,
            fmt: formatBytes,
          },
          {
            label: "Conversions",
            icon: FileImage,
            used: usage.totals.total,
            limit: currentPlan.limits.conversions,
            fmt: (n: number) => n.toLocaleString(),
          },
        ]
      : [];

  return (
    <>
      {isAuthenticated && currentPlan && (
        <>
          {/* Current Plan */}
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-900 mr-3">
                      Current Plan
                    </h2>
                    <Badge className="bg-[#f7433d]/10 text-[#f7433d] border-[#f7433d]/20 hover:bg-[#f7433d]/10">
                      Active
                    </Badge>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">
                    {currentPlan.name} Plan
                  </h3>
                  <p className="text-gray-600">
                    {currentPlan.price === 0
                      ? "Free forever"
                      : `$${currentPlan.price}/monthly`}{" "}
                    • {currentPlan.description}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Credit Balance (real data; credit packs are purchased in the mobile app) */}
          <Card className="mb-8">
            <div className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#f7433d]/10 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-[#f7433d]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  Credit Balance
                </h3>
                <p className="text-sm text-gray-600">
                  Buy credit packs in the PDF Genius mobile app — your balance is
                  shared across web and mobile.
                </p>
              </div>
              <span
                className="text-3xl font-bold text-[#f7433d]"
                data-testid="text-credit-balance"
              >
                {(user?.credits ?? 0).toLocaleString()}
              </span>
            </div>
          </Card>

          {/* Usage Statistics (real data) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {meters.map((m) => {
              const pct = usagePercent(m.used, m.limit);
              const Icon = m.icon;
              return (
                <Card key={m.label}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        {m.label}
                      </h3>
                      <Icon className="w-5 h-5 text-[#f7433d]" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                          {m.fmt(m.used)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {m.limit === 0
                            ? "not included"
                            : `of ${formatLimit(m.limit, m.fmt)}`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#f7433d] h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {m.limit < 0
                          ? "Unlimited"
                          : m.limit === 0
                            ? "Upgrade to unlock"
                            : `${pct}% used`}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Available Plans */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
        </CardHeader>
        <div className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => {
              const isCurrent = isAuthenticated && plan.id === currentPlanId;
              const isPending =
                mutation.isPending && mutation.variables === plan.id;

              let label = plan.cta;
              if (isAuthenticated) {
                if (isCurrent) label = "Current Plan";
                else if (currentIndex >= 0 && index < currentIndex)
                  label = "Downgrade";
                else label = "Upgrade";
              }

              const onClick = () => {
                if (!isAuthenticated) {
                  setLocation("/signup");
                  return;
                }
                if (isCurrent) return;
                mutation.mutate(plan.id);
              };

              return (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-6 relative flex flex-col h-full ${
                    isCurrent
                      ? "border-2 border-[#f7433d] bg-[#f7433d]/5"
                      : "border-gray-200"
                  }`}
                >
                  {plan.popular && !isCurrent && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f7433d] text-white border-[#f7433d] hover:bg-[#f7433d]">
                      Most Popular
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f7433d] text-white border-[#f7433d] hover:bg-[#f7433d]">
                      Your Plan
                    </Badge>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-end justify-center mb-2">
                      <span className="text-4xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600 ml-1">/month</span>
                    </div>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="w-5 h-5 text-[#f7433d] mr-3 shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full mt-auto ${
                      isCurrent
                        ? ""
                        : "bg-[#f7433d] hover:bg-[#d93832] text-white"
                    }`}
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || isPending}
                    onClick={onClick}
                    data-testid={`button-plan-${plan.id}`}
                  >
                    {isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {label}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </>
  );
};

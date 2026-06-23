/**
 * Subscription plan catalog — the single source of truth for both the web and
 * mobile clients. They fetch this via `GET /api/plans` so pricing, features and
 * usage limits always agree across platforms.
 *
 * `users.plan` stores a plan `id` (defaults to "free"). A user switches plans
 * via `POST /api/account/plan`, which persists the new id here.
 *
 * Limits use `-1` to mean "unlimited".
 */

export interface PlanLimits {
  /** Monthly developer-API calls. */
  apiCalls: number;
  /** Total processed-output storage, in bytes. */
  storageBytes: number;
  /** Monthly conversions. */
  conversions: number;
}

export interface Plan {
  id: string;
  name: string;
  /** Price in whole/decimal currency units for the billing period. */
  price: number;
  period: "month";
  description: string;
  popular: boolean;
  /** Call-to-action label shown on the plan card. */
  cta: string;
  features: string[];
  limits: PlanLimits;
}

const GB = 1024 * 1024 * 1024;

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "month",
    description: "For occasional conversions and trying things out.",
    popular: false,
    cta: "Get Started",
    features: [
      "50 conversions per month",
      "Files up to 25 MB",
      "All 27 conversion tools",
      "Standard processing speed",
      "Community support",
    ],
    limits: { apiCalls: 0, storageBytes: 1 * GB, conversions: 50 },
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    period: "month",
    description: "For professionals who convert every day.",
    popular: true,
    cta: "Upgrade to Pro",
    features: [
      "Unlimited conversions",
      "Files up to 100 MB",
      "API access (10,000 calls/mo)",
      "Priority processing",
      "Email support",
    ],
    limits: { apiCalls: 10000, storageBytes: 50 * GB, conversions: -1 },
  },
  {
    id: "business",
    name: "Business",
    price: 29,
    period: "month",
    description: "For teams that need scale, control and an SLA.",
    popular: false,
    cta: "Choose Business",
    features: [
      "Everything in Pro",
      "Files up to 500 MB",
      "Unlimited API access",
      "Team management",
      "Dedicated support & SLA",
      "Custom integrations",
    ],
    limits: { apiCalls: -1, storageBytes: 500 * GB, conversions: -1 },
  },
];

export const PLAN_IDS = PLANS.map((p) => p.id);

/** Case-insensitive lookup by plan id. */
export function getPlan(id: string | null | undefined): Plan | undefined {
  if (!id) return undefined;
  const needle = id.toLowerCase();
  return PLANS.find((p) => p.id.toLowerCase() === needle);
}

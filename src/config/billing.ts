import type { UserPlan } from "@/domain/user/entities";
import { FREE_AI_CHATS_PER_DAY, MARKETPLACE_COMMISSION_RATE, TRAIN_TWIN_LABEL } from "@/config/constants";

export type BillingProviderName = "STRIPE" | "RAZORPAY";

export type PlanDefinition = {
  readonly id: UserPlan;
  readonly name: string;
  readonly description: string;
  readonly priceCentsMonthly: number;
  readonly currency: "USD";
  readonly features: readonly string[];
  readonly unlimitedAi: boolean;
  readonly businessWorkspace: boolean;
};

export const PLAN_CATALOG: Record<UserPlan, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Free",
    description: "Start indexing your intelligence.",
    priceCentsMonthly: 0,
    currency: "USD",
    features: [
      `${FREE_AI_CHATS_PER_DAY} Twin chats / day`,
      TRAIN_TWIN_LABEL,
      "Public profile & marketplace",
    ],
    unlimitedAi: false,
    businessWorkspace: false,
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    description: "Unlimited Twin AI for serious experts.",
    priceCentsMonthly: 2900,
    currency: "USD",
    features: [
      "Unlimited Twin chats",
      "Voice Twin (STT + TTS)",
      "Public API access",
      "Public Twin + marketplace selling",
    ],
    unlimitedAi: true,
    businessWorkspace: false,
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    description: "Company workspaces and team knowledge.",
    priceCentsMonthly: 9900,
    currency: "USD",
    features: [
      "Everything in Pro",
      "Company workspaces + seats",
      "Shared org Twin + knowledge",
      "Admin controls foundation",
    ],
    unlimitedAi: true,
    businessWorkspace: true,
  },
};

export function getPlanDefinition(plan: UserPlan): PlanDefinition {
  return PLAN_CATALOG[plan];
}

export function hasUnlimitedAi(plan: UserPlan): boolean {
  return PLAN_CATALOG[plan].unlimitedAi;
}

export function calculateMarketplaceSplit(grossAmountCents: number): {
  commissionRate: number;
  commissionCents: number;
  netAmountCents: number;
} {
  const commissionCents = Math.round(
    grossAmountCents * MARKETPLACE_COMMISSION_RATE,
  );
  return {
    commissionRate: MARKETPLACE_COMMISSION_RATE,
    commissionCents,
    netAmountCents: grossAmountCents - commissionCents,
  };
}

export function getStripePriceId(plan: Exclude<UserPlan, "FREE">): string | null {
  if (plan === "PRO") {
    return process.env.STRIPE_PRICE_PRO ?? null;
  }
  return process.env.STRIPE_PRICE_BUSINESS ?? null;
}

export function getRazorpayPlanId(plan: Exclude<UserPlan, "FREE">): string | null {
  if (plan === "PRO") {
    return process.env.RAZORPAY_PLAN_PRO ?? null;
  }
  return process.env.RAZORPAY_PLAN_BUSINESS ?? null;
}

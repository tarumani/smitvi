import { hasUnlimitedAi } from "@/config/billing";
import { FREE_AI_CHATS_PER_DAY } from "@/config/constants";
import type { UserPlan } from "@/domain/user/entities";

export type Entitlements = {
  readonly plan: UserPlan;
  readonly unlimitedAi: boolean;
  readonly dailyAiChatLimit: number | null;
  readonly canSellOnMarketplace: boolean;
  readonly businessWorkspace: boolean;
  readonly publicApi: boolean;
  readonly voiceTwin: boolean;
};

export function getEntitlements(plan: UserPlan): Entitlements {
  const unlimitedAi = hasUnlimitedAi(plan);
  const paid = plan === "PRO" || plan === "BUSINESS";
  return {
    plan,
    unlimitedAi,
    dailyAiChatLimit: unlimitedAi ? null : FREE_AI_CHATS_PER_DAY,
    canSellOnMarketplace: plan === "PRO" || plan === "BUSINESS" || plan === "FREE",
    businessWorkspace: plan === "BUSINESS",
    publicApi: paid,
    voiceTwin: paid,
  };
}

import { ROUTES, TRAIN_TWIN_LABEL } from "@/config/constants";

export type LaunchStepId =
  | "profile"
  | "knowledge"
  | "twin"
  | "book"
  | "monetize";

export type LaunchStep = {
  id: LaunchStepId;
  shortLabel: string;
  listLabel: string;
  title: string;
  description: string;
  done: boolean;
  href: string;
  action: string;
};

export function buildLaunchSteps(input: {
  username: string;
  knowledgeCount: number;
  twinReady: boolean;
  consultationsEnabled: boolean;
  listingCount: number;
}): LaunchStep[] {
  const {
    username,
    knowledgeCount,
    twinReady,
    consultationsEnabled,
    listingCount,
  } = input;

  return [
    {
      id: "profile",
      shortLabel: "Hub",
      listLabel: "Profile activated",
      title: "Your Intelligence Hub is live",
      description:
        "Your @username and public profile are set. Visitors can find you — next, give your Twin something to say.",
      done: true,
      href: ROUTES.publicProfile(username),
      action: "View public hub",
    },
    {
      id: "knowledge",
      shortLabel: "Train",
      listLabel: "Upload at least one knowledge source",
      title: "Upload your first knowledge source",
      description:
        "LinkedIn, Notion, PDFs, or pasted text — your Twin learns from what you already know.",
      done: knowledgeCount > 0,
      href: `${ROUTES.hub.intelligence}?from=launch`,
      action: TRAIN_TWIN_LABEL,
    },
    {
      id: "twin",
      shortLabel: "Twin",
      listLabel: "Twin live (source processed)",
      title: "Get your Twin to Ready",
      description:
        "We process each source into answers with citations. When status shows READY, test chat on your hub.",
      done: twinReady,
      href: `${ROUTES.hub.intelligence}?from=launch`,
      action: twinReady ? "Add more knowledge" : "Finish training",
    },
    {
      id: "book",
      shortLabel: "Book",
      listLabel: "Enable Book tab (consultations)",
      title: "Enable the Book tab",
      description:
        "Let visitors request paid or free consultations from your public hub — alongside Twin chat.",
      done: consultationsEnabled,
      href: consultationsEnabled
        ? `${ROUTES.consultationSettings}?from=launch`
        : `${ROUTES.consultationSettings}?from=launch`,
      action: consultationsEnabled ? "Edit booking offer" : "Enable booking",
    },
    {
      id: "monetize",
      shortLabel: "Sell",
      listLabel: "Publish a marketplace offer",
      title: "Publish a marketplace offer",
      description:
        "Package your expertise as a listing buyers can purchase — consultations, packs, or services.",
      done: listingCount > 0,
      href:
        listingCount > 0
          ? `${ROUTES.hub.marketplace}?from=launch`
          : `${ROUTES.marketplaceSell}?from=launch`,
      action: listingCount > 0 ? "Manage listings" : "Create listing",
    },
  ];
}

export function isLaunchWizardComplete(input: {
  knowledgeCount: number;
  twinReady: boolean;
  consultationsEnabled: boolean;
  listingCount: number;
}): boolean {
  return (
    input.knowledgeCount > 0 &&
    input.twinReady &&
    input.consultationsEnabled &&
    input.listingCount > 0
  );
}

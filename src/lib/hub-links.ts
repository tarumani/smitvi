import { ROUTES } from "@/config/constants";
import { getExampleHubByUsername } from "@/config/example-hubs";

/** Public hub profile — live Twin or curated example page (never a dead @profile). */
export function hubProfileHref(username: string, isLive: boolean): string {
  if (isLive) return ROUTES.publicProfile(username);
  const example = getExampleHubByUsername(username);
  if (example) return ROUTES.exampleHub(example.slug);
  return ROUTES.signup;
}

/** Twin chat entry — live chat or example hub anchor / product info. */
export function hubTwinChatHref(username: string, isLive: boolean): string {
  if (isLive) return ROUTES.publicTwinChat(username);
  const example = getExampleHubByUsername(username);
  if (example) return `${ROUTES.exampleHub(example.slug)}#twin-chat`;
  return ROUTES.productTwinChat;
}

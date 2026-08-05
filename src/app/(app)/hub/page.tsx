import { redirect } from "next/navigation";
import { ROUTES } from "@/config/constants";

export default function HubIndexPage() {
  redirect(ROUTES.hub.dashboard);
}

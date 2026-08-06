import { redirect } from "next/navigation";
import { ROUTES } from "@/config/constants";

/** Developers docs hidden from nav for now; route kept for easy restore. */
export default function DevelopersPage() {
  redirect(ROUTES.home);
}

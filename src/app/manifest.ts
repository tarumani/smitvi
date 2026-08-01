import type { MetadataRoute } from "next";
import { APP_NAME, APP_TAGLINE } from "@/config/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_TAGLINE,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#070b14",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    categories: ["business", "productivity", "education"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-ZJXYL2S12J";

export const GA_ENABLED = Boolean(GA_MEASUREMENT_ID);

import { formatInrFromMinorUnits } from "@/lib/format-money";

export function formatListingPrice(priceCents: number, currency: string): string {
  const code = currency.toUpperCase();
  if (code === "INR") {
    return formatInrFromMinorUnits(priceCents);
  }
  const amount = priceCents / 100;
  const formatted =
    amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
  return code === "USD" ? `$${formatted}` : `${formatted} ${code}`;
}

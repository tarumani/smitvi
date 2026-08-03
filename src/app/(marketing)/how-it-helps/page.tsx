import type { Metadata } from "next";
import { HowItHelps } from "@/components/landing/how-it-helps";
import { HowItWorks } from "@/components/landing/how-it-works";

export const metadata: Metadata = {
  title: "How it helps",
  description:
    "How Smitvi Knowledge Twins help experts scale, learners get answers, and teams keep knowledge alive.",
};

export default function HowItHelpsPage() {
  return (
    <>
      <HowItHelps showPageLink={false} />
      <HowItWorks />
    </>
  );
}

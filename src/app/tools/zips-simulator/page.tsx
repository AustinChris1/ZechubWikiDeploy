// src/app/tools/zip-simulator/page.tsx

import type { Metadata } from "next";
import ZipSimulator from "@/components/ZipSimulator/ZipSimulator";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ZIP Simulator — ZecHub",
  description:
    "Interactively explore Zcash Improvement Proposals (ZIPs). Adjust real parameters and see projected impact on fees, privacy, miner revenue, and the Zcash network.",
  openGraph: {
    title: "ZIP Simulator — ZecHub",
    description:
      "Play with sliders and watch how each ZIP changes Zcash in real-time. Educational, data-driven, built for the Zcash community.",
    url: "https://zechub.wiki/tools/zip-simulator",
  },
};

export default function ZipSimulatorPage() {
  return <ZipSimulator />;
}
// src/app/wallets/page.tsx

export const dynamic = "force-dynamic"; // prevent build-time crashes

import React from "react";
import Image from "next/image";
import { getFileContentCached, getRootCached } from "@/lib/authAndFetch";
import { getDictionary } from "@/lib/getDictionary";
import { getBanner, genMetadata } from "@/lib/helpers";
import { parseMarkdown } from "@/lib/parseMarkdown";
import WalletList from "@/components/Wallet/WalletList";
import { Metadata } from "next";

const imgUrl = getBanner(`using-zcash`);

type WalletsDictionary = {
  pages?: {
    wallets?: {
      title?: string;
      noData?: string;
      bannerAlt?: string;
    };
  };
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const dict = (await getDictionary()) as WalletsDictionary;

    return genMetadata({
      title: dict.pages?.wallets?.title || "Wallets | Zechub",
      url: "https://zechub.wiki/wallets",
      image: imgUrl,
    }) as Metadata;
  } catch (e) {
    console.error("Metadata error:", e);

    return {
      title: "Wallets | Zechub",
    };
  }
}

export default async function Page() {
  const url = `/site/using-zcash/wallets.md`; // FIXED casing
  const urlRoot = `/site/using-zcash`;

  let markdown: string | null = null;
  let roots: any = null;

  // 🔥 Safe fetch (won't crash build)
  try {
    [markdown, roots] = await Promise.all([
      getFileContentCached(url),
      getRootCached(urlRoot),
    ]);
  } catch (error) {
    console.error("Wallet fetch failed:", error);
  }

  // 🔥 Safe dictionary
  let dict: WalletsDictionary = {};
  try {
    dict = (await getDictionary()) as WalletsDictionary;
  } catch (e) {
    console.error("Dictionary fetch failed:", e);
  }

  // 🔥 Safe content fallback
  const content =
    markdown ||
    dict.pages?.wallets?.noData ||
    "Wallet data is currently unavailable.";

let walletsParsed: any[] = [];

try {
  walletsParsed = parseMarkdown(String(content));
} catch (e) {
  console.error("Markdown parse failed:", e);
}

  return (
    <main>
      <div className="flex justify-center w-full mb-5 bg-transparent rounded pb-4">
        <Image
          className="w-full mb-5 object-cover"
          alt={dict.pages?.wallets?.bannerAlt || "wiki-banner"}
          width={800}
          height={50}
          src={imgUrl ?? "/wiki-banner.avif"}
        />
      </div>

      <div
        id="content"
        className={`flex flex-col space-y-5 px-4 ${
          roots && roots.length > 0
            ? "md:flex-row md:space-x-5"
            : "md:flex-col"
        } h-auto w-full py-5 2xl:w-[50%] m-auto`}
      >
        <section className="h-auto w-full">
          <div>
            {walletsParsed && walletsParsed.length > 0 ? (
              <WalletList allWallets={walletsParsed} />
            ) : (
              <p className="text-center text-gray-500">
                {dict.pages?.wallets?.noData ||
                  "No wallet data available."}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
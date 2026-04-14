// src/lib/zipSimulatorData.ts
// Complete ZIP data for the ZIP Simulator — separated from UI component

export type SliderConfig = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
  tooltip: string;
};

export type MetricResult = {
  id: string;
  label: string;
  unit: string;
  description: string;
  compute: (values: Record<string, number>, baseStats: BaseNetworkStats) => number[];
  format: (v: number) => string;
  color: string;
  beforeLabel: string;
  afterLabel: string;
};

export type ZIPData = {
  id: string;
  number: string;
  title: string;
  category: "fees" | "privacy" | "assets" | "protocol" | "sustainability" | "governance";
  status: "Active" | "Draft" | "Proposed" | "NU7 Candidate" | "Final";
  icon: string;
  shortDesc: string;
  plainEnglish: string;
  keyChanges: string[];
  sliders: SliderConfig[];
  defaultValues: Record<string, number>;
  metrics: MetricResult[];
  learnMoreUrl: string;
};

export type BaseNetworkStats = {
  avgTxPerDay: number;
  shieldedPercent: number;
  orchardPercent: number;
  avgLogicalActions: number;
  marginalFeeZats: number;
  currentAvgFeeZats: number;
  totalSupply: number;
  minerRevenuePerDay: number;
  privacySetSize: number;
};

// ─── Real mainnet baseline stats ──────────────────────────────────────────────
export const BASE_STATS: BaseNetworkStats = {
  avgTxPerDay: 8000,
  shieldedPercent: 42,
  orchardPercent: 28,
  avgLogicalActions: 5.46,
  marginalFeeZats: 5000,
  currentAvgFeeZats: 27300,
  totalSupply: 16800000,
  minerRevenuePerDay: 720,
  privacySetSize: 4200000,
};

// ─── Formatters ───────────────────────────────────────────────────────────────
export const fmtPct = (v: number) => `${v.toFixed(1)}%`;
export const fmtZEC = (v: number) => `${v.toFixed(2)} ZEC`;
export const fmtZats = (v: number) => `${Math.round(v).toLocaleString()} zats`;
export const fmtK = (v: number) =>
  v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : `${Math.round(v)}`;
export const fmtUSD = (v: number) => `$${Math.round(v).toLocaleString()}`;
export const fmtKB = (v: number) => `${v.toFixed(1)} KB`;
export const fmtZatsPlus = (v: number) => `+${Math.round(v).toLocaleString()} zats`;

// ─── Category styling ─────────────────────────────────────────────────────────
export const CAT_STYLES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  fees:           { label: "Fees",           color: "#f4a261", bg: "rgba(244,162,97,0.12)" },
  privacy:        { label: "Privacy",        color: "#6a4c93", bg: "rgba(106,76,147,0.12)" },
  assets:         { label: "Assets",         color: "#52b788", bg: "rgba(82,183,136,0.12)" },
  protocol:       { label: "Protocol",       color: "#457b9d", bg: "rgba(69,123,157,0.12)" },
  sustainability: { label: "Sustainability", color: "#2a9d8f", bg: "rgba(42,157,143,0.12)" },
  governance:     { label: "Governance",     color: "#e9c46a", bg: "rgba(233,196,106,0.12)" },
};

// ─── Status styling ───────────────────────────────────────────────────────────
export const STATUS_STYLES: Record<
  string,
  { color: string; bg: string; pulse: boolean }
> = {
  Active:           { color: "#52b788", bg: "rgba(82,183,136,0.15)",  pulse: true },
  Draft:            { color: "#888",    bg: "rgba(136,136,136,0.12)", pulse: false },
  Proposed:         { color: "#f4a261", bg: "rgba(244,162,97,0.12)",  pulse: false },
  "NU7 Candidate":  { color: "#67d3e0", bg: "rgba(103,211,224,0.15)", pulse: true },
  Final:            { color: "#2a9d8f", bg: "rgba(42,157,143,0.15)",  pulse: false },
};

// ─── Network stats for the overview bar ───────────────────────────────────────
export const NETWORK_STATS = [
  { label: "TX/day",     value: "~8,000",  sub: "mainnet" },
  { label: "Shielded",   value: "42%",     sub: "of all TX" },
  { label: "Orchard",    value: "28%",     sub: "of TX" },
  { label: "Fee/action", value: "5K zats", sub: "ZIP 317" },
  { label: "Privacy set",value: "4.2M",    sub: "notes" },
  { label: "Supply",     value: "16.8M",   sub: "ZEC" },
];

// ─── ZIP Data (10 ZIPs) ──────────────────────────────────────────────────────
export const ZIPS: ZIPData[] = [
  // ── ZIP 317 ─────────────────────────────────────────────────────────────────
  {
    id: "317",
    number: "ZIP 317",
    title: "Proportional Transfer Fee",
    category: "fees",
    status: "Active",
    icon: "⚖️",
    shortDesc: "Fees scale with TX complexity — ended sandblasting spam attacks",
    plainEnglish:
      'Before ZIP 317, everyone paid a flat 1,000 zatoshi fee regardless of transaction size. Attackers exploited this to spam the network with massive "sandblasting" transactions. ZIP 317 charges 5,000 zatoshis per logical action (input or output) with a 2-action minimum. Ordinary sends cost roughly the same; spam becomes prohibitively expensive. Active since April 2023.',
    keyChanges: [
      "Fee = max(base_fee, marginal_fee × logical_actions)",
      "5,000 zatoshis per logical action",
      "2-action grace window — typical sends stay cheap",
      "Ended the 2023 sandblasting spam attack",
      "Standard in Zashi, YWallet, NightHawk & zcashd",
    ],
    sliders: [
      { id: "avgActions", label: "Avg Actions / TX", min: 2, max: 20, step: 1, defaultValue: 5, unit: "actions", tooltip: "Inputs + outputs. Typical shielded send = 4–6." },
      { id: "txPerDay", label: "Daily TX Volume", min: 1000, max: 50000, step: 1000, defaultValue: 8000, unit: "tx/day", tooltip: "On-chain transactions per day." },
      { id: "marginalFee", label: "Marginal Fee", min: 1000, max: 20000, step: 500, defaultValue: 5000, unit: "zats", tooltip: "Fee per logical action. Currently 5,000 zats." },
      { id: "spamActions", label: "Spam TX Actions", min: 10, max: 500, step: 10, defaultValue: 100, unit: "actions", tooltip: "Actions in a spam TX. ZIP 317 makes these expensive." },
    ],
    defaultValues: { avgActions: 5, txPerDay: 8000, marginalFee: 5000, spamActions: 100 },
    metrics: [
      {
        id: "avgFee", label: "Avg User TX Fee", unit: "zats",
        description: "Expected fee for a typical shielded transaction",
        compute: (v) => {
          const b = 1000;
          const a = Math.max(2 * v.marginalFee, v.avgActions * v.marginalFee);
          return Array.from({ length: 13 }, (_, i) => b + ((a - b) * i) / 12);
        },
        format: fmtZats, color: "#f4a261", beforeLabel: "1,000 zats (flat)", afterLabel: "Proportional",
      },
      {
        id: "minerRev", label: "Daily Miner Fee Revenue", unit: "ZEC",
        description: "Total fees collected by miners per day",
        compute: (v) => {
          const o = (8000 * 1000) / 1e8;
          const n = (v.txPerDay * Math.max(2 * v.marginalFee, v.avgActions * v.marginalFee)) / 1e8;
          return Array.from({ length: 13 }, (_, i) => o + ((n - o) * i) / 12);
        },
        format: fmtZEC, color: "#2a9d8f", beforeLabel: "Old fee revenue", afterLabel: "ZIP 317 revenue",
      },
      {
        id: "spamCost", label: "Spam Cost (1K TX)", unit: "ZEC",
        description: "Cost to flood the network with 1,000 large spam transactions",
        compute: (v) => {
          const o = (1000 * 1000) / 1e8;
          const n = (1000 * v.spamActions * v.marginalFee) / 1e8;
          return Array.from({ length: 13 }, (_, i) => o + ((n - o) * i) / 12);
        },
        format: fmtZEC, color: "#e76f51", beforeLabel: "0.01 ZEC total", afterLabel: "Prohibitive",
      },
    ],
    learnMoreUrl: "https://zips.z.cash/zip-0317",
  },

  // ── ZIP 235 ─────────────────────────────────────────────────────────────────
  {
    id: "235",
    number: "ZIP 235",
    title: "Burn 60% of Transaction Fees",
    category: "sustainability",
    status: "NU7 Candidate",
    icon: "🔥",
    shortDesc: "60% of fees burned for deflation — Zcash's EIP-1559 equivalent",
    plainEnglish:
      "Currently 100% of transaction fees go to miners. ZIP 235 redirects 60% into the Network Sustainability Mechanism (burned from immediate circulation), while miners keep 40%. This creates mild deflation during high-usage periods and builds a long-term security budget. The burned ZEC feeds back into future block rewards via ZIP 234.",
    keyChanges: [
      "60% of TX fees burned from immediate circulation",
      "40% retained by miners as incentive",
      "Burned fees feed ZIP 234 issuance smoothing",
      "Deflation scales with real network usage",
      "Top NU7 candidate",
    ],
    sliders: [
      { id: "txPerDay", label: "Daily TX Volume", min: 1000, max: 100000, step: 1000, defaultValue: 8000, unit: "tx/day", tooltip: "More TXs = more burned = more deflation." },
      { id: "avgFeeZats", label: "Avg Fee / TX", min: 5000, max: 100000, step: 5000, defaultValue: 27300, unit: "zats", tooltip: "Average fee under ZIP 317 schedule." },
      { id: "burnSplit", label: "Burn %", min: 40, max: 80, step: 5, defaultValue: 60, unit: "%", tooltip: "ZIP 235 proposes 60%. Explore alternatives." },
    ],
    defaultValues: { txPerDay: 8000, avgFeeZats: 27300, burnSplit: 60 },
    metrics: [
      {
        id: "annualBurn", label: "Annual ZEC Burned", unit: "ZEC",
        description: "ZEC removed from immediate miner circulation per year",
        compute: (v) => {
          const d = (v.txPerDay * v.avgFeeZats) / 1e8;
          const b = d * (v.burnSplit / 100) * 365;
          return Array.from({ length: 13 }, (_, i) => (b * i) / 12);
        },
        format: fmtZEC, color: "#e63946", beforeLabel: "0 ZEC burned", afterLabel: "Annual burn",
      },
      {
        id: "minerShare", label: "Miner Annual Fee Revenue", unit: "ZEC",
        description: "What miners keep after the burn split",
        compute: (v) => {
          const d = (v.txPerDay * v.avgFeeZats) / 1e8;
          const m = d * (1 - v.burnSplit / 100) * 365;
          const o = d * 365;
          return Array.from({ length: 13 }, (_, i) => o - ((o - m) * i) / 12);
        },
        format: fmtZEC, color: "#2a9d8f", beforeLabel: "100% to miners", afterLabel: "40% to miners",
      },
      {
        id: "deflation", label: "Annual Supply Deflation", unit: "%",
        description: "Deflationary impact vs ~16.8M circulating supply",
        compute: (v) => {
          const d = (v.txPerDay * v.avgFeeZats) / 1e8;
          const b = d * (v.burnSplit / 100) * 365;
          return Array.from({ length: 13 }, (_, i) => ((b * i / 12) / 16800000) * 100);
        },
        format: fmtPct, color: "#a8dadc", beforeLabel: "No deflation", afterLabel: "Deflation rate",
      },
    ],
    learnMoreUrl: "https://zips.z.cash/zip-0235",
  },

  // ── ZIP 316 ─────────────────────────────────────────────────────────────────
  {
    id: "316",
    number: "ZIP 316",
    title: "Unified Addresses",
    category: "privacy",
    status: "Active",
    icon: "🔗",
    shortDesc: "One u1… address for all pools — auto-selects best privacy",
    plainEnglish:
      "Managing separate t-addresses, Sapling z-addresses, and Orchard addresses was confusing and caused accidental transparent sends. ZIP 316 introduces Unified Addresses (u1…) bundling all receiver types. Wallets auto-select the most private pool both parties support. Already live in Zashi, YWallet, and NightHawk.",
    keyChanges: [
      "Single u1… address encodes all receiver types",
      "Auto-selects highest-privacy compatible pool",
      "Reduces accidental transparent transactions",
      "Smooth Orchard migration path",
      "Active in Zashi, YWallet, NightHawk",
    ],
    sliders: [
      { id: "uaAdoption", label: "UA Adoption", min: 0, max: 100, step: 5, defaultValue: 45, unit: "%", tooltip: "% of users sending via Unified Addresses." },
      { id: "orchardCap", label: "Orchard Wallet %", min: 0, max: 100, step: 5, defaultValue: 60, unit: "%", tooltip: "% of wallets with Orchard receiver in UA." },
      { id: "saplingFb", label: "Sapling Fallback", min: 0, max: 100, step: 5, defaultValue: 35, unit: "%", tooltip: "% of UA sends falling back to Sapling." },
    ],
    defaultValues: { uaAdoption: 45, orchardCap: 60, saplingFb: 35 },
    metrics: [
      {
        id: "autoShield", label: "Auto-Shielded TX Rate", unit: "%",
        description: "Share of TXs landing in a shielded pool automatically",
        compute: (v) => {
          const g = (v.uaAdoption / 100) * ((v.orchardCap / 100) + (v.saplingFb / 100) * 0.6) * 30;
          return Array.from({ length: 13 }, (_, i) => Math.min(95, 42 + (g * i) / 12));
        },
        format: fmtPct, color: "#52b788", beforeLabel: "42% shielded", afterLabel: "With UA adoption",
      },
      {
        id: "orchardShare", label: "Orchard Pool Share", unit: "%",
        description: "% of TXs in the most private pool",
        compute: (v) => {
          const g = (v.uaAdoption / 100) * (v.orchardCap / 100) * 40;
          return Array.from({ length: 13 }, (_, i) => Math.min(80, 28 + (g * i) / 12));
        },
        format: fmtPct, color: "#6a4c93", beforeLabel: "28% Orchard", afterLabel: "Projected %",
      },
      {
        id: "privSet", label: "Shielded Note Count", unit: "notes",
        description: "Larger anonymity set = stronger privacy for everyone",
        compute: (v, b) => {
          const gf = 1 + (v.uaAdoption / 100) * 0.4;
          return Array.from({ length: 13 }, (_, i) => b.privacySetSize * Math.pow(gf, i / 12));
        },
        format: fmtK, color: "#457b9d", beforeLabel: "~4.2M notes", afterLabel: "Growth",
      },
    ],
    learnMoreUrl: "https://zips.z.cash/zip-0316",
  },

  // ── ZIP 226/227 ─────────────────────────────────────────────────────────────
  {
    id: "226-227",
    number: "ZIP 226/227",
    title: "Zcash Shielded Assets",
    category: "assets",
    status: "NU7 Candidate",
    icon: "💎",
    shortDesc: "Private custom tokens on Zcash — shielded ERC-20s in Orchard",
    plainEnglish:
      "ZSAs let anyone issue custom tokens with full Orchard-level privacy. Issue ZUSD, send it privately — nobody sees amount or recipient. ZIP 226 handles transfer/burn; ZIP 227 handles issuance with transparent supply tracking. All fees stay in ZEC. Developed by QEDIT, audited by Least Authority, live on testnet.",
    keyChanges: [
      "Custom tokens in the Orchard shielded pool",
      "Issuance tracked publicly; transfers fully shielded",
      "All fees paid in ZEC — strengthens ZEC demand",
      "Burn mechanism for permanent asset destruction",
      "Requires ZIP 230 (v6 TX format) for NU7",
      "Audited by Least Authority — live on testnet",
    ],
    sliders: [
      { id: "zsaAdopt", label: "ZSA TX Adoption", min: 0, max: 100, step: 5, defaultValue: 20, unit: "%", tooltip: "% of daily TXs involving shielded custom assets." },
      { id: "stableShare", label: "Stablecoin % of ZSA", min: 0, max: 100, step: 5, defaultValue: 50, unit: "%", tooltip: "Stablecoins expected to drive most ZSA volume." },
      { id: "zsaSize", label: "ZSA TX Actions", min: 2, max: 10, step: 1, defaultValue: 4, unit: "actions", tooltip: "ZSA TXs may have more actions than pure ZEC." },
    ],
    defaultValues: { zsaAdopt: 20, stableShare: 50, zsaSize: 4 },
    metrics: [
      {
        id: "orchUse", label: "Daily Orchard TX", unit: "tx/day",
        description: "Total Orchard pool TXs (ZEC + ZSA)",
        compute: (v, b) => {
          const base = b.avgTxPerDay * (b.orchardPercent / 100);
          const g = b.avgTxPerDay * (v.zsaAdopt / 100) * 0.8;
          return Array.from({ length: 13 }, (_, i) => base + (g * i) / 12);
        },
        format: fmtK, color: "#6a4c93", beforeLabel: "Current Orchard", afterLabel: "With ZSA",
      },
      {
        id: "feeRev", label: "Daily Fee Revenue", unit: "ZEC",
        description: "Total ZEC fees including ZSA activity",
        compute: (v, b) => {
          const base = (b.avgTxPerDay * b.currentAvgFeeZats) / 1e8;
          const zsa = (b.avgTxPerDay * (v.zsaAdopt / 100) * v.zsaSize * 5000) / 1e8;
          return Array.from({ length: 13 }, (_, i) => base + (zsa * i) / 12);
        },
        format: fmtZEC, color: "#f4a261", beforeLabel: "ZEC-only fees", afterLabel: "ZEC + ZSA",
      },
      {
        id: "anonSet", label: "Orchard Anonymity Set", unit: "notes",
        description: "More ZSA activity = stronger privacy for everyone",
        compute: (v, b) => {
          const m = 1 + (v.zsaAdopt / 100) * (v.stableShare / 100) * 0.8;
          return Array.from({ length: 13 }, (_, i) => b.privacySetSize * Math.pow(m, i / 12));
        },
        format: fmtK, color: "#52b788", beforeLabel: "Current set", afterLabel: "With ZSA",
      },
    ],
    learnMoreUrl: "https://zips.z.cash/zip-0226",
  },

  // ── ZIP 234 ─────────────────────────────────────────────────────────────────
  {
    id: "234",
    number: "ZIP 234",
    title: "Issuance Smoothing",
    category: "sustainability",
    status: "NU7 Candidate",
    icon: "📈",
    shortDesc: "Cushions halving shocks — gradual reissuance of burned ZEC",
    plainEnglish:
      "Every four years, Zcash's block reward halves causing sudden 50% revenue drops that can threaten security. ZIP 234 takes ZEC burned via ZIP 233/235 and gradually adds it to future block rewards. Instead of cliff-edge halvings, miners get a smooth revenue curve — a sustainability reserve that extends the security budget.",
    keyChanges: [
      "Burned ZEC feeds a sustainability reserve",
      "Reserve supplements future block rewards gradually",
      "Reduces miner revenue volatility at halvings",
      "Works with ZIP 233 (burning) + ZIP 235 (fee burning)",
      "Long-term security budget extension",
    ],
    sliders: [
      { id: "intake", label: "Annual Reserve Intake", min: 0, max: 5000, step: 100, defaultValue: 800, unit: "ZEC/yr", tooltip: "ZEC added to reserve per year via burning." },
      { id: "period", label: "Reissuance Period", min: 1, max: 10, step: 1, defaultValue: 4, unit: "years", tooltip: "Years over which the reserve pays out." },
      { id: "drop", label: "Halving Drop", min: 30, max: 60, step: 5, defaultValue: 50, unit: "%", tooltip: "Revenue drop at halving without smoothing." },
    ],
    defaultValues: { intake: 800, period: 4, drop: 50 },
    metrics: [
      {
        id: "dailyRev", label: "Daily Block Reward (Smoothed)", unit: "ZEC/day",
        description: "Miner revenue including ZIP 234 supplement",
        compute: (v) => {
          const s = v.intake / 365;
          return Array.from({ length: 13 }, (_, i) => {
            const yf = i / 12;
            const hf = yf >= 0.9 ? 0.5 + 0.5 * (1 - (yf - 0.9) / 0.1) : 1;
            return 720 * hf + s;
          });
        },
        format: fmtZEC, color: "#2a9d8f", beforeLabel: "No smoothing", afterLabel: "With ZIP 234",
      },
      {
        id: "cushDrop", label: "Effective Halving Drop", unit: "%",
        description: "How much the cliff is reduced by the reserve",
        compute: (v) => {
          const s = (v.intake / 365 / 720) * 100;
          const cd = Math.max(0, v.drop - s);
          return Array.from({ length: 13 }, (_, i) => v.drop - ((v.drop - cd) * i) / 12);
        },
        format: fmtPct, color: "#e76f51", beforeLabel: "50% cliff", afterLabel: "Cushioned",
      },
      {
        id: "reserve", label: "Sustainability Reserve", unit: "ZEC",
        description: "ZEC accumulated in the reserve",
        compute: (v) => Array.from({ length: 13 }, (_, i) => (v.intake * i) / 12),
        format: fmtZEC, color: "#a8dadc", beforeLabel: "No reserve", afterLabel: "Reserve grows",
      },
    ],
    learnMoreUrl: "https://zips.z.cash/zip-0234",
  },

  // ── ZIP 231 ─────────────────────────────────────────────────────────────────
  {
    id: "231",
    number: "ZIP 231",
    title: "Memo Bundles",
    category: "protocol",
    status: "NU7 Candidate",
    icon: "📦",
    shortDesc: "Shared memos across outputs — private messaging & rich payments",
    plainEnglish:
      "Today each output gets one 512-byte memo. ZIP 231 introduces memo bundles — a shared pool of encrypted data across all outputs. Each recipient gets an index. This enables rich payment metadata, private multi-party messages, and apps built on Zcash as an encrypted data layer. Foundational for ZSA notifications.",
    keyChanges: [
      "Memo data pooled across all outputs",
      "Each recipient gets an index into the bundle",
      "Far larger total memo capacity per TX",
      "Unlocks: private chat, invoices, batch payments",
      "Required for ZSA notifications — NU7 candidate",
    ],
    sliders: [
      { id: "memoAdopt", label: "Memo TX Adoption", min: 0, max: 100, step: 5, defaultValue: 20, unit: "%", tooltip: "% of TXs using memo bundles." },
      { id: "memoSize", label: "Avg Bundle Size", min: 64, max: 4096, step: 64, defaultValue: 512, unit: "bytes", tooltip: "Old limit was 512 bytes per output." },
      { id: "multiRecip", label: "Multi-recipient Rate", min: 0, max: 100, step: 5, defaultValue: 15, unit: "%", tooltip: "% of TXs paying multiple recipients." },
    ],
    defaultValues: { memoAdopt: 20, memoSize: 512, multiRecip: 15 },
    metrics: [
      {
        id: "dataAnch", label: "Daily Encrypted Data", unit: "KB",
        description: "Private memo data anchored per day",
        compute: (v, b) => {
          const tw = b.avgTxPerDay * (v.memoAdopt / 100);
          return Array.from({ length: 13 }, (_, i) => (tw * v.memoSize / 1024) * (i / 12));
        },
        format: fmtKB, color: "#457b9d", beforeLabel: "No bundles", afterLabel: "With ZIP 231",
      },
      {
        id: "multiVol", label: "Multi-recipient TX", unit: "tx/day",
        description: "Batch payments sharing memo bundles",
        compute: (v, b) => {
          const base = b.avgTxPerDay * 0.02;
          const g = b.avgTxPerDay * (v.multiRecip / 100);
          return Array.from({ length: 13 }, (_, i) => base + (g * i) / 12);
        },
        format: fmtK, color: "#52b788", beforeLabel: "~2% multi-recip", afterLabel: "With bundles",
      },
      {
        id: "memoFee", label: "Memo Fee Impact", unit: "zats",
        description: "Extra fee from larger memo bundles",
        compute: (v) => {
          const extra = Math.max(0, Math.ceil(v.memoSize / 512) - 1) * 5000;
          return Array.from({ length: 13 }, (_, i) => (extra * i) / 12);
        },
        format: fmtZatsPlus, color: "#f4a261", beforeLabel: "No extra fee", afterLabel: "Bundle fee",
      },
    ],
    learnMoreUrl: "https://zips.z.cash/zip-0231",
  },

  // ── ZIP 321 ─────────────────────────────────────────────────────────────────
  {
    id: "321",
    number: "ZIP 321",
    title: "Payment Request URIs",
    category: "protocol",
    status: "Active",
    icon: "📱",
    shortDesc: "Standard zcash: URI for payments, invoices & QR codes",
    plainEnglish:
      "ZIP 321 defines a standard URI format (zcash:u1…?amount=1&memo=…) making payment requests as simple as a link or QR scan. Now merchants, apps, and users generate requests any wallet understands — enabling invoicing, POS systems, and web payment buttons. Supports multiple outputs in one URI.",
    keyChanges: [
      "Standardizes zcash: URI scheme",
      "Encodes address, amount, memo, label, message",
      "Multiple payment outputs in one URI",
      "QR code compatible — cross-wallet interop",
      "Foundation for e-commerce & POS",
    ],
    sliders: [
      { id: "merchAdopt", label: "Merchant Adoption", min: 0, max: 100, step: 5, defaultValue: 25, unit: "%", tooltip: "% of payment flows using ZIP 321." },
      { id: "avgPay", label: "Avg Payment", min: 1, max: 500, step: 5, defaultValue: 50, unit: "USD", tooltip: "Typical merchant payment value." },
      { id: "zecPrice", label: "ZEC Price", min: 20, max: 300, step: 5, defaultValue: 60, unit: "USD", tooltip: "For USD volume estimation." },
    ],
    defaultValues: { merchAdopt: 25, avgPay: 50, zecPrice: 60 },
    metrics: [
      {
        id: "merchTx", label: "Merchant TX Volume", unit: "tx/day",
        description: "Daily TXs via payment URIs",
        compute: (v, b) => {
          const base = b.avgTxPerDay * 0.05;
          const g = b.avgTxPerDay * (v.merchAdopt / 100) * 0.3;
          return Array.from({ length: 13 }, (_, i) => base + (g * i) / 12);
        },
        format: fmtK, color: "#f4a261", beforeLabel: "No standard", afterLabel: "ZIP 321 adoption",
      },
      {
        id: "merchVol", label: "Merchant ZEC Volume", unit: "USD/day",
        description: "Daily USD value of ZIP 321 flows",
        compute: (v, b) => {
          const tc = b.avgTxPerDay * (v.merchAdopt / 100) * 0.3;
          return Array.from({ length: 13 }, (_, i) => (tc * v.avgPay * i) / 12);
        },
        format: fmtUSD, color: "#52b788", beforeLabel: "$0", afterLabel: "Merchant volume",
      },
      {
        id: "shieldPay", label: "Shielded Payment %", unit: "%",
        description: "URIs push payments to u-addresses automatically",
        compute: (v) => {
          const g = (v.merchAdopt / 100) * 20;
          return Array.from({ length: 13 }, (_, i) => Math.min(95, 42 + (g * i) / 12));
        },
        format: fmtPct, color: "#6a4c93", beforeLabel: "42% shielded", afterLabel: "With URIs",
      },
    ],
    learnMoreUrl: "https://zips.z.cash/zip-0321",
  },

  // ── ZIP 230 ─────────────────────────────────────────────────────────────────
  {
    id: "230",
    number: "ZIP 230",
    title: "Version 6 Transaction Format",
    category: "protocol",
    status: "NU7 Candidate",
    icon: "🔧",
    shortDesc: "New TX format enabling ZSAs, memo bundles & deprecating v4",
    plainEnglish:
      "ZIP 230 introduces the v6 transaction format — the chassis that makes all NU7 features possible. Required for ZSAs (ZIP 226/227) and memo bundles (ZIP 231). Also deprecates v4 transactions, meaning Sprout pool funds must migrate before activation. Wallets on v5 or older lose ZSA privacy indistinguishability.",
    keyChanges: [
      "v6 transaction format for NU7",
      "Required for ZSAs and memo bundles",
      "v4 deprecated — Sprout pool closing",
      "All wallets should switch to v6 post-NU7",
      "v5 loses ZSA privacy indistinguishability",
    ],
    sliders: [
      { id: "v6Adopt", label: "v6 Wallet Adoption", min: 0, max: 100, step: 5, defaultValue: 60, unit: "%", tooltip: "% of wallets sending v6 TXs." },
      { id: "sproutLeft", label: "Sprout Unmigrated", min: 0, max: 100, step: 5, defaultValue: 10, unit: "%", tooltip: "% of Sprout ZEC not migrated before NU7." },
    ],
    defaultValues: { v6Adopt: 60, sproutLeft: 10 },
    metrics: [
      {
        id: "v6Share", label: "v6 Transaction Share", unit: "%",
        description: "% of daily TXs using the new format",
        compute: (v) => Array.from({ length: 13 }, (_, i) => (v.v6Adopt * i) / 12),
        format: fmtPct, color: "#457b9d", beforeLabel: "0% v6", afterLabel: "v6 adoption",
      },
      {
        id: "sproutRisk", label: "Sprout ZEC at Risk", unit: "ZEC",
        description: "Unmigrated Sprout funds that may be burned",
        compute: (v) => {
          const at = 50000 * (v.sproutLeft / 100);
          return Array.from({ length: 13 }, (_, i) => at * Math.max(0, 1 - i / 12));
        },
        format: fmtZEC, color: "#e76f51", beforeLabel: "Total Sprout", afterLabel: "Remaining",
      },
      {
        id: "indist", label: "ZSA Privacy Parity", unit: "%",
        description: "ZSA TXs indistinguishable from ZEC TXs",
        compute: (v) => Array.from({ length: 13 }, (_, i) => (v.v6Adopt * i) / 12),
        format: fmtPct, color: "#52b788", beforeLabel: "0%", afterLabel: "Full parity",
      },
    ],
    learnMoreUrl: "https://zips.z.cash/zip-0230",
  },

  // ── ZIP 233 ─────────────────────────────────────────────────────────────────
  {
    id: "233",
    number: "ZIP 233",
    title: "NSM: Fund Removal",
    category: "sustainability",
    status: "NU7 Candidate",
    icon: "♻️",
    shortDesc: "Voluntary mechanism to remove ZEC from circulation permanently",
    plainEnglish:
      'ZIP 233 introduces a way to voluntarily remove ZEC from circulation entirely. Combined with ZIP 234 and ZIP 235, it forms the Network Sustainability Mechanism (NSM). By creating "headroom" between circulating supply and the 21M cap, it enables future block subsidy extensions. Removing ZEC also benefits holders by reducing circulating supply.',
    keyChanges: [
      "Voluntary fund removal from circulation",
      "Creates headroom below the 21M supply cap",
      "Foundation for ZIP 234 + ZIP 235",
      "Benefits ZEC holders through supply reduction",
      "Enables future block subsidy extensions",
    ],
    sliders: [
      { id: "burnRate", label: "Annual Voluntary Burns", min: 0, max: 10000, step: 500, defaultValue: 2000, unit: "ZEC/yr", tooltip: "ZEC voluntarily removed per year." },
      { id: "years", label: "Projection Period", min: 1, max: 10, step: 1, defaultValue: 5, unit: "years", tooltip: "How far to project the cumulative effect." },
    ],
    defaultValues: { burnRate: 2000, years: 5 },
    metrics: [
      {
        id: "cumBurn", label: "Cumulative ZEC Removed", unit: "ZEC",
        description: "Total ZEC removed from circulation over time",
        compute: (v) => Array.from({ length: 13 }, (_, i) => (v.burnRate * v.years * i) / 12),
        format: fmtZEC, color: "#e63946", beforeLabel: "0 removed", afterLabel: "Cumulative",
      },
      {
        id: "headroom", label: "Supply Headroom Created", unit: "ZEC",
        description: "Room below 21M cap for future issuance",
        compute: (v) => {
          const gap = 21000000 - 16800000;
          return Array.from({ length: 13 }, (_, i) => gap + (v.burnRate * v.years * i) / 12);
        },
        format: fmtK, color: "#2a9d8f", beforeLabel: "4.2M headroom", afterLabel: "Expanded",
      },
      {
        id: "supplyPct", label: "Circulating Supply Change", unit: "%",
        description: "Reduction in circulating supply",
        compute: (v) =>
          Array.from({ length: 13 }, (_, i) => -((v.burnRate * v.years * i / 12) / 16800000) * 100),
        format: fmtPct, color: "#a8dadc", beforeLabel: "Baseline", afterLabel: "Reduced",
      },
    ],
    learnMoreUrl: "https://zips.z.cash/zip-0233",
  },

  // ── ZIP 1015 ────────────────────────────────────────────────────────────────
  {
    id: "1015",
    number: "ZIP 1015",
    title: "Block Subsidy Allocation",
    category: "governance",
    status: "Final",
    icon: "🏛️",
    shortDesc: "Post-halving funding split — ZCG grants + in-protocol lockbox",
    plainEnglish:
      'ZIP 1015 allocates a percentage of block subsidy after the November 2024 halving. Funds split between Zcash Community Grants (ZCG) and an in-protocol "lockbox" tracked by consensus. The lockbox addresses risks from ZIP 1014: regulatory exposure, org-funding inefficiency, and centralization. Disbursement mechanism to be decided by future ZIP.',
    keyChanges: [
      "Block subsidy split: ZCG + lockbox",
      "Lockbox tracked by protocol consensus",
      "Addresses ZIP 1014 regulatory risks",
      "Decentralized funding mechanism (future ZIP)",
      "Final status — active on mainnet",
    ],
    sliders: [
      { id: "lockboxPct", label: "Lockbox Allocation", min: 5, max: 20, step: 1, defaultValue: 12, unit: "%", tooltip: "% of block subsidy to lockbox." },
      { id: "zcgPct", label: "ZCG Allocation", min: 2, max: 15, step: 1, defaultValue: 8, unit: "%", tooltip: "% of block subsidy to community grants." },
      { id: "blockReward", label: "Block Reward", min: 1, max: 5, step: 0.25, defaultValue: 1.5625, unit: "ZEC", tooltip: "Current post-halving block reward." },
    ],
    defaultValues: { lockboxPct: 12, zcgPct: 8, blockReward: 1.5625 },
    metrics: [
      {
        id: "lockboxAnn", label: "Annual Lockbox Accumulation", unit: "ZEC",
        description: "ZEC flowing into the lockbox per year",
        compute: (v) => {
          const blocksPerYear = (365 * 24 * 60) / 1.25 * 0.5;
          const annual = v.blockReward * (v.lockboxPct / 100) * blocksPerYear;
          return Array.from({ length: 13 }, (_, i) => (annual * i) / 12);
        },
        format: fmtZEC, color: "#457b9d", beforeLabel: "No lockbox", afterLabel: "Annual inflow",
      },
      {
        id: "zcgAnn", label: "Annual ZCG Funding", unit: "ZEC",
        description: "ZEC available for community grants per year",
        compute: (v) => {
          const blocksPerYear = (365 * 24 * 60) / 1.25 * 0.5;
          const annual = v.blockReward * (v.zcgPct / 100) * blocksPerYear;
          return Array.from({ length: 13 }, (_, i) => (annual * i) / 12);
        },
        format: fmtZEC, color: "#52b788", beforeLabel: "No ZCG fund", afterLabel: "Annual grants",
      },
      {
        id: "minerPct", label: "Miner Share", unit: "%",
        description: "What % of block reward goes to miners",
        compute: (v) => {
          const m = 100 - v.lockboxPct - v.zcgPct;
          return Array.from({ length: 13 }, () => m);
        },
        format: fmtPct, color: "#f4a261", beforeLabel: "100%", afterLabel: "After allocation",
      },
    ],
    learnMoreUrl: "https://zips.z.cash/zip-1015",
  },
];

export default ZIPS;
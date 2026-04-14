"use client";
// src/components/ZipSimulator/ZipSimulator.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ZIPS,
  BASE_STATS,
  CAT_STYLES,
  STATUS_STYLES,
  NETWORK_STATS,
  type ZIPData,
  type SliderConfig,
  type MetricResult,
  type BaseNetworkStats,
} from "@/lib/zipSimulatorData";

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes metricIn {
    from { opacity: 0; transform: scale(0.95) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.35; }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(103,211,224,0.06); }
    50%      { box-shadow: 0 0 40px rgba(103,211,224,0.14); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-5px); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .zip-sim * { box-sizing: border-box; margin: 0; padding: 0; }
  .zip-sim a { color: #67d3e0; text-decoration: none; }
  .zip-sim a:hover { text-decoration: underline; }

  .zip-sim input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
  }
  .zip-sim input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px; height: 18px; border-radius: 50%;
    background: #67d3e0; cursor: pointer;
    border: 2.5px solid #0a1019;
    box-shadow: 0 0 12px rgba(103,211,224,0.5);
    transition: box-shadow 0.2s;
  }
  .zip-sim input[type="range"]::-webkit-slider-thumb:hover {
    box-shadow: 0 0 22px rgba(103,211,224,0.8);
  }
  .zip-sim input[type="range"]::-moz-range-thumb {
    width: 18px; height: 18px; border-radius: 50%;
    background: #67d3e0; border: 2.5px solid #0a1019; cursor: pointer;
  }

  .zip-sim ::-webkit-scrollbar { width: 4px; }
  .zip-sim ::-webkit-scrollbar-thumb { background: rgba(103,211,224,0.15); border-radius: 2px; }

  .zip-card-btn:hover .zip-card-arrow { transform: translateX(5px); }
  .zip-card-btn:hover { background: rgba(103,211,224,0.055) !important; border-color: rgba(103,211,224,0.28) !important; transform: translateY(-4px) !important; box-shadow: 0 16px 48px rgba(0,0,0,0.35) !important; }

  .metric-card:hover { border-color: rgba(255,255,255,0.12) !important; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.25); }

  .before-after-row:hover .ba-arrow { transform: scale(1.3); }

  @media (max-width: 600px) {
    .zip-sim-layout { grid-template-columns: 1fr !important; }
    .zip-cards-grid { grid-template-columns: 1fr !important; }
    .zip-sim-header-title { font-size: 18px !important; }
    .zip-sim-metrics-grid { grid-template-columns: 1fr !important; }
    .zip-sim-ba-grid { grid-template-columns: 1fr !important; }
    .zip-sim-stats-bar { gap: 6px !important; }
    .zip-sim-stats-item { padding: 7px 10px !important; }
    .zip-sim-cat-filters { gap: 6px !important; }
  }
  @media (min-width: 601px) and (max-width: 860px) {
    .zip-sim-layout { grid-template-columns: 1fr !important; }
    .zip-cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .zip-sim-metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (min-width: 861px) and (max-width: 1100px) {
    .zip-cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// AREA CHART (Canvas) — with baseline indicator
// ═══════════════════════════════════════════════════════════════════════════════
function AreaChart({
  data,
  color,
  height = 100,
  baseline,
}: {
  data: number[];
  color: string;
  height?: number;
  baseline?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    let startTime: number | null = null;
    const duration = 700;

    const draw = (now: number) => {
      if (!startTime) startTime = now;
      const progress = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      ctx.clearRect(0, 0, W, H);

      // ── compute scale including baseline value ──
      const allVals = baseline !== undefined ? [...data, baseline] : data;
      const mn = Math.min(...allVals);
      const mx = Math.max(...allVals);
      const rng = mx - mn || 1;
      const pad = { t: 6, b: 18, l: 6, r: 6 };
      const cW = W - pad.l - pad.r;
      const cH = H - pad.t - pad.b;

      const pts = data.map((v, i) => ({
        x: pad.l + (i / (data.length - 1)) * cW,
        y: pad.t + cH - ((v - mn) / rng) * cH * ease,
      }));

      // Subtle grid
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 3; i++) {
        const y = pad.t + (cH / 3) * i;
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(W - pad.r, y);
        ctx.stroke();
      }

      // ── Baseline / "Current Network" reference line ──
      if (baseline !== undefined) {
        const baselineY = pad.t + cH - ((baseline - mn) / rng) * cH;
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pad.l, baselineY);
        ctx.lineTo(W - pad.r, baselineY);
        ctx.stroke();
        ctx.setLineDash([]);
        // label
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText("baseline", pad.l + 4, baselineY - 4);
        ctx.restore();
      }

      // Area gradient fill
      const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
      grad.addColorStop(0, color + "2a");
      grad.addColorStop(1, color + "04");
      ctx.beginPath();
      ctx.moveTo(pts[0].x, H - pad.b);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, H - pad.b);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Smooth line
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      // Endpoint glow
      const last = pts[pts.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = color + "22";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Month labels
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      [0, 6, 12].forEach((m) => {
        const x = pad.l + (m / 12) * cW;
        ctx.fillText(`M${m}`, x, H - 3);
      });

      if (progress < 1) animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [data, color, baseline]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: `${height}px`, display: "block", borderRadius: 6 }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════
function Tip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        tabIndex={0}
        role="button"
        aria-label="More info"
        style={{
          width: 16, height: 16, borderRadius: "50%",
          background: "rgba(103,211,224,0.1)",
          color: "#67d3e0", fontSize: 9,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          cursor: "help", border: "1px solid rgba(103,211,224,0.18)",
          transition: "background 0.15s",
        }}
      >
        ?
      </span>
      {show && (
        <span
          style={{
            position: "absolute", left: "calc(100% + 8px)", top: -4,
            width: 230, background: "#090e1a",
            border: "1px solid rgba(103,211,224,0.22)",
            borderRadius: 10, padding: "8px 11px",
            fontSize: 11, color: "rgba(255,255,255,0.58)",
            lineHeight: 1.55, zIndex: 100, pointerEvents: "none",
            boxShadow: "0 10px 40px rgba(0,0,0,0.55)",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARAMETER SLIDER
// ═══════════════════════════════════════════════════════════════════════════════
function ParamSlider({
  cfg,
  val,
  onChange,
}: {
  cfg: SliderConfig;
  val: number;
  onChange: (id: string, v: number) => void;
}) {
  const pct = ((val - cfg.min) / (cfg.max - cfg.min)) * 100;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.62)", fontWeight: 600 }}>{cfg.label}</span>
          <Tip text={cfg.tooltip} />
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13, color: "#67d3e0", fontWeight: 700,
          }}
        >
          {val.toLocaleString()}{" "}
          <span style={{ fontSize: 9, opacity: 0.5 }}>{cfg.unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={cfg.min}
        max={cfg.max}
        step={cfg.step}
        value={val}
        onChange={(e) => onChange(cfg.id, Number(e.target.value))}
        style={{
          width: "100%", height: 5, borderRadius: 3,
          outline: "none", cursor: "pointer",
          background: `linear-gradient(to right, #67d3e0 ${pct}%, rgba(255,255,255,0.07) ${pct}%)`,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", fontFamily: "monospace" }}>
          {cfg.min.toLocaleString()}
        </span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", fontFamily: "monospace" }}>
          {cfg.max.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRIC CARD — passes baseline (data[0]) to chart
// ═══════════════════════════════════════════════════════════════════════════════
function MetricCard({
  m,
  vals,
  delay,
}: {
  m: MetricResult;
  vals: Record<string, number>;
  delay: number;
}) {
  const data = m.compute(vals, BASE_STATS);
  const cur = data[0];
  const proj = data[12];
  const pct = cur !== 0 ? ((proj - cur) / Math.abs(cur)) * 100 : proj > 0 ? 100 : 0;
  const up = proj >= cur;

  return (
    <div
      className="metric-card"
      style={{
        background: "rgba(255,255,255,0.022)",
        border: `1px solid ${m.color}1a`,
        borderRadius: 16, padding: "16px 18px",
        transition: "all 0.3s ease",
        animation: `metricIn 0.5s ease ${delay}s both`,
        cursor: "default",
      }}
    >
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginBottom: 3, lineHeight: 1.45 }}>
        {m.description}
      </p>
      <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>
        {m.label}
      </h4>

      {/* Pass data[0] as the "Current Network" baseline line */}
      <AreaChart data={data} color={m.color} height={94} baseline={cur} />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontFamily: "monospace", marginBottom: 3 }}>
            NOW
          </div>
          <div
            style={{
              fontSize: 15, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: "rgba(255,255,255,0.58)",
            }}
          >
            {m.format(cur)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontFamily: "monospace", marginBottom: 3 }}>
            12 MONTHS
          </div>
          <div
            style={{
              fontSize: 15, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: m.color,
            }}
          >
            {m.format(proj)}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 12, padding: "6px 10px", borderRadius: 8,
          display: "flex", alignItems: "center", gap: 6,
          background: up ? "rgba(82,183,136,0.07)" : "rgba(230,57,70,0.07)",
        }}
      >
        <span style={{ fontSize: 13 }}>{up ? "↑" : "↓"}</span>
        <span
          style={{
            fontSize: 11, fontFamily: "monospace",
            color: up ? "#52b788" : "#e63946",
          }}
        >
          {Math.abs(pct).toFixed(1)}% projected change
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ZIP SELECTION CARD
// ═══════════════════════════════════════════════════════════════════════════════
function ZipCard({
  zip,
  onClick,
  delay,
}: {
  zip: ZIPData;
  onClick: () => void;
  delay: number;
}) {
  const cat = CAT_STYLES[zip.category];
  const sta = STATUS_STYLES[zip.status];

  return (
    <button
      onClick={onClick}
      className="zip-card-btn"
      style={{
        display: "block", width: "100%", textAlign: "left", cursor: "pointer",
        background: "rgba(255,255,255,0.018)",
        border: "1px solid rgba(255,255,255,0.055)",
        borderRadius: 16, padding: "20px 18px",
        transition: "all 0.28s ease",
        animation: `cardIn 0.45s ease ${delay}s both`,
        color: "white", fontFamily: "inherit",
        transform: "translateY(0)",
        boxShadow: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span
          style={{
            fontSize: 24, width: 42, height: 42, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.03)", flexShrink: 0,
          }}
        >
          {zip.icon}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 700, color: "#67d3e0",
              letterSpacing: "0.1em", marginBottom: 3,
            }}
          >
            {zip.number}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", lineHeight: 1.25 }}>
            {zip.title}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <span
          style={{
            padding: "3px 9px", borderRadius: 6,
            fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
            background: cat.bg, color: cat.color,
          }}
        >
          {cat.label.toUpperCase()}
        </span>
        <span
          style={{
            padding: "3px 9px", borderRadius: 6,
            fontSize: 9, display: "flex", alignItems: "center", gap: 4,
            background: sta.bg, color: sta.color,
          }}
        >
          {sta.pulse && (
            <span
              style={{
                width: 5, height: 5, borderRadius: "50%",
                background: sta.color, animation: "pulse 2s infinite",
                display: "inline-block",
              }}
            />
          )}
          {zip.status}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
        {zip.shortDesc}
      </p>

      <div
        style={{
          marginTop: 14, fontSize: 12, fontWeight: 600, color: "#67d3e0",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        Open Simulator{" "}
        <span
          className="zip-card-arrow"
          style={{ transition: "transform 0.2s", display: "inline-block" }}
        >
          →
        </span>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK STATS BAR
// ═══════════════════════════════════════════════════════════════════════════════
function NetworkStatsBar() {
  return (
    <div className="zip-sim-stats-bar" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
      {NETWORK_STATS.map((s, i) => (
        <div
          key={s.label}
          className="zip-sim-stats-item"
          style={{
            padding: "9px 14px", borderRadius: 10,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.045)",
            animation: `cardIn 0.3s ease ${i * 0.04}s both`,
          }}
        >
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontFamily: "monospace" }}>
            {s.label}
          </div>
          <div
            style={{
              fontSize: 14, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace", color: "#67d3e0",
            }}
          >
            {s.value}
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", fontFamily: "monospace" }}>
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ZipSimulator() {
  const [selected, setSelected] = useState<ZIPData | null>(null);
  const [vals, setVals] = useState<Record<string, number>>({});
  const [catFilter, setCatFilter] = useState("all");
  const [showIntro, setShowIntro] = useState(true);

  // FIX: use a ref that always holds the latest selected ZIP's defaultValues
  // so the Reset button closure never goes stale.
  const selectedRef = useRef<ZIPData | null>(null);
  selectedRef.current = selected;

  const handleSelect = useCallback((zip: ZIPData) => {
    setSelected(zip);
    // Spread a fresh copy so React sees a new object and triggers re-render
    setVals({ ...zip.defaultValues });
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 60);
  }, []);

  // FIX: reset reads from the ref — always gets the current ZIP's defaults
  const handleReset = useCallback(() => {
    const zip = selectedRef.current;
    if (!zip) return;
    setVals({ ...zip.defaultValues });
  }, []);

  const handleChange = useCallback((id: string, v: number) => {
    setVals((p) => ({ ...p, [id]: v }));
  }, []);

  const filtered = catFilter === "all" ? ZIPS : ZIPS.filter((z) => z.category === catFilter);
  const allCategories = ["all", ...Object.keys(CAT_STYLES)];

  return (
    <div
      className="zip-sim"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at 15% 0%, rgba(103,211,224,0.055) 0%, transparent 55%), " +
          "radial-gradient(ellipse at 85% 100%, rgba(106,76,147,0.035) 0%, transparent 50%), " +
          "linear-gradient(170deg, #060810 0%, #0a1019 45%, #070c15 100%)",
        color: "white",
        fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif",
        paddingBottom: 80,
      }}
    >
      <style>{GLOBAL_CSS}</style>

      {/* ══ HEADER ══ */}
      <header
        style={{
          borderBottom: "1px solid rgba(103,211,224,0.07)",
          background: "rgba(103,211,224,0.015)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 20px" }}>
          {selected && (
            <button
              onClick={() => setSelected(null)}
              style={{
                marginBottom: 12, padding: "7px 16px", borderRadius: 8,
                fontSize: 12, color: "#67d3e0", cursor: "pointer",
                border: "1px solid rgba(103,211,224,0.18)",
                background: "rgba(103,211,224,0.06)",
                fontWeight: 600, fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              ← All ZIPs
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 46, height: 46, borderRadius: 13,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 23,
                background: "linear-gradient(135deg, #67d3e0, #457b9d)",
                flexShrink: 0,
                animation: "float 5s ease-in-out infinite",
              }}
            >
              ⚡
            </div>
            <div>
              <h1
                className="zip-sim-header-title"
                style={{
                  fontSize: "clamp(20px, 4vw, 32px)", fontWeight: 800,
                  lineHeight: 1.05, margin: 0,
                  background: "linear-gradient(120deg, #ffffff 15%, #67d3e0 65%, #6a4c93 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ZIP Simulator
              </h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", margin: "4px 0 0" }}>
                Explore Zcash Improvement Proposals — see real-world impact before they ship
              </p>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        {/* ══════════════════ SELECTION VIEW ══════════════════ */}
        {!selected && (
          <div>
            {/* Intro Banner */}
            {showIntro && (
              <div
                style={{
                  marginTop: 20, borderRadius: 16, padding: "18px 22px",
                  position: "relative",
                  border: "1px solid rgba(103,211,224,0.14)",
                  background:
                    "linear-gradient(135deg, rgba(103,211,224,0.04), rgba(69,123,157,0.04))",
                  animation: "slideDown 0.4s ease both",
                }}
              >
                <button
                  onClick={() => setShowIntro(false)}
                  style={{
                    position: "absolute", top: 10, right: 14,
                    background: "none", border: "none",
                    color: "rgba(255,255,255,0.28)", cursor: "pointer",
                    fontSize: 18, lineHeight: 1,
                  }}
                >
                  ×
                </button>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#67d3e0", marginBottom: 6 }}>
                  How it works
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", lineHeight: 1.85 }}>
                  Pick a ZIP below. Each simulator starts with{" "}
                  <strong style={{ color: "rgba(255,255,255,0.78)" }}>real mainnet data</strong>, then
                  lets you drag sliders to model adoption scenarios. Charts animate live. All math is
                  derived from the actual ZIP specification.{" "}
                  <strong style={{ color: "rgba(255,255,255,0.78)" }}>10 ZIPs</strong> covering fees,
                  privacy, assets, sustainability, protocol &amp; governance.
                </p>
              </div>
            )}

            <NetworkStatsBar />

            {/* Category Filter */}
            <div className="zip-sim-cat-filters" style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {allCategories.map((id) => {
                const active = catFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => setCatFilter(id)}
                    style={{
                      padding: "6px 15px", borderRadius: 20,
                      fontSize: 11, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                      transition: "all 0.2s",
                      border: `1px solid ${active ? "rgba(103,211,224,0.4)" : "rgba(255,255,255,0.07)"}`,
                      background: active ? "rgba(103,211,224,0.1)" : "rgba(255,255,255,0.025)",
                      color: active ? "#67d3e0" : "rgba(255,255,255,0.38)",
                    }}
                  >
                    {id === "all" ? "All ZIPs" : CAT_STYLES[id]?.label}
                  </button>
                );
              })}
            </div>

            {/* ZIP Cards Grid */}
            <div
              className="zip-cards-grid"
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              {filtered.map((zip, i) => (
                <ZipCard key={zip.id} zip={zip} onClick={() => handleSelect(zip)} delay={i * 0.04} />
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════ SIMULATOR VIEW ══════════════════ */}
        {selected && (
          <div style={{ paddingTop: 22, animation: "cardIn 0.4s ease both" }}>
            {/* ZIP Header */}
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: "flex", flexWrap: "wrap", gap: 8,
                  alignItems: "center", marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 30 }}>{selected.icon}</span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11, fontWeight: 700, color: "#67d3e0",
                    background: "rgba(103,211,224,0.07)",
                    padding: "5px 12px", borderRadius: 7, letterSpacing: "0.1em",
                  }}
                >
                  {selected.number}
                </span>
                <span
                  style={{
                    padding: "5px 12px", borderRadius: 7,
                    fontSize: 10, fontWeight: 700,
                    background: CAT_STYLES[selected.category].bg,
                    color: CAT_STYLES[selected.category].color,
                  }}
                >
                  {CAT_STYLES[selected.category].label.toUpperCase()}
                </span>
                <span
                  style={{
                    padding: "5px 12px", borderRadius: 7,
                    fontSize: 10, display: "flex", alignItems: "center", gap: 5,
                    background: STATUS_STYLES[selected.status].bg,
                    color: STATUS_STYLES[selected.status].color,
                  }}
                >
                  {STATUS_STYLES[selected.status].pulse && (
                    <span
                      style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: STATUS_STYLES[selected.status].color,
                        animation: "pulse 2s infinite", display: "inline-block",
                      }}
                    />
                  )}
                  {selected.status}
                </span>

                {/* FIX: Additional "Reset to defaults" button in simulator header */}
                <button
                  onClick={handleReset}
                  style={{
                    marginLeft: "auto",
                    background: "rgba(103,211,224,0.07)",
                    border: "1px solid rgba(103,211,224,0.18)",
                    borderRadius: 8, color: "#67d3e0",
                    padding: "6px 16px", fontSize: 11,
                    cursor: "pointer", fontFamily: "inherit",
                    fontWeight: 600,
                    transition: "background 0.15s",
                    display: "flex", alignItems: "center", gap: 6,
                    whiteSpace: "nowrap",
                  }}
                  title="Reset all sliders to default values"
                >
                  ↺ Reset to defaults
                </button>
              </div>

              <h2
                style={{
                  fontSize: "clamp(22px, 4vw, 36px)",
                  fontWeight: 800, margin: "0 0 14px", lineHeight: 1.12,
                }}
              >
                {selected.title}
              </h2>
              <p
                style={{
                  fontSize: 14, color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.8, maxWidth: 720, margin: "0 0 20px",
                }}
              >
                {selected.plainEnglish}
              </p>

              {/* Key Changes */}
              <div
                style={{
                  borderRadius: 14, padding: "16px 20px", marginBottom: 14,
                  border: "1px solid rgba(103,211,224,0.09)",
                  background: "rgba(103,211,224,0.025)",
                }}
              >
                <div
                  style={{
                    fontSize: 10, fontWeight: 700, color: "#67d3e0",
                    letterSpacing: "0.12em", marginBottom: 10,
                  }}
                >
                  KEY CHANGES
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selected.keyChanges.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "#67d3e0", fontSize: 11, marginTop: 2, flexShrink: 0 }}>
                        →
                      </span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.52)", lineHeight: 1.55 }}>
                        {c}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FIX: explicitly set target="_blank" and rel="noopener noreferrer" */}
              <a
                href={selected.learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, fontWeight: 600, color: "#67d3e0" }}
              >
                Read full specification ↗
              </a>
            </div>

            {/* Simulator 2-Column Layout */}
            <div
              className="zip-sim-layout"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(260px, 310px) 1fr",
                gap: 24, alignItems: "start",
              }}
            >
              {/* ── Sliders Panel ── */}
              <div>
                <div
                  style={{
                    borderRadius: 16, padding: 20,
                    border: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.018)",
                    position: "sticky", top: 16,
                    animation: "glowPulse 7s ease-in-out infinite",
                  }}
                >
                  <div
                    style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 22,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700,
                        color: "rgba(255,255,255,0.32)", letterSpacing: "0.12em",
                      }}
                    >
                      PARAMETERS
                    </span>
                    {/* FIX: Reset button now uses handleReset which reads from ref — never stale */}
                    <button
                      onClick={handleReset}
                      style={{
                        background: "rgba(103,211,224,0.07)",
                        border: "1px solid rgba(103,211,224,0.16)",
                        borderRadius: 6, color: "#67d3e0",
                        padding: "4px 12px", fontSize: 10,
                        cursor: "pointer", fontFamily: "inherit",
                        transition: "background 0.15s",
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  {selected.sliders.map((s) => (
                    <ParamSlider
                      key={s.id}
                      cfg={s}
                      val={vals[s.id] ?? s.defaultValue}
                      onChange={handleChange}
                    />
                  ))}
                  <div
                    style={{
                      marginTop: 14, padding: "10px 12px",
                      borderRadius: 8, background: "rgba(103,211,224,0.025)",
                    }}
                  >
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", lineHeight: 1.65, margin: 0 }}>
                      Charts update live. The dashed line on each chart marks the current network baseline.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Charts Panel ── */}
              <div>
                <div
                  style={{
                    fontSize: 10, fontWeight: 700,
                    color: "rgba(255,255,255,0.28)", letterSpacing: "0.12em",
                    marginBottom: 14,
                  }}
                >
                  PROJECTED IMPACT — 12 MONTH SIMULATION
                </div>
                <div
                  className="zip-sim-metrics-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 12,
                  }}
                >
                  {selected.metrics.map((m, i) => (
                    <MetricCard key={m.id} m={m} vals={vals} delay={i * 0.1} />
                  ))}
                </div>

                {/* Before vs After Snapshot */}
                <div
                  style={{
                    marginTop: 22, borderRadius: 16, padding: 20,
                    border: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.015)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10, fontWeight: 700,
                      color: "rgba(255,255,255,0.28)", letterSpacing: "0.12em",
                      marginBottom: 16,
                    }}
                  >
                    BEFORE vs AFTER SNAPSHOT
                  </div>
                  <div
                    className="zip-sim-ba-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: 14,
                    }}
                  >
                    {selected.metrics.map((m) => {
                      const data = m.compute(vals, BASE_STATS);
                      return (
                        <div key={m.id} className="before-after-row">
                          <div
                            style={{
                              fontSize: 11, color: "rgba(255,255,255,0.32)", marginBottom: 8,
                            }}
                          >
                            {m.label}
                          </div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <div
                              style={{
                                flex: 1, background: "rgba(255,255,255,0.025)",
                                borderRadius: 10, padding: "10px 13px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 9, color: "rgba(255,255,255,0.2)",
                                  fontFamily: "monospace", marginBottom: 3,
                                }}
                              >
                                BEFORE
                              </div>
                              <div
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: 14, fontWeight: 700,
                                  color: "rgba(255,255,255,0.52)",
                                }}
                              >
                                {m.format(data[0])}
                              </div>
                              <div
                                style={{
                                  fontSize: 9, color: "rgba(255,255,255,0.18)",
                                  fontFamily: "monospace", marginTop: 2,
                                }}
                              >
                                {m.beforeLabel}
                              </div>
                            </div>
                            <span
                              className="ba-arrow"
                              style={{
                                color: "#67d3e0", fontSize: 16,
                                flexShrink: 0, transition: "transform 0.2s",
                              }}
                            >
                              →
                            </span>
                            <div
                              style={{
                                flex: 1,
                                background: `${m.color}08`,
                                border: `1px solid ${m.color}1a`,
                                borderRadius: 10, padding: "10px 13px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 9, color: "rgba(255,255,255,0.2)",
                                  fontFamily: "monospace", marginBottom: 3,
                                }}
                              >
                                AFTER
                              </div>
                              <div
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: 14, fontWeight: 700, color: m.color,
                                }}
                              >
                                {m.format(data[12])}
                              </div>
                              <div
                                style={{
                                  fontSize: 9, color: "rgba(255,255,255,0.18)",
                                  fontFamily: "monospace", marginTop: 2,
                                }}
                              >
                                {m.afterLabel}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FIX: Disclaimer at the bottom of the simulator view */}
                <div
                  style={{
                    marginTop: 24, padding: "12px 16px", borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.04)",
                    background: "rgba(255,255,255,0.01)",
                    display: "flex", gap: 10, alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0, opacity: 0.45 }}>⚠️</span>
                  <p
                    style={{
                      fontSize: 10, color: "rgba(255,255,255,0.22)",
                      lineHeight: 1.7, margin: 0,
                    }}
                  >
                    <strong style={{ color: "rgba(255,255,255,0.32)" }}>Disclaimer:</strong>{" "}
                    Projections are illustrative models based on simplified assumptions — not financial
                    advice. All figures are estimates derived from ZIP specifications and real mainnet
                    baselines. Do not make investment or protocol decisions based solely on these
                    simulations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
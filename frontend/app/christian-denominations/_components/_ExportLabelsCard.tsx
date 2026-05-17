"use client";

import Image from "next/image";
import { useMemo } from "react";

interface Label {
  label: string;
  category: string;
  certainty: number;
  tolerance: number;
  questionId: string;
  desc?: string;
}

const TOLERANCE_LABELS = ["Core Dogma", "Primary", "Secondary", "Tertiary", "Non-Essential"];
const TOLERANCE_DESCRIPTIONS = [
  "Non-negotiable beliefs central to Christian orthodoxy",
  "Doctrines that define theological traditions",
  "Important beliefs that distinguish denominations",
  "Positions debated within denominations",
  "Matters of personal conviction or preference",
];
const TOLERANCE_ICONS = ["✦", "◆", "●", "▸", "○"];
const TOLERANCE_STYLES = [
  "bg-red-900 text-red-50 border-red-950",
  "bg-orange-500 text-orange-50 border-orange-600",
  "bg-yellow-400 text-yellow-50 border-yellow-500",
  "bg-green-600 text-green-50 border-green-700",
  "bg-blue-400 text-blue-50 border-blue-500",
];
const TOLERANCE_DOT_COLORS = [
  "bg-red-500",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-green-500",
  "bg-blue-400",
];
const TOLERANCE_BORDER_STYLES = [
  "border-l-red-500",
  "border-l-orange-400",
  "border-l-yellow-400",
  "border-l-green-500",
  "border-l-blue-400",
];

const CERTAINTY_TEXT = ["Not Sure", "Leaning", "Pretty Sure", "Certain"];

function CertaintyRing({ certainty, size = 20 }: { certainty: number; size?: number }) {
  const strokeWidth = 1.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffsets = [
    circumference,
    circumference * 0.65,
    circumference * 0.3,
    0,
  ];
  const ringColors = [
    "stroke-slate-300",
    "stroke-blue-400",
    "stroke-blue-600",
    "stroke-blue-900",
  ];

  return (
    <svg width={size} height={size} className="shrink-0" viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="currentColor" strokeWidth={strokeWidth}
        className="text-slate-200"
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="currentColor" strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffsets[certainty]}
        strokeLinecap="round"
        className={ringColors[certainty]}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {certainty === 3 && (
        <circle cx={size / 2} cy={size / 2} r={2} fill="#1e3a5f" />
      )}
    </svg>
  );
}

export default function ExportLabelsCard({
  userLabels,
  selectedMode,
  questionCount,
  onRef,
}: {
  userLabels: any[];
  selectedMode: "quick" | "standard" | "deep" | null;
  questionCount: number;
  onRef: (el: HTMLDivElement | null) => void;
}) {
  const modeLabel =
    selectedMode === "quick"
      ? "Quick Mode"
      : selectedMode === "standard"
        ? "Standard Mode"
        : "Deep Dive";

  // Parse and deduplicate labels
  const labels = useMemo(() => {
    if (!userLabels || userLabels.length === 0) return [] as Label[];
    const map = new Map<string, Label>();
    for (const raw of userLabels) {
      const obj = typeof raw.label === "object" ? (raw.label as any) : raw;
      const labelKey = typeof obj === "string" ? obj : obj?.label;
      if (!labelKey) continue;
      const existing = map.get(labelKey);
      if (!existing || (obj.certainty ?? 0) > existing.certainty) {
        map.set(labelKey, {
          label: labelKey,
          category: obj.category || "GEN",
          certainty: obj.certainty ?? 0,
          tolerance: obj.tolerance ?? 2,
          questionId: obj.questionId || "",
          desc: obj.desc,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      b.certainty - a.certainty || a.label.localeCompare(b.label)
    );
  }, [userLabels]);

  // Group by tolerance tier
  const groups = useMemo(() => {
    const tiered: Label[][] = [[], [], [], [], []];
    for (const l of labels) {
      const t = Math.min(4, Math.max(0, l.tolerance ?? 2));
      tiered[t].push(l);
    }
    return tiered.map((items, i) => ({
      tolerance: i,
      title: TOLERANCE_LABELS[i],
      icon: TOLERANCE_ICONS[i],
      style: TOLERANCE_STYLES[i],
      borderStyle: TOLERANCE_BORDER_STYLES[i],
      items: items.sort((a, b) => b.certainty - a.certainty || a.label.localeCompare(b.label)),
    }));
  }, [labels]);

  const now = new Date();
  const timestamp = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      ref={onRef}
      className="absolute w-[960px] bg-white text-slate-900 overflow-hidden shadow-2xl ring-1 ring-slate-200 font-sans"
      style={{ left: "-9999px", top: "0" }}
    >
      {/* ─── HEADER ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-10 py-6 flex justify-between items-center border-b-4 border-emerald-500/40">
        <div>
          <div className="text-3xl font-bold font-serif tracking-tight">
            TheoCompass <span className="text-emerald-300 text-lg font-sans tracking-widest ml-2">Open Beta</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-emerald-300 text-sm font-bold uppercase tracking-widest">
              Theological Identity Report
            </span>
            <span className="bg-emerald-600/30 text-emerald-100 text-xs font-bold px-3 py-0.5 rounded-full border border-emerald-400/30">
              {modeLabel} • {questionCount} questions
            </span>
          </div>
        </div>
        <div className="w-16 h-16 bg-white rounded-full flex-shrink-0 flex items-center justify-center shadow-lg border-2 border-slate-700 overflow-hidden">
          <Image src="/logo.png" alt="Logo" width={56} height={56} className="object-contain p-1" />
        </div>
      </div>

      {/* ─── HERO ─── */}
      <div className="relative bg-white text-center py-10 px-10 border-b border-slate-200 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/50 via-white to-white pointer-events-none" />
        <div className="relative z-10">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
            Your Personalized Theological Labels
          </div>
          <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Each label represents a theological conviction derived from your answers, grouped by dogmatic
            weight from core doctrines to personal preferences.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-slate-900 px-6 py-2 rounded-full shadow-md border border-slate-800">
            <span className="text-3xl font-bold text-white">{labels.length}</span>
            <span className="text-sm font-bold text-emerald-300 uppercase tracking-widest">Labels</span>
          </div>
        </div>
      </div>

      {/* ─── TIER SUMMARY BAR ─── */}
      <div className="bg-white border-b border-slate-200 px-10 py-5">
        <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
          {groups.map((g) => {
            if (g.items.length === 0) return null;
            const pct = (g.items.length / labels.length) * 100;
            return (
              <div
                key={g.tolerance}
                className={`${TOLERANCE_DOT_COLORS[g.tolerance]}`}
                style={{ width: `${pct}%` }}
                title={`${g.title}: ${g.items.length}`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
          {groups.map((g) => (
            <div key={g.tolerance} className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-2.5 h-2.5 rounded-full ${TOLERANCE_DOT_COLORS[g.tolerance]}`} />
              <span className="text-slate-500 font-bold">{g.icon} {g.title}</span>
              <span className="text-slate-400 font-mono">{g.items.length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── LABELS BY TIER ─── */}
      <div className="bg-white border-b border-slate-200 px-8 py-8">
        <div className="space-y-3">
          {groups.map((group) => {
            const isEmpty = group.items.length === 0;
            return (
              <div
                key={group.tolerance}
                className={`rounded-2xl border border-slate-200 overflow-hidden border-l-4 ${group.borderStyle} ${isEmpty ? "opacity-40" : ""}`}
              >
                {/* Tier header */}
                <div className="flex items-center gap-3 px-5 py-3 bg-slate-50/80 border-b border-slate-100">
                  <span className={`w-3 h-3 rounded-full ${TOLERANCE_DOT_COLORS[group.tolerance]}`} />
                  <span className="font-bold text-slate-800 text-sm">{group.icon} {group.title}</span>
                  <span className="text-xs text-slate-400 ml-1 hidden sm:inline">{TOLERANCE_DESCRIPTIONS[group.tolerance]}</span>
                  <span className="text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {group.items.length}
                  </span>
                </div>

                {/* Labels grid */}
                <div className="px-5 py-4">
                  {isEmpty ? (
                    <p className="text-xs text-slate-400 italic">No beliefs in this tier</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {group.items.map((labelObj, idx) => (
                        <div
                          key={`${group.tolerance}-${idx}-${labelObj.label}`}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${group.style} border`}
                        >
                          <CertaintyRing certainty={labelObj.certainty} size={18} />
                          <span>{labelObj.label}</span>
                          <span className="text-[10px] opacity-70 font-normal ml-1">
                            {CERTAINTY_TEXT[labelObj.certainty]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <div className="bg-slate-900 px-10 py-8 text-center border-t-4 border-slate-800">
        <p className="font-serif italic text-base text-slate-300 mb-3">
          &ldquo;He is before all things, and in him all things hold together.&rdquo; — Colossians 1:17
        </p>
        <div className="w-12 h-px bg-slate-700 mx-auto my-3" />
        <p className="text-xs text-slate-400 mb-1">Built for informed decision, not persuasion.</p>
        <p className="text-xs text-slate-500 font-mono mt-2">
          theocompass.com • Generated {timestamp}
        </p>
      </div>
    </div>
  );
}
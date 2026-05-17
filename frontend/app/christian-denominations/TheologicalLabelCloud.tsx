"use client";
import { useState, useMemo } from "react";

interface Label {
  label: string;
  category: string;
  certainty: number;
  tolerance: number;
  questionId: string;
  desc?: string;
}

interface TheologicalLabelCloudProps {
  userLabels: Label[];
  className?: string;
}

type ViewMode = "importance" | "category";

const TOLERANCE_STYLES = [
  "bg-red-900 text-red-50 border-red-950 hover:bg-red-800",
  "bg-orange-500 text-orange-50 border-orange-600 hover:bg-orange-400",
  "bg-yellow-400 text-yellow-50 border-yellow-500 hover:bg-yellow-300",
  "bg-green-600 text-green-50 border-green-700 hover:bg-green-500",
  "bg-blue-400 text-blue-50 border-blue-500 hover:bg-blue-500"
];

const TOLERANCE_TEXT = ["Core Dogma", "Primary", "Secondary", "Tertiary", "Non-Essential"];
const TOLERANCE_DESCRIPTIONS = [
  "Non-negotiable beliefs central to Christian orthodoxy",
  "Doctrines that define theological traditions",
  "Important beliefs that distinguish denominations",
  "Positions debated within denominations",
  "Matters of personal conviction or preference",
];

const TOLERANCE_ICONS = [
  "✦", // Core Dogma — star symbol
  "◆", // Primary — diamond
  "●", // Secondary — circle
  "▸", // Tertiary — arrow
  "○"  // Non-Essential — open circle
];

const TOLERANCE_BORDER_COLORS = [
  "border-l-red-500",
  "border-l-orange-400",
  "border-l-yellow-400",
  "border-l-green-500",
  "border-l-blue-400"
];

const TOLERANCE_TINT_BG = [
  "bg-red-50/50",
  "bg-orange-50/50",
  "bg-yellow-50/50",
  "bg-green-50/50",
  "bg-blue-50/50"
];

const TOLERANCE_DOT_COLORS = [
  "bg-red-500",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-green-500",
  "bg-blue-400"
];

const TOLERANCE_BAR_COLORS = [
  "bg-red-600",
  "bg-orange-500",
  "bg-yellow-400",
  "bg-green-500",
  "bg-blue-400"
];

const CERTAINTY_SIZES = [
  "text-[10px] px-2 py-0.5 font-medium border",
  "text-xs px-3 py-1 font-semibold border-2",
  "text-sm px-4 py-1.5 font-bold border-2 shadow-sm",
  "text-base px-5 py-2 font-black border-4 shadow-md",
];

const CERTAINTY_TEXT = ["Not Sure", "Leaning", "Pretty Sure", "Certain"];

const CERTAINTY_RING_COLORS = [
  "stroke-slate-300",   // Not Sure
  "stroke-blue-400",    // Leaning
  "stroke-blue-600",    // Pretty Sure
  "stroke-blue-900"     // Certain
];

const CATEGORY_LABELS: Record<string, string> = {
  "GOD": "The Nature of God, Christ, & the Holy Spirit",
  "CHR": "The Church: Its Nature and Structure", 
  "SCR": "Scripture and Authority",
  "SAL": "Humanity, Sin, and Salvation",
  "SAC": "Sacraments and Rites",
  "WOR": "Worship and Spiritual Life",
  "ESC": "The Last Things (Eschatology)",
  "ETH": "Christian Ethics and Life in the World",
  "MET": "Overarching Theological Approaches",
  "GEN": "General"
};

const CATEGORY_SHORT_LABELS: Record<string, string> = {
  "GOD": "God & Christ",
  "CHR": "Church",
  "SCR": "Scripture",
  "SAL": "Salvation",
  "SAC": "Sacraments",
  "WOR": "Worship",
  "ESC": "Eschatology",
  "ETH": "Ethics",
  "MET": "Approaches",
  "GEN": "General"
};

const CATEGORY_DOT_COLORS: Record<string, string> = {
  "GOD": "bg-amber-400",
  "CHR": "bg-purple-400",
  "SCR": "bg-emerald-400",
  "SAL": "bg-rose-400",
  "SAC": "bg-cyan-400",
  "WOR": "bg-indigo-400",
  "ESC": "bg-fuchsia-400",
  "ETH": "bg-teal-400",
  "MET": "bg-orange-400",
  "GEN": "bg-slate-400"
};

const CATEGORY_SORT_ORDER = [
  "GOD", "CHR", "SCR", "SAL", "SAC", "WOR", "ESC", "ETH", "MET", "GEN"
];

const IMPORTANCE_ORDER = [0, 1, 2, 3, 4];

function CertaintyRing({ certainty, size = 28 }: { certainty: number; size?: number }) {
  const strokeWidth = 1.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const dashOffsets = [
    circumference,                // 0% — empty
    circumference * 0.65,         // 35% — ~1/3
    circumference * 0.3,          // 70% — ~2/3
    0                              // 100% — full
  ];

  return (
    <svg width={size} height={size} className="shrink-0" viewBox={`0 0 ${size} ${size}`}>
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-200"
      />
      {/* Foreground ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffsets[certainty]}
        strokeLinecap="round"
        className={`${CERTAINTY_RING_COLORS[certainty]} transition-all duration-500`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* Center dot for fully certain */}
      {certainty === 3 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={2}
          className="fill-blue-900"
        />
      )}
    </svg>
  );
}

export default function TheologicalLabelCloud({ userLabels, className = "" }: TheologicalLabelCloudProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("importance");
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());

  // Extract unique labels (deduplicated)
  const labelMap = useMemo(() => {
    if (!userLabels || userLabels.length === 0) return new Map<string, Label>();
    
    const map = new Map<string, Label>();
    userLabels.forEach(labelObj => {
      const labelKey = typeof labelObj.label === 'object' 
        ? (labelObj.label as any)?.label 
        : labelObj.label;

      if (!labelKey) return;

      const existing = map.get(labelKey);
      let shouldReplace = false;
      if (!existing) {
        shouldReplace = true;
      } else {
        if (labelObj.certainty > existing.certainty) {
          shouldReplace = true;
        } else if (labelObj.certainty === existing.certainty && labelObj.desc && !existing.desc) {
          shouldReplace = true;
        }
      }
      if (shouldReplace) map.set(labelKey, labelObj);
    });
    return map;
  }, [userLabels]);

  // All labels as array, filtered by search & category
  const filteredLabels = useMemo(() => {
    const all = Array.from(labelMap.values());
    
    return all.filter(labelObj => {
      const text = (typeof labelObj.label === 'object' ? (labelObj.label as any).label : labelObj.label) || '';
      
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = text.toLowerCase().includes(q) || 
          (labelObj.desc && labelObj.desc.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Category filter (only when not empty)
      if (activeCategories.size > 0) {
        if (!activeCategories.has(labelObj.category || "GEN")) return false;
      }

      return true;
    });
  }, [labelMap, searchQuery, activeCategories]);

  // Importance mode groups — include ALL tiers (empty ones too) for the card layout
  const allImportanceGroups = useMemo(() => {
    return IMPORTANCE_ORDER.map(tol => ({
      tolerance: tol,
      title: TOLERANCE_TEXT[tol],
      icon: TOLERANCE_ICONS[tol],
      style: TOLERANCE_STYLES[tol],
      borderColor: TOLERANCE_BORDER_COLORS[tol],
      tintBg: TOLERANCE_TINT_BG[tol],
      labels: filteredLabels
        .filter(l => l.tolerance === tol)
        .sort((a, b) => (b.certainty - a.certainty) || String(a.label || "").localeCompare(String(b.label || "")))
    }));
  }, [filteredLabels]);

  // Category mode groups
  const categoryGroups = useMemo(() => {
    const groups: Record<string, Label[]> = {};
    filteredLabels.forEach(labelObj => {
      const catKey = labelObj.category || "GEN";
      if (!groups[catKey]) groups[catKey] = [];
      groups[catKey].push(labelObj);
    });

    return Object.entries(groups)
      .map(([cat, labels]) => ({
        id: cat,
        title: CATEGORY_LABELS[cat] || cat,
        shortTitle: CATEGORY_SHORT_LABELS[cat] || cat,
        labels: labels.sort((a, b) => 
          (b.certainty - a.certainty) || 
          (String(a.label || "").localeCompare(String(b.label || "")))
        )
      }))
      .sort((a, b) => {
        const indexA = CATEGORY_SORT_ORDER.indexOf(a.id);
        const indexB = CATEGORY_SORT_ORDER.indexOf(b.id);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });
  }, [filteredLabels]);

  // Accordion state: which groups are expanded (for category view only)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set([]));

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  // Available categories for chips (derived from all labels, not just filtered)
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    labelMap.forEach(labelObj => cats.add(labelObj.category || "GEN"));
    return Array.from(cats).sort((a, b) => {
      const indexA = CATEGORY_SORT_ORDER.indexOf(a);
      const indexB = CATEGORY_SORT_ORDER.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [labelMap]);

  const toggleCategoryFilter = (cat: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setActiveCategories(new Set());
  };

  const hasActiveFilters = searchQuery.length > 0 || activeCategories.size > 0;

  const toggleExpandedLabel = (labelKey: string) => {
    setExpandedLabel(prev => prev === labelKey ? null : labelKey);
  };

  if (!userLabels || userLabels.length === 0) return null;

  const totalLabels = labelMap.size;

  // Calculate tier distribution for summary bar (using all labels, not filtered)
  const tierCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    labelMap.forEach(labelObj => {
      const tol = labelObj.tolerance ?? 2;
      if (tol >= 0 && tol <= 4) counts[tol]++;
    });
    return counts;
  }, [labelMap]);

  // Check if all beliefs fall into a single tier
  const dominantTier = useMemo(() => {
    const maxCount = Math.max(...tierCounts);
    if (maxCount === totalLabels && totalLabels > 0) {
      const tierIdx = tierCounts.indexOf(maxCount);
      return { idx: tierIdx, name: TOLERANCE_TEXT[tierIdx], icon: TOLERANCE_ICONS[tierIdx] };
    }
    return null;
  }, [tierCounts, totalLabels]);

  // Render a single label pill (shared between importance and category views)
  const renderLabelPill = (labelObj: Label, keyPrefix: string, idx: number) => {
    const actualLabelText = typeof labelObj.label === 'object' 
      ? (labelObj.label as any).label 
      : labelObj.label;
    const isHovered = hoveredLabel === actualLabelText;
    const isExpandedLabel = expandedLabel === actualLabelText;
    const labelStyle = TOLERANCE_STYLES[labelObj.tolerance ?? 2];
    const sizeStyle = CERTAINTY_SIZES[labelObj.certainty ?? 0];
    const categoryKey = labelObj.category || "GEN";
    const catDotColor = CATEGORY_DOT_COLORS[categoryKey] || "bg-slate-400";

    return (
      <div key={`${keyPrefix}-${idx}-${actualLabelText}`} className="relative">
        {/* Main tag */}
        <button
          onClick={() => toggleExpandedLabel(actualLabelText)}
          onMouseEnter={() => setHoveredLabel(actualLabelText)}
          onMouseLeave={() => setHoveredLabel(null)}
          className={`
            rounded-full transition-all duration-200 ease-out text-center leading-tight cursor-pointer
            flex items-center gap-1.5 relative
            ${sizeStyle} ${labelStyle}
            ${isHovered ? 'scale-105 shadow-md -translate-y-0.5' : ''}
            ${hoveredLabel && hoveredLabel !== actualLabelText ? 'opacity-40 grayscale' : 'opacity-100'}
            ${isExpandedLabel ? 'ring-2 ring-offset-1 ring-blue-500' : ''}
          `}
        >
          <CertaintyRing certainty={labelObj.certainty ?? 0} size={16} />
          {actualLabelText}
          {/* Category indicator dot (top-right) */}
          <span 
            className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${catDotColor} border border-white/60`}
            title={CATEGORY_SHORT_LABELS[categoryKey] || categoryKey}
          />
        </button>

        {/* Click-expanded detail panel */}
        {isExpandedLabel && (
          <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm text-sm w-full max-w-sm z-10 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TOLERANCE_STYLES[labelObj.tolerance ?? 2]}`}>
                  {TOLERANCE_TEXT[labelObj.tolerance]}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {CATEGORY_SHORT_LABELS[labelObj.category] || labelObj.category}
                </span>
              </div>
              <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                <CertaintyRing certainty={labelObj.certainty ?? 0} size={12} />
                {CERTAINTY_TEXT[labelObj.certainty]}
              </span>
            </div>
            {labelObj.desc && (
              <p className="text-xs text-slate-600 leading-relaxed">{labelObj.desc}</p>
            )}
            {!labelObj.desc && (
              <p className="text-xs text-slate-400 italic">No additional context available.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ─── HEADER: Title + View Toggle + Legend ─── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h3 className="font-serif text-xl font-bold text-slate-900">Theological Labels</h3>
            <p className="text-sm text-slate-500">{totalLabels} beliefs defining your worldview</p>
          </div>
          
          {/* View Toggle — restyled */}
          <div className="flex bg-slate-100 rounded-xl p-1.5 gap-1 shrink-0 border border-slate-200">
            <button
              onClick={() => setViewMode("importance")}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                viewMode === "importance" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              ✦ By Importance
            </button>
            <button
              onClick={() => setViewMode("category")}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                viewMode === "category" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              By Category
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search labels..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          {availableCategories.length > 1 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">Filter:</span>
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategoryFilter(cat)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                    activeCategories.has(cat)
                      ? "bg-blue-100 border-blue-300 text-blue-800"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  {CATEGORY_SHORT_LABELS[cat] || cat}
                  <span className="ml-1 opacity-60">
                    {Array.from(labelMap.values()).filter(l => (l.category || "GEN") === cat).length}
                  </span>
                </button>
              ))}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Legend Row */}
        <div className="flex flex-col sm:flex-row gap-4 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex flex-col gap-2 flex-1">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Certainty (Ring)</span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <CertaintyRing certainty={0} size={16} /> Not Sure
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <CertaintyRing certainty={1} size={16} /> Leaning
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <CertaintyRing certainty={2} size={16} /> Pretty Sure
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <CertaintyRing certainty={3} size={16} /> Certain
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Dogmatic Weight (Color)</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {TOLERANCE_TEXT.map((text, i) => (
                <span key={text} className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${TOLERANCE_STYLES[i]}`}>
                  {TOLERANCE_ICONS[i]} {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── TIER SUMMARY BAR (Importance view only) ─── */}
      {viewMode === "importance" && totalLabels > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Belief Distribution</span>
            {dominantTier && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                All beliefs are {dominantTier.icon} {dominantTier.name}
              </span>
            )}
          </div>
          {/* Stacked Bar */}
          <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
            {tierCounts.map((count, i) => {
              if (count === 0) return null;
              const pct = (count / totalLabels) * 100;
              return (
                <div
                  key={i}
                  className={`${TOLERANCE_BAR_COLORS[i]} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                  title={`${TOLERANCE_TEXT[i]}: ${count}`}
                />
              );
            })}
          </div>
          {/* Tier Labels Row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {IMPORTANCE_ORDER.map((i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${TOLERANCE_DOT_COLORS[i]}`} />
                <span className="text-slate-500 font-medium">
                  {TOLERANCE_ICONS[i]} {TOLERANCE_TEXT[i]}
                </span>
                <span className="text-slate-400 font-mono">{tierCounts[i]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── LABEL CLOUD ─── */}
      <div className="space-y-3">
        {viewMode === "importance" ? (
          allImportanceGroups.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-slate-400 font-medium">No labels match your current filters.</p>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            /* ─── IMPORTANCE VIEW: Persistent Tier Cards ─── */
            <div className="space-y-3">
              {allImportanceGroups.map((group) => {
                const isEmpty = group.labels.length === 0;
                return (
                  <div
                    key={group.tolerance}
                    className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${
                      isEmpty ? "opacity-50" : ""
                    } border-l-4 ${group.borderColor}`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-slate-50/80 border-b border-slate-100">
                      <span className={`w-3 h-3 rounded-full ${TOLERANCE_DOT_COLORS[group.tolerance]}`} />
                      <span className="font-bold text-slate-800">{group.icon} {group.title}</span>
                      <span className="text-xs text-slate-400 ml-1 hidden sm:inline">{TOLERANCE_DESCRIPTIONS[group.tolerance]}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isEmpty
                          ? "bg-slate-100 text-slate-400"
                          : "bg-white text-slate-500 border border-slate-200"
                      }`}>
                        {group.labels.length}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="px-5 py-3">
                      {isEmpty ? (
                        <p className="text-xs text-slate-400 italic">No beliefs in this tier</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {group.labels.map((labelObj, idx) =>
                            renderLabelPill(labelObj, `imp-${group.tolerance}`, idx)
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : categoryGroups.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-slate-400 font-medium">No labels match your current filters.</p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          /* ─── CATEGORY VIEW (Accordion) ─── */
          <div className="space-y-2">
            {categoryGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.title);
              return (
                <div key={group.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800">{group.shortTitle}</span>
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {group.labels.length}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Accordion Content */}
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="px-5 pb-4 pt-1">
                      <div className="flex flex-wrap gap-2">
                        {group.labels.map((labelObj, idx) =>
                          renderLabelPill(labelObj, `cat-${group.id}`, idx)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Result summary */}
        <div className="text-center text-xs text-slate-400 pt-1">
          Showing {filteredLabels.length} of {totalLabels} labels
          {hasActiveFilters && ` (filtered)`}
        </div>
      </div>
    </div>
  );
}
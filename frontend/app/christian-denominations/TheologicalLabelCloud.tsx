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

const TOLERANCE_STYLES = [
  "bg-red-900 text-red-50 border-red-950 hover:bg-red-800",
  "bg-orange-500 text-orange-50 border-orange-600 hover:bg-orange-400",
  "bg-yellow-400 text-yellow-50 border-yellow-500 hover:bg-yellow-300",
  "bg-green-600 text-green-50 border-green-700 hover:bg-green-500",
  "bg-blue-400 text-blue-50 border-blue-500 hover:bg-blue-500"
];

const TOLERANCE_TEXT = ["Salvation Issue", "Opposed", "Discerning", "Charitable", "Accepting"];

const CERTAINTY_SIZES = [
  "text-[10px] px-2 py-0.5 font-medium border",
  "text-xs px-3 py-1 font-semibold border-2",
  "text-sm px-4 py-1.5 font-bold border-2 shadow-sm",
  "text-base px-5 py-2 font-black border-4 shadow-md",
];

const CERTAINTY_TEXT = ["Not Sure", "Leaning", "Pretty Sure", "Certain"];

// 1. Updated Labels to match your specific requirements
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
  "GEN": "General" // Fallback
};

// 2. Define the explicit sort order
const CATEGORY_SORT_ORDER = [
  "GOD",
  "CHR",
  "SCR",
  "SAL",
  "SAC",
  "WOR",
  "ESC",
  "ETH",
  "MET",
  "GEN"
];

export default function TheologicalLabelCloud({ userLabels, className = "" }: TheologicalLabelCloudProps) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const processedCategories = useMemo(() => {
    if (!userLabels || userLabels.length === 0) return [];
    
    const uniqueLabelsMap = new Map<string, Label>();
    
    userLabels.forEach(labelObj => {
      const labelKey = typeof labelObj.label === 'object' 
        ? (labelObj.label as any)?.label 
        : labelObj.label;

      if (!labelKey) return;

      const existing = uniqueLabelsMap.get(labelKey);
      
      let shouldReplace = false;
      if (!existing) {
        shouldReplace = true;
      } else {
        if (labelObj.certainty > existing.certainty) {
          shouldReplace = true;
        } 
        else if (labelObj.certainty === existing.certainty && labelObj.desc && !existing.desc) {
          shouldReplace = true;
        }
      }

      if (shouldReplace) {
        uniqueLabelsMap.set(labelKey, labelObj);
      }
    });

    const groups: Record<string, Label[]> = {};
    Array.from(uniqueLabelsMap.values()).forEach(labelObj => {
      const catKey = labelObj.category || "GEN";
      if (!groups[catKey]) groups[catKey] = [];
      groups[catKey].push(labelObj);
    });

    return Object.entries(groups)
      .map(([cat, labels]) => ({
        id: cat, 
        title: CATEGORY_LABELS[cat] || cat,
        labels: labels.sort((a, b) => 
          (b.certainty - a.certainty) || 
          (String(a.label || "").localeCompare(String(b.label || "")))
        )
      }))
      // 3. Sort using the explicit order defined above
      .sort((a, b) => {
        const indexA = CATEGORY_SORT_ORDER.indexOf(a.id);
        const indexB = CATEGORY_SORT_ORDER.indexOf(b.id);
        
        // If category not in list, push to end
        const safeIndexA = indexA === -1 ? 999 : indexA;
        const safeIndexB = indexB === -1 ? 999 : indexB;
        
        return safeIndexA - safeIndexB;
      });
  }, [userLabels]);

  if (!userLabels || userLabels.length === 0) return null;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* --- LEGEND SECTION --- */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-6 justify-between items-center">
        <div>
          <h3 className="font-serif text-xl font-bold text-slate-900">Your Theological Labels</h3>
          <p className="text-sm text-slate-500">The specific doctrines defining your worldview.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-8 text-slate-600 bg-slate-50 p-5 rounded-xl border border-slate-100 w-full xl:w-auto">
          <div className="flex flex-col gap-3 flex-1">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Certainty (Size)</span>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`bg-white rounded-full text-slate-600 ${CERTAINTY_SIZES[0]}`}>Not Sure</span>
              <span className={`bg-white rounded-full text-slate-700 ${CERTAINTY_SIZES[1]}`}>Leaning</span>
              <span className={`bg-white rounded-full text-slate-800 ${CERTAINTY_SIZES[2]}`}>Pretty Sure</span>
              <span className={`bg-white rounded-full text-slate-900 ${CERTAINTY_SIZES[3]}`}>Certain</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 flex-2">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Posture (Color)</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full ${CERTAINTY_SIZES[1]} ${TOLERANCE_STYLES[0]}`}>Salvation Issue</span>
              <span className={`rounded-full ${CERTAINTY_SIZES[1]} ${TOLERANCE_STYLES[1]}`}>Opposed</span>
              <span className={`rounded-full ${CERTAINTY_SIZES[1]} ${TOLERANCE_STYLES[2]}`}>Discerning</span>
              <span className={`rounded-full ${CERTAINTY_SIZES[1]} ${TOLERANCE_STYLES[3]}`}>Charitable</span>
              <span className={`rounded-full ${CERTAINTY_SIZES[1]} ${TOLERANCE_STYLES[4]}`}>Accepting</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- LABELS RENDERING SECTION --- */}
      <div className="space-y-8">
        {processedCategories.map((group) => (
          <div key={group.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            
            <h4 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              {group.title}
            </h4>

            <div className="flex flex-wrap gap-3 items-center">
              {group.labels.map((labelObj, idx) => {
                const actualLabelText = typeof labelObj.label === 'object' 
                  ? (labelObj.label as any).label 
                  : labelObj.label;

                return (
                  <div 
                    key={`${group.id}-${idx}-${actualLabelText}`} 
                    className="relative group cursor-pointer" 
                    onMouseEnter={() => setHoveredLabel(actualLabelText)} 
                    onMouseLeave={() => setHoveredLabel(null)}
                  >
                    <div className={`
                      rounded-full transition-all duration-300 ease-out text-center leading-tight 
                      ${CERTAINTY_SIZES[labelObj.certainty ?? 0]} 
                      ${TOLERANCE_STYLES[labelObj.tolerance ?? 2]} 
                      ${hoveredLabel === actualLabelText ? 'scale-105 shadow-md -translate-y-0.5' : ''} 
                      ${hoveredLabel && hoveredLabel !== actualLabelText ? 'opacity-40 grayscale' : 'opacity-100'}
                    `}>
                      {actualLabelText}
                    </div>
                    
                    {hoveredLabel === actualLabelText && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl z-10 pointer-events-none text-center">
                        <div className="font-bold text-base mb-1">{actualLabelText}</div>
                        <div className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-2 border-b border-slate-700 pb-2">
                          {CERTAINTY_TEXT[labelObj.certainty]} • {TOLERANCE_TEXT[labelObj.tolerance]}
                        </div>
                        {labelObj.desc && (
                          <div className="text-slate-300 text-xs leading-relaxed">
                            {labelObj.desc}
                          </div>
                        )}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-slate-900"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
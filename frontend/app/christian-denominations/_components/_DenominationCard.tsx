"use client";

import { useState } from "react";
import { getTraitTags, getTierStyle } from "../_helpers";
import { AXIS_LABELS } from "../_constants";

export function DenominationCard({
  denom,
  rank,
  userCoords,
}: {
  denom: any;
  rank: number;
  userCoords?: Record<string, number>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const tier = getTierStyle(denom.matchPercentage);
  const tags = getTraitTags(denom.dimCoords, userCoords);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-3 overflow-hidden transition-all duration-200 hover:border-slate-300 hover:shadow-md border-l-4"
      style={{ borderLeftColor: tier.hex }}
    >
      <button
        type="button"
        className="w-full p-4 flex justify-between items-center cursor-pointer select-none hover:bg-slate-50/60 text-left transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
            rank === 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            {rank}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className={`font-bold text-sm transition-colors ${isOpen ? "text-blue-700" : "text-slate-800"}`}>
                {denom.name}
              </h4>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${tier.textColor} ${tier.bg} ${tier.borderColor}`}>
                {tier.badge}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">{denom.family}</span>
              {tags.length > 0 && (
                <span className="flex gap-1">
                  {tags.map((tag, i) => (
                    <span key={i} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${tag.color}`}>
                      {tag.label}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`font-bold text-sm px-3 py-1 rounded-lg ${
            rank === 1 ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
          }`}>
            {denom.matchPercentage}%
          </div>
          <div className={`text-slate-400 transform transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/80">
          <div className="flex flex-wrap gap-4 mt-3 mb-3 text-xs text-slate-500 font-mono">
            {denom.foundedyear && <span>Founded {denom.foundedyear}</span>}
            {denom.regionorigin && <span>Origin {denom.regionorigin}</span>}
          </div>

          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            {denom.description || "No description available for this tradition."}
          </p>

          {/* Mini Divergence Bars */}
          {userCoords && denom.dimCoords && Object.keys(denom.dimCoords).length > 0 && (
            <div className="border-t border-slate-200/60 pt-3 mt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Alignment by Axis
              </p>
              <div className="flex flex-col gap-1.5">
                {(Object.entries(denom.dimCoords) as [string, number][])
                  .sort((a, b) => {
                    const gapA = userCoords[a[0]] !== undefined ? Math.abs(userCoords[a[0]] - a[1]) : 99;
                    const gapB = userCoords[b[0]] !== undefined ? Math.abs(userCoords[b[0]] - b[1]) : 99;
                    return gapB - gapA;
                  })
                  .slice(0, 5)
                  .map(([axis, denomScore]) => {
                    const labels = AXIS_LABELS[axis];
                    const userScore = userCoords[axis];
                    if (!labels || userScore === undefined) return null;
                    const flippedUser = 100 - userScore;
                    const flippedDenom = 100 - (denomScore as number);
                    const gap = Math.abs(flippedUser - flippedDenom);
                    return (
                      <div key={axis} className="flex items-center gap-2 h-4">
                        <span className="text-[9px] text-slate-400 w-16 text-right truncate">{labels.right}</span>
                        <div className="relative flex-grow h-1.5 bg-slate-100 rounded-full">
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-700 border border-white shadow-sm z-10"
                            style={{ left: `${flippedUser}%` }}
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-full rounded-full z-0"
                            style={{
                              left: `${Math.min(flippedUser, flippedDenom)}%`,
                              width: `${gap}%`,
                              backgroundColor: gap <= 10 ? "#10b981" : "#f59e0b",
                              opacity: 0.3,
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 w-16 truncate">{labels.left}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
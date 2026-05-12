"use client";

import { useState } from "react";
import { getTierStyle } from "../_helpers";

export function FamilyCard({ familyData, rank }: { familyData: any; rank: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const famTier = getTierStyle(familyData.matchPercentage ?? 0);

  return (
    <div className={`bg-white border rounded-xl shadow-sm mb-3 overflow-hidden transition-all duration-200 hover:shadow-md border-l-4 ${famTier.borderColor}`}>
      <div
        className="p-4 flex justify-between items-center cursor-pointer select-none hover:bg-slate-50/60 text-left transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-slate-100 text-slate-500`}>
            {rank}
          </div>
          <div>
            <h4 className={`font-bold text-sm transition-colors ${isOpen ? 'text-blue-700' : 'text-slate-800'}`}>
              {familyData.family}
            </h4>
            <div className="text-xs text-slate-400 mt-0.5">
              Closest Individual Match: <span className="font-semibold text-slate-600">{familyData.topDenomination?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`font-bold text-sm ${famTier.textColor} ${famTier.bg} px-3 py-1 rounded-lg`}>
            {familyData.matchPercentage}%
          </div>
          <div className={`text-slate-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/80">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 mt-3">Specific Denominations in Family</p>
          <div className="flex flex-col gap-1.5">
            {familyData.allDenominations.slice(0, 5).map((denom: any) => {
              const denomTier = getTierStyle(denom.matchPercentage ?? 0);
              return (
              <div key={denom.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100">
                 <span className="text-sm font-medium text-slate-700">{denom.name}</span>
                 <span className={`text-sm font-bold ${denomTier.textColor}`}>{denom.matchPercentage}%</span>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

interface ModeSelectCardsProps {
  savedMode: string | null;
  onSelectQuick: () => void;
}

export function ModeSelectCards({ savedMode, onSelectQuick }: ModeSelectCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {/* Quick Mode */}
      <button 
        onClick={onSelectQuick} 
        className={`relative p-6 rounded-2xl border-2 shadow-md hover:shadow-xl transition-all text-left group overflow-hidden ${
          savedMode === "quick" 
            ? "border-blue-600 ring-2 ring-blue-200 bg-gradient-to-br from-blue-50 to-white" 
            : "border-blue-300 hover:border-blue-600 bg-gradient-to-br from-white to-blue-50/30"
        }`}
      >
        {/* Decorative icon overlay */}
        <div className="absolute -bottom-3 -right-3 text-6xl opacity-[0.08] group-hover:opacity-[0.12] transition-opacity select-none pointer-events-none">
          ⚡
        </div>
        {savedMode === "quick" && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap shadow">
            Resume Quiz →
          </div>
        )}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
            ⚡
          </span>
          <h2 className="font-bold text-2xl text-slate-800 group-hover:text-blue-700 transition-colors">Quick</h2>
          <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-1 rounded-full ml-auto">30 Qs</span>
        </div>
        <p className="text-slate-600 text-sm mb-2 leading-relaxed">A streamlined overview of the most defining Christian doctrines.</p>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/></svg>
            ~30 min
          </span>
          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-semibold">Best for first-timers</span>
        </div>
      </button>

      {/* Standard Mode */}
      <button 
        onClick={() => alert("Standard Mode (60 questions, ~60 min) and Deep Mode (120 questions, ~120 min) are coming soon. Subscribe on r/TheoCompass for updates!")}
        className="p-6 rounded-2xl border-2 border-slate-200 shadow-sm text-left relative overflow-hidden cursor-pointer hover:border-amber-300 hover:shadow-md transition-all w-full bg-gradient-to-br from-white to-amber-50/20 group"
      >
        <div className="absolute -bottom-3 -right-3 text-6xl opacity-[0.06] group-hover:opacity-[0.1] transition-opacity select-none pointer-events-none">
          🧭
        </div>
        <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
          Coming Soon
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
            🧭
          </span>
          <h2 className="font-bold text-2xl text-slate-600">Standard</h2>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full ml-auto">60 Qs</span>
        </div>
        <p className="text-slate-400 text-sm mb-2 leading-relaxed">The recommended TheoCompass experience.</p>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/></svg>
            ~60 min
          </span>
          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-semibold">Balanced</span>
        </div>
      </button>

      {/* Deep Mode */}
      <button 
        onClick={() => alert("Standard Mode (60 questions, ~60 min) and Deep Mode (120 questions, ~120 min) are coming soon. Subscribe on r/TheoCompass for updates!")}
        className="p-6 rounded-2xl border-2 border-slate-200 shadow-sm text-left relative overflow-hidden cursor-pointer hover:border-purple-300 hover:shadow-md transition-all w-full bg-gradient-to-br from-white to-purple-50/20 group"
      >
        <div className="absolute -bottom-3 -right-3 text-6xl opacity-[0.06] group-hover:opacity-[0.1] transition-opacity select-none pointer-events-none">
          🔬
        </div>
        <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
          Coming Soon
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
            🔬
          </span>
          <h2 className="font-bold text-2xl text-slate-600">Deep</h2>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full ml-auto">120 Qs</span>
        </div>
        <p className="text-slate-400 text-sm mb-2 leading-relaxed">The ultimate theological audit.</p>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/></svg>
            ~120 min
          </span>
          <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full text-[10px] font-semibold">Deep dive</span>
        </div>
      </button>
    </div>
  );
}
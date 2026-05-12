"use client";

import Image from "next/image";

interface PageHeaderProps {
  showRestart?: boolean;
  onLogoClick: () => void;
  onTitleClick: () => void;
  onBackClick: () => void;
  onRestartClick: () => void;
}

export function PageHeader({
  showRestart = false,
  onLogoClick,
  onTitleClick,
  onBackClick,
  onRestartClick,
}: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div className="p-4 flex items-center justify-center relative border-b border-slate-100">
        <button
          onClick={onLogoClick}
          className="absolute left-4 flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
        >
          <Image src="/logo.png" alt="TheoCompass Logo" width={40} height={40} className="object-contain" />
        </button>
        <button
          onClick={onTitleClick}
          className="font-serif font-bold text-xl text-brand-primary tracking-tight cursor-pointer hover:opacity-80 transition"
        >
          TheoCompass
        </button>
        {showRestart && (
          <button
            onClick={onRestartClick}
            title="Restart quiz"
            className="absolute right-4 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all group"
          >
            <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="sm:hidden ml-1 text-xs underline">Restart</span>
          </button>
        )}
      </div>
      <div className="px-4 py-2 bg-white">
        <button
          onClick={onBackClick}
          className="flex items-center text-sm text-slate-600 hover:text-brand-primary transition font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Main Page
        </button>
      </div>
    </header>
  );
}
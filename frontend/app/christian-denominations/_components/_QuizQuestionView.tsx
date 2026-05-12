"use client";

import type { Question, Answer, UserResponse } from "../_types";
import { QUIZ_CATEGORY_COLORS, QUIZ_CATEGORY_COLORS_DEFAULT, QUIZ_CATEGORY_LABELS, CERTAINTY_LABELS, TOLERANCE_LABELS, TOLERANCE_DESCRIPTIONS } from "../_constants";

export interface QuizQuestionViewProps {
  currentQuestion: Question;
  questions: Question[];
  currentQuestionIndex: number;
  totalQuestions: number;
  progressPercentage: number;
  hasPrimaryKeyword: boolean;
  displayAnswers: Answer[];
  selectedAnswer: string | null;
  expandedInfo: string | null;
  isSilenceSelected: boolean;
  silenceType: "apathetic" | "hostile" | null;
  certainty: number;
  tolerance: number;
  hasShownFirstInfoPulse: boolean;
  showShortcutHint: boolean;
  showCategoryTransition: boolean;
  transitionCategoryName: string;
  transitionCategoryCode: string;
  quizAnimKey: number;
  userAnswers: Record<string, UserResponse>;
  onStandardAnswerClick: (answerId: string) => void;
  onToggleInfo: (e: React.MouseEvent, answerId: string) => void;
  onSilenceClick: (type: "apathetic" | "hostile") => void;
  onSetCertainty: (val: number) => void;
  onSetTolerance: (val: number) => void;
  onNext: () => void;
  onBack: () => void;
  onDismissShortcutHint: () => void;
  onDismissCategoryTransition: () => void;
}

export function QuizQuestionView({
  currentQuestion,
  questions,
  currentQuestionIndex,
  totalQuestions,
  progressPercentage,
  hasPrimaryKeyword,
  displayAnswers,
  selectedAnswer,
  expandedInfo,
  isSilenceSelected,
  silenceType,
  certainty,
  tolerance,
  hasShownFirstInfoPulse,
  showShortcutHint,
  showCategoryTransition,
  transitionCategoryName,
  transitionCategoryCode,
  quizAnimKey,
  userAnswers,
  onStandardAnswerClick,
  onToggleInfo,
  onSilenceClick,
  onSetCertainty,
  onSetTolerance,
  onNext,
  onBack,
  onDismissShortcutHint,
  onDismissCategoryTransition,
}: QuizQuestionViewProps) {
  return (
    <main className="flex-grow w-full max-w-2xl mx-auto px-4 py-8 md:py-12 flex flex-col">
      {/* Question content with slide transition */}
      <div key={quizAnimKey} className="animate-slide-in-right flex flex-col flex-grow">
        {(() => {
          const cat = currentQuestion.category;
          const colors = QUIZ_CATEGORY_COLORS[cat] || QUIZ_CATEGORY_COLORS_DEFAULT;
          return (
            <div className="flex justify-between items-center mb-4">
              <div className={`text-xs font-bold uppercase tracking-wider ${colors.text} bg-white px-3 py-1 rounded-full border ${colors.border.replace('border-l-', 'border-')} shadow-sm`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${colors.dot}`} />
                {QUIZ_CATEGORY_LABELS[cat] || cat}
              </div>
              <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                Q {currentQuestionIndex + 1} / {totalQuestions}
              </div>
            </div>
          );
        })()}

        {/* Keyboard shortcut hint (first question only) */}
        {currentQuestionIndex === 0 && showShortcutHint && (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 flex items-center justify-between animate-fade-in-up">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span><kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px] min-w-[18px] text-center">1</kbd>–<kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px] min-w-[18px] text-center">4</kbd> Select answer</span>
              <span><kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px]">Enter</kbd> Confirm</span>
              <span><kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px]">S</kbd> Apathetic silence</span>
              <span><kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px]">H</kbd> Hostile silence</span>
            </div>
            <button
              onClick={onDismissShortcutHint}
              className="text-indigo-400 hover:text-indigo-600 ml-2 flex-shrink-0"
              aria-label="Dismiss shortcut hint"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Category transition banner */}
        {showCategoryTransition && (() => {
          const tcColors = QUIZ_CATEGORY_COLORS[transitionCategoryCode] || QUIZ_CATEGORY_COLORS_DEFAULT;
          return (
          <div className={`mb-5 p-3 rounded-xl animate-fade-in-up flex items-center justify-between gap-3 ${tcColors.bg} border ${tcColors.border.replace('border-l-', 'border-')} border-opacity-50`}>
            <div className="flex-1 text-left">
              <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${tcColors.text}`}>New Section</div>
              <div className="text-sm font-bold text-slate-800">{transitionCategoryName}</div>
            </div>
            <button
              onClick={onDismissCategoryTransition}
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-white/80 hover:bg-white text-slate-400 hover:text-slate-600 transition-colors border border-slate-200"
              aria-label="Dismiss category transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          );
        })()}

        {/* Question navigation dots (color-coded by category) */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {questions.map((q, i) => {
            const dotColors = QUIZ_CATEGORY_COLORS[q.category] || QUIZ_CATEGORY_COLORS_DEFAULT;
            const isCurrent = i === currentQuestionIndex;
            const isAnswered = !!userAnswers[q.id];
            return (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "w-5 bg-blue-600"
                    : isAnswered
                    ? `w-1.5 ${dotColors.dot}`
                    : "w-1.5 bg-slate-300"
                }`}
              />
            );
          })}
        </div>

        <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 mb-8 leading-snug">
          {currentQuestion.question}
        </h1>

        {/* ANSWERS */}
        <div className={`flex flex-col gap-3 mb-6 transition-opacity duration-300 ${isSilenceSelected ? "opacity-40" : ""}`}>
          {displayAnswers.map((ans) => {
            const isSelected = selectedAnswer === ans.id;
            const isInfoOpen = expandedInfo === ans.id;
            
            return (
              <div key={ans.id} className="flex flex-col">
                <button
                  onClick={() => onStandardAnswerClick(ans.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                    isSelected ? "border-blue-600 bg-blue-50 shadow-md" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isSelected && (
                      <svg className="w-5 h-5 text-blue-600 animate-checkmark-bounce flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span className={`font-medium ${isSelected ? "text-blue-800" : "text-slate-700"}`}>
                      {ans.text}
                    </span>
                  </span>
                  <div 
                    onClick={(e) => onToggleInfo(e, ans.id)}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors flex-shrink-0 px-3 py-1.5 rounded-full ${
                      isInfoOpen ? "bg-blue-600 text-white" : "bg-slate-100 text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    } ${
                      !hasShownFirstInfoPulse && currentQuestionIndex === 0 ? "animate-pulse-slow ring-2 ring-blue-300" : ""
                    }`}
                  >
                    <span className="text-xs whitespace-nowrap">{isInfoOpen ? "Close" : "Learn more"}</span>
                  </div>
                </button>
                {isInfoOpen && (
                  <div className="mt-2 p-4 bg-white rounded-lg text-sm text-slate-600 border border-slate-200 shadow-inner animate-fade-in-up">
                    <strong className="text-slate-800">Further Context:</strong> <br/>{ans.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* SILENCE CARDS — integrated as answer-style cards */}
        <div className="space-y-3 mb-10 border-t border-slate-200 pt-6">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Or choose silence</p>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Apathetic Silence Card */}
            <button 
              onClick={() => onSilenceClick("apathetic")}
              className={`flex-1 text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                silenceType === "apathetic" 
                  ? "bg-slate-100 border-slate-400 shadow-md" 
                  : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="text-2xl flex-shrink-0">🤷</span>
              <span className="text-left">
                <span className={`block font-medium text-sm ${silenceType === "apathetic" ? "text-slate-800" : "text-slate-600"}`}>
                  Apathetic Silence
                </span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  Not theologically relevant to me.
                </span>
              </span>
              {silenceType === "apathetic" && (
                <svg className="w-5 h-5 text-slate-500 ml-auto flex-shrink-0 mt-0.5 animate-checkmark-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Hostile Silence Card */}
            <button 
              onClick={() => onSilenceClick("hostile")}
              className={`flex-1 text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                silenceType === "hostile" 
                  ? "bg-red-50 border-red-300 shadow-md" 
                  : "border-slate-200 bg-slate-50/50 hover:border-red-100 hover:bg-red-50/50"
              }`}
            >
              <span className="text-2xl flex-shrink-0">✋</span>
              <span className="text-left">
                <span className={`block font-medium text-sm ${silenceType === "hostile" ? "text-red-800" : "text-slate-600"}`}>
                  Hostile Silence
                </span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  I reject this question's framing.
                </span>
              </span>
              {silenceType === "hostile" && (
                <svg className="w-5 h-5 text-red-500 ml-auto flex-shrink-0 mt-0.5 animate-checkmark-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* CERTAINTY / TOLERANCE SLIDERS */}
        {selectedAnswer && !isSilenceSelected && (
          <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm mb-8 overflow-hidden animate-slide-down-in">
            
            {/* Certainty Slider */}
            <div className="mb-8">
              <p className="text-sm text-slate-500 italic mb-4">How confident are you in this particular stance?</p>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-800 font-bold flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Certainty
                </span>
                <span className={`font-bold transition-colors duration-300 px-2.5 py-0.5 rounded-full text-xs ${
                  certainty === 0 ? "bg-slate-100 text-slate-500" : 
                  certainty === 1 ? "bg-blue-50 text-blue-600" : 
                  certainty === 2 ? "bg-blue-100 text-blue-700" : 
                  "bg-blue-200 text-blue-800"
                }`}>{CERTAINTY_LABELS[certainty]}</span>
              </div>
              <div className="relative">
                {/* Gradient track */}
                <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded-lg pointer-events-none bg-gradient-to-r from-slate-300 via-blue-400 to-blue-600" />
                {/* Tick marks */}
                <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 flex justify-between px-[2px] pointer-events-none">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-0.5 h-3 -translate-y-0.5 rounded-full ${i <= certainty ? 'bg-white' : 'bg-white/60'}`} />
                  ))}
                </div>
                <input 
                  type="range" min="0" max="3" step="1" 
                  value={certainty} 
                  onChange={(e) => onSetCertainty(Number(e.target.value))} 
                  className="w-full h-8 appearance-none cursor-pointer bg-transparent relative z-10
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 
                    [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-md 
                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-500 
                    [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 px-0.5">
                <span>Not Sure</span><span>Leaning</span><span>Pretty Sure</span><span>Certain</span>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-slate-100 mb-8" />
            
            {/* Tolerance Slider */}
            <div>
              <p className="text-sm text-slate-500 italic mb-4">
                {hasPrimaryKeyword 
                  ? "How many of the other options are acceptable alternatives to your primary view?" 
                  : "How many of the other options listed do you consider valid?"}
              </p>
              
              <div className="mb-3">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-slate-800 text-sm font-bold flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Tolerance
                  </span>
                  <span className={`text-xs font-bold transition-colors duration-300 px-2.5 py-0.5 rounded-full ${
                    tolerance === 0 ? "bg-red-50 text-red-600" : 
                    tolerance === 1 ? "bg-orange-50 text-orange-600" : 
                    tolerance === 2 ? "bg-yellow-50 text-yellow-600" : 
                    tolerance === 3 ? "bg-green-50 text-green-600" : 
                    "bg-sky-100 text-sk-700"
                  }`}>
                    {TOLERANCE_LABELS[tolerance]}
                  </span>
                </div>
                
                <div className="h-5">
                  <span className="text-xs text-slate-500 italic transition-all duration-200">
                    {TOLERANCE_DESCRIPTIONS[tolerance]}
                  </span>
                </div>
              </div>

              <div className="relative">
                {/* Gradient track */}
                <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded-lg pointer-events-none bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 to-sky-400" />
                {/* Tick marks */}
                <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 flex justify-between px-[2px] pointer-events-none">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-0.5 h-3 -translate-y-0.5 rounded-full ${i <= tolerance ? 'bg-white' : 'bg-white/60'}`} />
                  ))}
                </div>
                <input 
                  type="range" min="0" max="4" step="1" 
                  value={tolerance} 
                  onChange={(e) => onSetTolerance(Number(e.target.value))} 
                  className="w-full h-8 appearance-none cursor-pointer bg-transparent relative z-10
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 
                    [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-md 
                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-500 
                    [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                />
              </div>
              
              <div className="relative w-full mt-1.5 text-[10px] text-slate-400">
                {/* Desktop: 5 labels in a row */}
                <div className="hidden sm:flex justify-between h-5 leading-tight">
                  <span>None</span>
                  <span className="text-center leading-tight -ml-7">
                    None for<br />Fellowship
                  </span>
                  <span className="-ml-8">A Few</span>
                  <span className="-ml-3">Most</span>
                  <span>All</span>
                </div>
                {/* Mobile: simplified 3-label version */}
                <div className="flex sm:hidden justify-between h-4">
                  <span>None</span>
                  <span>A Few</span>
                  <span>All</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NAV FOOTER */}
        <div className="mt-auto pt-4 pb-8 flex justify-between items-center border-t border-slate-200">
          <button onClick={onBack} className={`font-bold text-slate-500 hover:text-blue-700 transition-colors ${currentQuestionIndex === 0 ? "invisible" : ""}`}>← Back</button>
          
          {/* Certainty / Tolerance summary badges (only when answer selected) */}
          {(selectedAnswer || isSilenceSelected) && (
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              {selectedAnswer && !isSilenceSelected && (
                <>
                  <span className="px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700">
                    {CERTAINTY_LABELS[certainty]}
                  </span>
                  <span className={`px-2 py-1 rounded-md border ${
                    tolerance === 0 ? "bg-red-50 border-red-200 text-red-700" : 
                    tolerance === 1 ? "bg-orange-50 border-orange-200 text-orange-700" : 
                    tolerance === 2 ? "bg-yellow-50 border-yellow-200 text-yellow-700" : 
                    tolerance === 3 ? "bg-green-50 border-green-200 text-green-700" : 
                    "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}>
                    {TOLERANCE_LABELS[tolerance]}
                  </span>
                </>
              )}
              {isSilenceSelected && (
                <span className={`px-2 py-1 rounded-md border ${
                  silenceType === "apathetic" ? "bg-slate-100 border-slate-300 text-slate-600" : "bg-red-50 border-red-200 text-red-600"
                }`}>
                  {silenceType === "apathetic" ? "Apathetic" : "Hostile"}
                </span>
              )}
            </div>
          )}
          <button 
            onClick={onNext} 
            disabled={!selectedAnswer && !isSilenceSelected} 
            className={`py-3 px-8 rounded-full font-bold text-lg transition-all ${
              (selectedAnswer || isSilenceSelected) 
                ? currentQuestionIndex === questions.length - 1 
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:-translate-y-1 animate-glow-pulse scale-105" 
                  : "bg-slate-900 text-white hover:bg-black shadow-lg hover:-translate-y-1" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {currentQuestionIndex === questions.length - 1 ? "See Results" : "Next →"}
          </button>
        </div>
      </div>
    </main>
  );
}
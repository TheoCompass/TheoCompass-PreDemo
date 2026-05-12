"use client";

import { useState } from "react";

interface InstructionsStepsProps {
  onStartQuiz: () => void;
  isLoading: boolean;
  error: string | null;
  onRetryLoad: () => void;
}

export function InstructionsSteps({ onStartQuiz, isLoading, error, onRetryLoad }: InstructionsStepsProps) {
  const [tutorialStep, setTutorialStep] = useState(0);
  const [demoInfoOpen, setDemoInfoOpen] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const totalSteps = 4;

  const steps = [
    {
      title: "Select your Stance",
      color: "text-slate-800",
      content: (
        <div>
          <p className="text-sm text-slate-600 mb-4">Choose the answer that best represents your view. Click <strong className="text-blue-600">"Learn more"</strong> for a detailed definition.</p>

          {/* Interactive demo: sample answer card with Learn more / Close pill */}
          <div className="bg-white p-4 rounded-xl border-2 border-blue-300 shadow-sm mb-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-800">Example: Transubstantiation</span>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setDemoInfoOpen(!demoInfoOpen); }}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors flex-shrink-0 px-3 py-1.5 rounded-full border ${
                  demoInfoOpen
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-slate-100 text-blue-600 border-blue-200 animate-pulse-slow ring-2 ring-blue-300"
                }`}
              >
                <span className="text-xs whitespace-nowrap">{demoInfoOpen ? "Close" : "Learn more"}</span>
              </button>
            </div>

            {demoInfoOpen && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-slate-600 border border-blue-200 animate-fade-in-up">
                <strong className="text-blue-800">Further Context:</strong><br/>
                The bread and wine become the actual body and blood of Christ during the Eucharist, while maintaining their physical appearances.
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Tap <strong className="text-blue-600 font-medium">"Learn more"</strong> on any answer during the quiz to read additional context about that theological position.
          </p>
        </div>
      ),
    },
    {
      title: "Set your Certainty",
      color: "text-blue-700",
      content: (
        <div>
          <p className="text-sm text-slate-600 mb-4">How confident are you in this specific belief?</p>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span className="text-slate-800 font-bold flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Certainty
              </span>
              <span className="font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full text-xs">Pretty Sure</span>
            </div>
            <div className="relative mb-2">
              <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded-lg pointer-events-none bg-gradient-to-r from-slate-300 via-blue-400 to-blue-600"></div>
              <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 flex justify-between px-[2px] pointer-events-none">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-0.5 h-3 -translate-y-0.5 rounded-full ${i <= 2 ? 'bg-white' : 'bg-white/60'}`} />
                ))}
              </div>
              <div className="w-full h-8 relative">
                <div className="absolute left-[62%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-blue-500 shadow-md"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Not Sure</span><span>Leaning</span><span>Pretty Sure</span><span>Certain</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Set Tolerance",
      color: "text-emerald-600",
      content: (
        <div>
          <p className="text-sm text-slate-600 mb-4">How many of the other options do you consider valid? This affects how exclusive your match is.</p>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-end mb-1">
              <span className="text-slate-800 text-sm font-bold flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Tolerance
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-600">A Few</span>
            </div>
            <p className="text-xs text-slate-500 italic mb-2">A few other options are valid, but require theological discernment.</p>
            <div className="w-full h-2 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 to-sky-400"></div>
            <div className="hidden sm:flex justify-between text-xs text-slate-400 mt-1">
              <span>None</span>
              <span className="text-center leading-tight -ml-7">None for<br/>Fellowship</span>
              <span className="-ml-8">A Few</span>
              <span className="-ml-3">Most</span>
              <span>All</span>
            </div>
            <div className="flex sm:hidden justify-between text-xs text-slate-400 mt-1">
              <span>None</span>
              <span>A Few</span>
              <span>All</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Or, Choose Silence",
      color: "text-slate-800",
      content: (
        <div>
          <p className="text-sm text-slate-600 mb-4">If a question doesn't fit your theology, bypass the sliders entirely:</p>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="flex-1 p-4 rounded-xl border-2 border-slate-300 bg-slate-50/50 text-sm flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🤷</span>
              <div className="text-left">
                <span className="font-bold text-slate-700 block">Apathetic Silence</span>
                <p className="text-xs text-slate-400 mt-0.5">The topic isn't relevant to you. Creates a soft, neutral stance.</p>
              </div>
            </div>
            <div className="flex-1 p-4 rounded-xl border-2 border-red-200 bg-red-50/50 text-sm flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">✋</span>
              <div className="text-left">
                <span className="font-bold text-red-700 block">Hostile Silence</span>
                <p className="text-xs text-slate-400 mt-0.5">You reject the question's premise. Penalizes denominations that affirm it.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <main className="flex-grow p-6 max-w-2xl mx-auto w-full flex flex-col">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mt-8">
        <h1 className="font-serif text-3xl font-bold mb-2 text-blue-900">How to navigate the quiz</h1>
        <p className="text-slate-500 text-sm mb-6">
          TheoCompass measures not just <em>what</em> you believe, but <em>how</em> you hold those beliefs.
        </p>

        {/* Stepper Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setTutorialStep(i)}
              className={`w-4 h-4 rounded-full transition-all ${
                i === tutorialStep ? "bg-blue-600 w-8" : "bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 mb-6 min-h-[180px] animate-fade-in-up" key={tutorialStep}>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {tutorialStep + 1}
            </span>
            <h3 className={`font-bold text-lg ${steps[tutorialStep].color}`}>{steps[tutorialStep].title}</h3>
          </div>
          {steps[tutorialStep].content}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
            disabled={tutorialStep === 0}
            className={`text-sm font-medium transition-colors ${
              tutorialStep === 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:text-blue-700"
            }`}
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-400 font-medium">
            Step {tutorialStep + 1} of {totalSteps}
          </span>
          <button
            type="button"
            onClick={() => setTutorialStep(Math.min(totalSteps - 1, tutorialStep + 1))}
            disabled={tutorialStep === totalSteps - 1}
            className={`text-sm font-medium transition-colors ${
              tutorialStep === totalSteps - 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:text-blue-700"
            }`}
          >
            Next →
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={onRetryLoad} className="ml-4 underline font-bold whitespace-nowrap">Try Again</button>
          </div>
        )}

        {/* Keyboard shortcut tip */}
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 flex items-center gap-2">
          <span className="text-indigo-400 text-base leading-none">⌨️</span>
          <span><span className="font-semibold">During the quiz:</span> Press <kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px] min-w-[18px] text-center">1</kbd>–<kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px] min-w-[18px] text-center">4</kbd> to select, <kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px]">Enter</kbd> to confirm, <kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px]">S</kbd> / <kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px]">H</kbd> for silence.</span>
        </div>

        <button
          onClick={onStartQuiz}
          disabled={isLoading || !!error || tutorialStep < totalSteps - 1}
          className={`w-full py-4 rounded-xl font-bold shadow-md transition-all text-lg ${
            isLoading || error ? "bg-slate-200 text-slate-500 cursor-not-allowed" :
            tutorialStep < totalSteps - 1 ? "bg-slate-200 text-slate-400 cursor-not-allowed" :
            "bg-blue-900 hover:bg-blue-800 text-white"
          }`}
        >
          {isLoading ? "Loading Database..." :
           error ? "Database Error" :
           tutorialStep < totalSteps - 1 ? "Review all 4 steps to continue →" :
           "Start Quiz"}
        </button>

        {skipConfirm ? (
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-xs text-slate-500">Skip tutorial?</span>
            <button
              type="button"
              onClick={() => { setSkipConfirm(false); onStartQuiz(); }}
              disabled={isLoading || !!error}
              className={`text-sm font-bold px-4 py-1.5 rounded-lg transition-colors ${
                isLoading || error ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}
            >
              Yes, skip
            </button>
            <button
              type="button"
              onClick={() => setSkipConfirm(false)}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSkipConfirm(true)}
            disabled={isLoading || !!error}
            className={`w-full text-center text-sm mt-3 transition-colors ${
              isLoading || error ? "text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-blue-600"
            }`}
          >
            Skip tutorial, start quiz
          </button>
        )}
      </div>
    </main>
  );
}
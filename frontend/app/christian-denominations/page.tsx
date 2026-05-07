"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import html2canvas from "html2canvas-pro";
import CompassChart from "./CompassChart"; 
import TheologicalLabelCloud from "./TheologicalLabelCloud"; 
import { useRouter } from 'next/navigation';
import { trackEvent } from '../../lib/gtag';

// --- TYPES ---
interface Answer {
  id: string;
  text: string;
  desc: string;
}

interface Question {
  id: string;
  category: string;
  question: string;
  answers: Answer[];
}

interface UserResponse {
  questionId: string;
  answerId: string;
  certainty: number;
  tolerance: number;
  isSilence: boolean;
  silenceType?: "apathetic" | "hostile";
}

// --- CHART CONFIGURATION ---
const AXIS_LABELS: Record<string, { left: string, right: string, desc: string }> = {
  theolconslib: { left: "Progressive", right: "Orthodox", desc: "View of scripture, tradition, and orthodoxy" },
  socialconslib: { left: "Liberal", right: "Conservative", desc: "Stance on ethics, gender, and society" },
  counterpromodern: { left: "Accommodating", right: "Counter-Cultural", desc: "Relationship to secular culture" },
  supernat: { left: "Naturalistic", right: "Supernatural", desc: "Expectation of miracles and spiritual forces" },
  cultsepeng: { left: "Engaged", right: "Separatist", desc: "Approach to worldly institutions and politics" },
  clericegal: { left: "Egalitarian", right: "Hierarchical", desc: "Church governance and ordination" },
  divhumagency: { left: "Human Agency", right: "Divine Sovereignty", desc: "The mechanics of salvation (Arminian/Calvinist)" },
  communindiv: { left: "Individualist", right: "Communitarian", desc: "Focus of faith and church life" },
  liturgspont: { left: "Spontaneous", right: "Liturgical", desc: "Style and structure of worship" },
  sacramfunct: { left: "Functional/Symbolic", right: "Sacramental", desc: "Efficacy of Baptism and Communion" },
  literalcrit: { left: "Critical", right: "Literal", desc: "Method of reading the Bible" },
  intellectexper: { left: "Experiential", right: "Intellectual", desc: "Primary mode of knowing God" }
};

// --- FINGERPRINT CATEGORY GROUPING ---
const FINGERPRINT_CATEGORIES = {
  Theology: {
    axes: ["theolconslib", "supernat", "literalcrit", "divhumagency"] as string[],
    label: "Theology",
    desc: "Core beliefs about God, scripture, and salvation",
  },
  Practice: {
    axes: ["liturgspont", "sacramfunct", "intellectexper"] as string[],
    label: "Practice",
    desc: "Worship style, sacraments, and spiritual life",
  },
  Posture: {
    axes: ["socialconslib", "counterpromodern", "cultsepeng", "clericegal", "communindiv"] as string[],
    label: "Posture",
    desc: "Social ethics, culture, and church governance",
  },
};

// Compute which axes are most extreme (closest to 0 or 100)
function getDistinctiveAxes(userCoords: Record<string, number>, count: number = 3): string[] {
  return Object.entries(userCoords)
    .filter(([key]) => AXIS_LABELS[key] !== undefined)
    .sort((a, b) => {
      const extremityA = Math.abs(a[1] - 50);
      const extremityB = Math.abs(b[1] - 50);
      return extremityB - extremityA;
    })
    .slice(0, count)
    .map(([key]) => key);
}

// Compute macro ring scores from user coords
function computeMacroRingScores(userCoords: Record<string, number>): { name: string; score: number; dominantPole: "left" | "right" }[] {
  const result: { name: string; score: number; dominantPole: "left" | "right" }[] = [];
  for (const [catName, catData] of Object.entries(FINGERPRINT_CATEGORIES)) {
    const scores = catData.axes
      .map((axis) => userCoords[axis])
      .filter((s) => s !== undefined && s !== null) as number[];
    if (scores.length === 0) continue;
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    result.push({ name: catData.label, score: Math.round(avg), dominantPole: avg <= 50 ? "right" : "left" });
  }
  return result;
}

// --- QUIZ CATEGORY LABELS ---
const QUIZ_CATEGORY_LABELS: Record<string, string> = {
  "GOD": "The Nature of God, Christ, & the Holy Spirit",
  "CHR": "The Church: Its Nature and Structure",
  "SCR": "Scripture and Authority",
  "SAL": "Humanity, Sin, and Salvation",
  "SAC": "Sacraments and Rites",
  "WOR": "Worship and Spiritual Life",
  "ESC": "The Last Things (Eschatology)",
  "ETH": "Christian Ethics and Life in the World",
  "MET": "Overarching Theological Approaches",
};

const QUIZ_CATEGORY_COLORS: Record<string, { text: string; dot: string; border: string; bg: string; badge: string }> = {
  GOD: { text: "text-indigo-600", dot: "bg-indigo-400", border: "border-l-indigo-400", bg: "bg-indigo-50/40", badge: "bg-indigo-100 text-indigo-700" },
  CHR: { text: "text-emerald-600", dot: "bg-emerald-400", border: "border-l-emerald-400", bg: "bg-emerald-50/40", badge: "bg-emerald-100 text-emerald-700" },
  SCR: { text: "text-sky-600", dot: "bg-sky-400", border: "border-l-sky-400", bg: "bg-sky-50/40", badge: "bg-sky-100 text-sky-700" },
  SAL: { text: "text-rose-600", dot: "bg-rose-400", border: "border-l-rose-400", bg: "bg-rose-50/40", badge: "bg-rose-100 text-rose-700" },
  SAC: { text: "text-violet-600", dot: "bg-violet-400", border: "border-l-violet-400", bg: "bg-violet-50/40", badge: "bg-violet-100 text-violet-700" },
  WOR: { text: "text-teal-600", dot: "bg-teal-400", border: "border-l-teal-400", bg: "bg-teal-50/40", badge: "bg-teal-100 text-teal-700" },
  ESC: { text: "text-amber-600", dot: "bg-amber-400", border: "border-l-amber-400", bg: "bg-amber-50/40", badge: "bg-amber-100 text-amber-700" },
  ETH: { text: "text-fuchsia-600", dot: "bg-fuchsia-400", border: "border-l-fuchsia-400", bg: "bg-fuchsia-50/40", badge: "bg-fuchsia-100 text-fuchsia-700" },
  MET: { text: "text-cyan-600", dot: "bg-cyan-400", border: "border-l-cyan-400", bg: "bg-cyan-50/40", badge: "bg-cyan-100 text-cyan-700" },
};
const QUIZ_CATEGORY_COLORS_DEFAULT = { text: "text-blue-600", dot: "bg-blue-400", border: "border-l-blue-400", bg: "bg-blue-50/40", badge: "bg-blue-100 text-blue-700" };

// Helper: extract 2-3 defining trait pole labels for a denomination
function getTraitTags(
  dimCoords: Record<string, number> | undefined,
  userCoords?: Record<string, number>,
  count: number = 2
): { label: string; color: string }[] {
  if (!dimCoords || Object.keys(dimCoords).length === 0) return [];
  const axes = Object.entries(dimCoords)
    .filter(([key]) => AXIS_LABELS[key])
    .sort((a, b) => {
      const extremityA = Math.abs(a[1] - 50);
      const extremityB = Math.abs(b[1] - 50);
      return extremityB - extremityA;
    })
    .slice(0, count);

  return axes.map(([key, score]) => {
    const labels = AXIS_LABELS[key];
    const pole = score > 50 ? labels.left : labels.right;
    const aligned = userCoords && userCoords[key] !== undefined
      ? Math.abs(score - userCoords[key]) <= 15
      : false;
    return {
      label: pole,
      color: aligned
        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
        : "bg-slate-100 text-slate-600 border-slate-200",
    };
  });
}

// Tier styling helper — 5 tiers from 0–100
function getTierStyle(percentage: number): {
  badge: string;
  bg: string;
  barColor: string;
  barGradient?: string;
  borderColor: string;
  textColor: string;
  hex: string;
} {
  if (percentage >= 90) return { badge: "Near Perfect Match",    bg: "bg-amber-50/60",   barColor: "", barGradient: "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500", borderColor: "border-amber-200", textColor: "text-amber-700", hex: "#f59e0b" };
  if (percentage >= 75) return { badge: "Strong Affinity",       bg: "bg-emerald-50/60", barColor: "bg-emerald-500", borderColor: "border-emerald-200", textColor: "text-emerald-700", hex: "#10b981" };
  if (percentage >= 60) return { badge: "Significant Overlap",   bg: "bg-sky-50/60",     barColor: "bg-sky-500",   borderColor: "border-sky-200",     textColor: "text-sky-700",     hex: "#0ea5e9" };
  if (percentage >= 40) return { badge: "Moderate Resonance",    bg: "bg-slate-50/60",   barColor: "bg-slate-400",  borderColor: "border-slate-200",  textColor: "text-slate-600",  hex: "#94a3b8" };
  return                     { badge: "Light Alignment",         bg: "bg-stone-50/60",   barColor: "bg-stone-400",  borderColor: "border-stone-200",  textColor: "text-stone-600",  hex: "#a8a29e" };
}

// --- COMPONENT: Expandable Denomination Card (Enhanced) ---
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

export function FamilyCard({ familyData, rank }: { familyData: any, rank: number }) {
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

export default function QuizPage() {
  // --- APP STATE ---
  const [currentView, setCurrentView] = useState<"mode-select" | "instructions" | "quiz" | "results">("mode-select");
  const [selectedMode, setSelectedMode] = useState<"quick" | "standard" | "deep" | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // --- DATA STATE ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- QUIZ STATE ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserResponse>>({}); 

  // --- LOCAL STORAGE & HYDRATION STATE ---
  const [isLoaded, setIsLoaded] = useState(false); // Prevents UI flicker/save before load

  // --- RESULTS STATE ---
  const [results, setResults] = useState<any[]>([]);
  const [familyMatches, setFamilyMatches] = useState<any[]>([]);
  const [userCoords, setUserCoords] = useState<Record<string, number>>({});
  const [showSpecific, setShowSpecific] = useState(false);
  const [showTopFamilyDenoms, setShowTopFamilyDenoms] = useState(false);
  const [userTolerance, setUserTolerance] = useState<number>(50);
  const [userLabels, setUserLabels] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [expandedAxis, setExpandedAxis] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // --- SCREENSHOT REF ---
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // --- ROUTER & MODALS ---
  const router = useRouter();
  const [showBackModal, setShowBackModal] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false); 
  const [devCode, setDevCode] = useState("");
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [quizAnimKey, setQuizAnimKey] = useState(0);

  // Instructions view state
  const [tutorialStep, setTutorialStep] = useState(0);
  const [demoInfoOpen, setDemoInfoOpen] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(false);

  // Current question temporary state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);
  const [isSilenceSelected, setIsSilenceSelected] = useState(false);
  const [silenceType, setSilenceType] = useState<"apathetic" | "hostile" | null>(null);
  const [certainty, setCertainty] = useState(2); 
  const [tolerance, setTolerance] = useState(2);

  // Enhanced UX state
  const [showShortcutHint, setShowShortcutHint] = useState(true);
  const [prevCategory, setPrevCategory] = useState<string | null>(null);
  const [showCategoryTransition, setShowCategoryTransition] = useState(false);
  const [transitionCategoryName, setTransitionCategoryName] = useState("");
  const [hasShownFirstInfoPulse, setHasShownFirstInfoPulse] = useState(false);
  const [transitionCategoryCode, setTransitionCategoryCode] = useState("");

  // --- DERIVED VARIABLES ---
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = totalQuestions > 0 ? ((currentQuestionIndex) / totalQuestions) * 100 : 0;
  const hasPrimaryKeyword = currentQuestion?.question.toLowerCase().includes("primary");

  // Helper arrays
  const certaintyLabels = ["Not Sure", "Leaning", "Pretty Sure", "Certain"];
  const certaintyTextColors = ["text-slate-400", "text-sky-500", "text-blue-600", "text-brand-dark"];
  const toleranceLabels = [
    "None Valid",
    "None Valid for Fellowship",
    "A Few Valid",
    "Most Valid",
    "All Valid"
  ];
  const toleranceDescriptions = [
    "No other option is valid; this is required for the Christian faith.",
    "No other option is valid for church fellowship, but some alternatives are still Christian.",
    "A few other options are valid, but require theological discernment.",
    "Most other options are valid, representing faithful in-house debate.",
    "Every other option is valid; this is purely personal preference."
  ];

  // --- LOCAL STORAGE LOGIC ---

  // 1. INITIAL LOAD (Runs once on mount)
  useEffect(() => {
    // Check for completed results first
    const savedResults = localStorage.getItem('theocompass_final_results');
    if (savedResults) {
      try {
        const data = JSON.parse(savedResults);
        setResults(data.matches);
        setFamilyMatches(data.familyMatches || []);
        setUserCoords(data.userDimCoords);
        setUserTolerance(data.userTolerance);
        setUserLabels(data.userLabels);
        setSelectedMode(data.selectedMode || null);
        setCurrentView("results");
        setIsLoaded(true);
        return; // Exit early, we are done!
      } catch (e) {
        console.error("Failed to load saved results", e);
      }
    }

    // If no results, check for quiz progress
    const savedData = localStorage.getItem('theocompass_quiz_progress');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setUserAnswers(data.userAnswers);
          setCurrentQuestionIndex(data.currentQuestionIndex || 0);
          setSelectedMode(data.selectedMode || null);
          setCurrentView("quiz");
        }
      } catch (e) {
        console.error("Failed to load saved progress", e);
      }
    }
    
    setIsLoaded(true);
  }, []); // Empty dependency array = runs ONCE on mount


  // 2. SAVE QUIZ PROGRESS (Runs when quiz data changes)
  useEffect(() => {
    if (isLoaded && currentView === "quiz" && questions.length > 0 && Object.keys(userAnswers).length > 0) {
      const dataToSave = {
        questions,
        userAnswers,
        currentQuestionIndex,
        selectedMode
      };
      localStorage.setItem('theocompass_quiz_progress', JSON.stringify(dataToSave));
      triggerSaveToast();
    }
  }, [isLoaded, currentView, questions, userAnswers, currentQuestionIndex, selectedMode]);

  // 4. SYNC UI STATE (Restores visual state for current question after refresh)
  useEffect(() => {
    if (currentView === "quiz" && currentQuestion && userAnswers[currentQuestion.id]) {
      restoreQuestionState(userAnswers[currentQuestion.id]);
    } else if (currentView === "quiz") {
      resetQuestionState();
    }
  }, [currentQuestionIndex, currentView, userAnswers]); // Dependencies matter here

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleConfirmBack = () => {
    router.push('/');
  };

  const handleConfirmDev = () => {
    handleDevAutoFill(); 
    setShowDevModal(false);
  };

  const handleConfirmRestart = () => {
    localStorage.removeItem('theocompass_quiz_progress');
    localStorage.removeItem('theocompass_final_results');
    setCurrentView("mode-select");
    resetQuestionState();
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setShowRestartModal(false);
  };

  const startInstructions = async (mode: "quick" | "standard" | "deep") => {
    setSelectedMode(mode);
    setCurrentView("instructions");
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
      const response = await fetch(`${apiUrl}/api/questions?mode=${mode}`);


      if (!response.ok) throw new Error("Failed to fetch questions");
      
      const data = await response.json();
      setQuestions(data);
    } catch (err) {
      console.error(err);
      setError("Could not load questions. Make sure your database API is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = () => setCurrentView("quiz");

  const handleStandardAnswerClick = (answerId: string) => {
    setSelectedAnswer(answerId);
    setIsSilenceSelected(false);
    setSilenceType(null);
    setCertainty(2); 
    setTolerance(2); 
  };

  // Auto-save toast
  const triggerSaveToast = () => {
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 1600);
  };

  const handleSilenceClick = (type: "apathetic" | "hostile") => {
    // Toggle off if same silence type clicked again
    if (isSilenceSelected && silenceType === type) {
      setIsSilenceSelected(false);
      setSilenceType(null);
      setSelectedAnswer(null);
      setCertainty(2);
      setTolerance(2);
      return;
    }
    setSelectedAnswer(`silence_${type}`); 
    setIsSilenceSelected(true);
    setSilenceType(type);
    
    if (type === "apathetic") {
      setCertainty(0); 
      setTolerance(2); 
    } else if (type === "hostile") {
      setCertainty(3); 
      setTolerance(1); 
    }
  };

  const toggleInfo = (e: React.MouseEvent, answerId: string) => {
    e.stopPropagation();
    setExpandedInfo(expandedInfo === answerId ? null : answerId);
    if (!hasShownFirstInfoPulse) {
      setHasShownFirstInfoPulse(true);
    }
  };

  const handleNext = async () => {
    const currentQ = questions[currentQuestionIndex];
    const newAnswers = { ...userAnswers };
    
    newAnswers[currentQ.id] = {
      questionId: currentQ.id,
      answerId: selectedAnswer || "skipped",
      certainty,
      tolerance,
      isSilence: isSilenceSelected,
      silenceType: silenceType || undefined
    };
    
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const nextQuestion = questions[nextIndex];
      const currentCategory = QUIZ_CATEGORY_LABELS[currentQuestion.category] || currentQuestion.category;
      const nextCategory = QUIZ_CATEGORY_LABELS[nextQuestion?.category] || nextQuestion?.category;
      
      // Show category transition if category changed (persistent until dismissed)
      if (nextQuestion && currentCategory !== nextCategory) {
        setTransitionCategoryName(nextCategory);
        setTransitionCategoryCode(nextQuestion.category);
        setShowCategoryTransition(true);
      }
      
      setCurrentQuestionIndex(nextIndex);
      setQuizAnimKey(prev => prev + 1);
      // UI sync handled by useEffect
    } else {
      // END OF QUIZ
      setIsCalculating(true);
      setCurrentView("results");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
      try {
        const res = await fetch(`${apiUrl}/api/calculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAnswers)
        });
        
        const data = await res.json();
        
        if (data.status === "success") {
          setResults(data.matches); 
          setFamilyMatches(data.familyMatches || []);
          setUserCoords(data.userDimCoords || {});
          setUserTolerance(data.userTolerance ?? 50);
          setUserLabels(data.userLabels || []);
            // ✅ CLEAN TRACKING
            trackEvent('quiz_complete', {
              quiz_mode: selectedMode || 'quick',
              questions_answered: Object.keys(newAnswers).length,
              top_match: data.matches[0]?.name || 'unknown',
              top_match_score: data.matches[0]?.matchPercentage || 0,
              user_tolerance: data.userTolerance ?? 50
            });
          

          // ---> ADD THIS NEW CODE HERE <---
          // Save final results to local storage so a refresh doesn't lose them
          localStorage.setItem("theocompass_final_results", JSON.stringify({
             matches: data.matches,
             familyMatches: data.familyMatches || [],
             userDimCoords: data.userDimCoords,
             userTolerance: data.userTolerance ?? 50,
             userLabels: data.userLabels,
             selectedMode: selectedMode,
             timestamp: new Date().getTime() // Optional versioning
          }));

          localStorage.removeItem('theocompass_quiz_progress');
          // ---> END OF NEW CODE <---

        } else {
          console.error("Calculation failed");
        }
      } catch (error) {
        console.error("API error:", error);
      } finally {
        setIsCalculating(false);
      }
    }
  };

  // Auto-scroll to top when question changes
  useEffect(() => {
    if (currentView === "quiz") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestionIndex, currentView]);

  const handleDevAutoFill = async () => {
    const dummyAnswers: Record<string, UserResponse> = {};
    questions.forEach(q => {
      const randomAnswerIndex = Math.floor(Math.random() * q.answers.length);
      const randomCertainty = Math.floor(Math.random() * 4);
      const randomTolerance = Math.floor(Math.random() * 5);
      
      dummyAnswers[q.id] = {
        questionId: q.id,
        answerId: q.answers[randomAnswerIndex].id,
        certainty: randomCertainty,
        tolerance: randomTolerance,
        isSilence: false
      };
    });

    setUserAnswers(dummyAnswers);
    setIsCalculating(true);
    setCurrentView('results');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

    try {
      const res = await fetch(`${apiUrl}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dummyAnswers)
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setResults(data.matches);
        setFamilyMatches(data.familyMatches || []);
        setUserCoords(data.userDimCoords);
        setUserTolerance(data.userTolerance ?? 50);
        setUserLabels(data.userLabels);
      } else {
        console.error("Calculation failed:", data.error);
      }
    } catch (error) {
      console.error("Failed to calculate:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  // NEW: Dynamic Dev Test directly from D1 Database
  // Notice this is a completely separate function now, NOT nested inside handleDevAutoFill!
  const handleDevDenomFill = async (denomId: string) => {
    setIsCalculating(true);
    setCurrentView('results');
    setShowDevModal(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

    try {
      const profileRes = await fetch(`${apiUrl}/api/dev/profile?id=${denomId}`);
      const profileData = await profileRes.json(); // Read the JSON FIRST

      // NOW check if the response failed
      if (!profileRes.ok) {
        alert(`API Error: ${profileData.error || profileRes.statusText}`);
        throw new Error(profileData.error || "Failed to fetch dev profile");
      }

      if (profileData.error) {
         console.error("API Error:", profileData.error);
         alert("Error finding Denomination: " + profileData.error);
         return;
      }

      // Filter answers to only include questions in the current quiz mode
      const finalAnswers: Record<string, UserResponse> = {};
      questions.forEach(q => {
        if (profileData[q.id]) {
          finalAnswers[q.id] = profileData[q.id];
        }
      });


      setUserAnswers(finalAnswers);

      const calcRes = await fetch(`${apiUrl}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalAnswers)
      });
      const data = await calcRes.json();
      
      if (data.status === 'success') {
        setResults(data.matches);
        setFamilyMatches(data.familyMatches || []);
        setUserCoords(data.userDimCoords);
        setUserTolerance(data.userTolerance ?? 50);
        setUserLabels(data.userLabels);
      } else {
        console.error("Calculation failed:", data.error);
      }
    } catch (error) {
      console.error("Failed to execute dev test:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setQuizAnimKey(prev => prev + 1);
      // UI sync handled by useEffect
    }
  };

  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setExpandedInfo(null);
    setIsSilenceSelected(false);
    setSilenceType(null);
    setCertainty(2);
    setTolerance(2);
  };

  const restoreQuestionState = (savedAns: UserResponse) => {
    setSelectedAnswer(savedAns.answerId);
    setCertainty(savedAns.certainty);
    setTolerance(savedAns.tolerance);
    setIsSilenceSelected(savedAns.isSilence);
    setSilenceType(savedAns.silenceType || null);
    setExpandedInfo(null);
  };

  const handleDownloadImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    
    try {
      exportRef.current.style.position = 'static';
      exportRef.current.style.left = 'auto';
      
      const canvas = await html2canvas(exportRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: "#0f172a", 
      });
      
      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "TheoCompass-Results.png";
      link.href = dataURL;
      link.click();

      // Inside your try block AFTER canvas success:
      trackEvent('download_results_image', {
        top_match: results[0]?.name || 'unknown',
        top_match_score: results[0]?.matchPercentage || 0,
        quiz_mode: selectedMode || 'quick'
      });

    } catch (err) {
      console.error("Failed to generate image", err);
    } finally {
      if (exportRef.current) {
        exportRef.current.style.position = 'absolute';
        exportRef.current.style.left = '-9999px';
      }
      setIsExporting(false);
    }
  };

  // --- RENDER HELPERS ---
  // Header component reused multiple times
  const PageHeader = ({ showRestart = false }: { showRestart?: boolean }) => (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div className="p-4 flex items-center justify-center relative border-b border-slate-100">
        <button 
          onClick={() => setShowBackModal(true)}
          className="absolute left-4 flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
        >
          <Image src="/logo.png" alt="TheoCompass Logo" width={40} height={40} className="object-contain" />
        </button>
        <button 
          onClick={() => setShowBackModal(true)}
          className="font-serif font-bold text-xl text-brand-primary tracking-tight cursor-pointer hover:opacity-80 transition"
        >
          TheoCompass
        </button>
        {showRestart && (
        <button 
          onClick={() => setShowRestartModal(true)}
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
          onClick={() => setShowBackModal(true)}
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

  // Modals component reused
  const Modals = () => (
    <>
      {/* Back Modal */}
      {showBackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Leave Quiz?</h3>
            <p className="text-slate-600 mb-6">Your progress is saved automatically. You can resume later.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowBackModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition">Cancel</button>
              <button onClick={handleConfirmBack} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition">Yes, go back</button>
            </div>
          </div>
        </div>
      )}
      
        {/* 2. Dev Modal (Updated with API Testing) */}
        {showDevModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Developer Tools</h3>
              <p className="text-slate-600 mb-4 text-sm">Select how you want to auto-complete the quiz for testing.</p>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleConfirmDev}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                >
                  Generate Random Answers
                </button>
                <button 
                  onClick={() => handleDevDenomFill('DENOM_032')} 
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition"
                >
                  Test: Perfect Catholic (DENOM_032)
                </button>
                <button 
                  onClick={() => {
                    const customId = prompt("Enter a Denomination ID (e.g., DENOM_001):", "DENOM_001");
                    if (customId) handleDevDenomFill(customId.trim());
                  }} 
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-md transition"
                >
                  Test: Custom Denomination ID
                </button>
                <button 
                  onClick={() => setShowDevModal(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition mt-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}


      {/* Restart Modal */}
      {showRestartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Restart Quiz?</h3>
            <p className="text-slate-600 mb-6">This will delete your saved progress and start from the beginning.</p>
            {/* SECRET CODE INPUT */}
            <div className="mb-4 border-t pt-4 border-slate-100">
              <input 
                  type="password" 
                  autoComplete="new-password" 
                  data-form-type="other"
                  placeholder="Enter code..." 
                  value={devCode} 
                  onChange={(e) => setDevCode(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2 py-1 text-slate-400 focus:outline-none focus:border-slate-400"
              />
              
              {/* IF CORRECT CODE, SHOW DEV BUTTON */}
              {devCode === "mod" && (
                <button 
                  onClick={() => {
                    setShowRestartModal(false);
                    setShowDevModal(true); // Open the dev confirmation modal
                  }}
                  className="w-full mt-2 bg-purple-100 text-purple-700 text-xs font-bold py-1.5 rounded hover:bg-purple-200 transition"
                >
                  🚀 Unlock Dev Tools
                </button>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowRestartModal(false);
                  setDevCode(""); // Reset code on close
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmRestart}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // 1. Prevent Next.js hydration mismatch by confirming the client has mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 3. Memoize the shuffle so it doesn't re-run when the user selects an answer
  const shuffledAnswers = useMemo(() => {
    if (!currentQuestion || !currentQuestion.answers) return [];
    
    // Create a shallow copy to avoid mutating the original data
    const shuffled = [...currentQuestion.answers];
    
    // Fisher-Yates algorithm for an academically unbiased shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }, [currentQuestion?.id]); // Only re-shuffles when the question ID changes

  // 3. Add optional chaining and an empty array fallback so .map() doesn't break
  const displayAnswers = isMounted && currentQuestion 
    ? shuffledAnswers 
    : (currentQuestion?.answers || []);

  // KEYBOARD SHORTCUTS (quiz view only)
  useEffect(() => {
    if (currentView !== "quiz") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const numKey = parseInt(e.key);
      if (numKey >= 1 && numKey <= displayAnswers.length) {
        e.preventDefault();
        handleStandardAnswerClick(displayAnswers[numKey - 1].id);
        return;
      }
      
      if (e.key === "Enter" && (selectedAnswer || isSilenceSelected)) {
        e.preventDefault();
        handleNext();
        return;
      }

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleSilenceClick("apathetic");
        return;
      }
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        handleSilenceClick("hostile");
        return;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentView, displayAnswers, selectedAnswer, isSilenceSelected]);


  // ==========================================
  // VIEW 1: MODE SELECT
  // ==========================================
  if (currentView === "mode-select") {
    // Check for saved sessions
    const savedData = typeof window !== 'undefined' ? localStorage.getItem('theocompass_quiz_progress') : null;
    let savedMode: string | null = null;
    if (savedData && isMounted) {
      try {
        const parsed = JSON.parse(savedData);
        savedMode = parsed.selectedMode || null;
      } catch {}
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <PageHeader />

        <Modals />
        <main className="flex-grow flex flex-col items-center justify-center p-6 max-w-4xl mx-auto animate-fade-in-up">
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-center">Select Quiz Mode</h1>
          <p className="text-slate-600 mb-10 text-center max-w-xl">Choose how deep you want to go. Progress is saved automatically.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {/* Quick Mode */}
            <button 
              onClick={() => startInstructions("quick")} 
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
        </main>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: INSTRUCTIONS
  // ==========================================
  if (currentView === "instructions") {
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
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <PageHeader />
        <Modals />
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
                <button onClick={() => startInstructions(selectedMode!)} className="ml-4 underline font-bold whitespace-nowrap">Try Again</button>
              </div>
            )}

            {/* Keyboard shortcut tip */}
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 flex items-center gap-2">
              <span className="text-indigo-400 text-base leading-none">⌨️</span>
              <span><span className="font-semibold">During the quiz:</span> Press <kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px] min-w-[18px] text-center">1</kbd>–<kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px] min-w-[18px] text-center">4</kbd> to select, <kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px]">Enter</kbd> to confirm, <kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px]">S</kbd> / <kbd className="inline-block bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px]">H</kbd> for silence.</span>
            </div>

            <button 
              onClick={startQuiz} 
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
                  onClick={() => { setSkipConfirm(false); startQuiz(); }}
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
      </div>
    );
  }

  // ==========================================
  // VIEW 4: RESULTS DASHBOARD
  // ==========================================
if (currentView === 'results') {
  // Determine whether to show families or specific denominations
  const displayFamilies = selectedMode === "quick" && !showSpecific && familyMatches.length > 0;

  const topFamily = displayFamilies ? familyMatches?.[0] : null;
  const topDenom = results?.[0] ?? null;

  const topName = displayFamilies
    ? topFamily?.family ?? "Calculating..."
    : topDenom?.name ?? "Calculating...";

  const topScore = displayFamilies
    ? topFamily?.matchPercentage ?? 0
    : topDenom?.matchPercentage ?? 0;

  const topSubtitle = displayFamilies
    ? "Closest Theological Family"
    : "Closest Theological Alignment";

  const topDescription = displayFamilies
    ? topFamily?.description || "No description available for this family."
    : topDenom?.description || "No description available for this tradition.";

  const topMetaLabel = displayFamilies
    ? `Closest Individual Match: ${topFamily?.topDenomination?.name ?? "Unknown"}`
    : topDenom?.family ?? "Unknown Tradition";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 relative overflow-x-hidden">
      {/* ... hidden export card ... */}
        <div 
          ref={exportRef} 
          className="absolute w-[1000px] bg-slate-50 text-slate-900 overflow-hidden shadow-2xl ring-1 ring-slate-200 font-sans" 
          style={{ left: '-9999px', top: '0' }}
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-12 py-8 flex justify-between items-center border-b-4 border-blue-600/40">
            <div>
              <div className="text-4xl font-bold font-serif tracking-tight">TheoCompass Denomination Alignment Quiz v2.0 Public Alpha</div>
              <div className="text-blue-300 text-lg font-bold tracking-widest uppercase mt-2">Theological Alignment Report</div>
            </div>
            <div className="w-20 h-20 bg-white rounded-full flex-shrink-0 flex items-center justify-center shadow-lg border-2 border-slate-700 overflow-hidden">
               <Image src="/logo.png" alt="Logo" width={70} height={70} className="object-contain p-1.5" />
            </div>
          </div>

          {/* Top Match Hero */}
          <div className="relative bg-white text-center py-12 px-10 border-b border-slate-200 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white pointer-events-none"></div>
            <div className="relative z-10">
              <div className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-3">
                {displayFamilies ? "Closest Theological Family" : "Closest Theological Alignment"}
              </div>
              <h1 className="text-5xl font-bold font-serif text-slate-900 leading-tight mb-6">
                {results.length > 0 
                  ? (displayFamilies ? familyMatches[0].family : results[0].name) 
                  : "Calculating..."}
              </h1>
              <div className="inline-flex items-center gap-4 bg-slate-900 px-8 py-3 rounded-full shadow-md border border-slate-800">
                <span className="text-4xl font-bold text-white">
                  {results.length > 0 
                    ? (displayFamilies ? familyMatches[0].matchPercentage : results[0].matchPercentage) 
                    : 0}%
                </span>
                <span className="text-sm font-bold text-blue-300 uppercase tracking-widest">Match</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid: Top 5 + Bar Chart */}
          <div className="grid grid-cols-12 gap-6 p-8">
            
            {/* LEFT COLUMN: Top 5 List */}
            <div className="col-span-5 bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col">
              <div className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">Top 5 Traditions</div>
              <div className="space-y-4 flex-grow">
                {results.slice(0, 5).map((d: any, i: number) => (
                  <div key={d.id} className={`flex justify-between items-center p-4 rounded-xl transition-colors ${i === 0 ? 'bg-blue-50/50 border border-blue-100 shadow-sm' : 'bg-slate-50 border border-slate-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {i + 1}
                      </div>
                      <span className={`font-semibold text-sm ${i === 0 ? 'text-blue-950 font-serif text-base' : 'text-slate-700'}`}>{d.name}</span>
                    </div>
                    <span className={`font-bold text-sm ${i === 0 ? 'text-blue-700' : 'text-slate-500'}`}>{d.matchPercentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: 13-Axis Fingerprint Chart (Enhanced) */}
            <div className="col-span-7 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">Theological Fingerprint</div>
              <div className="flex flex-col gap-3">
                {Object.entries(FINGERPRINT_CATEGORIES).map(([catKey, catData]) => (
                  <div key={catKey} className="mb-2">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">{catData.label}</div>
                    {catData.axes.map((axis) => {
                      const labels = AXIS_LABELS[axis];
                      const score = userCoords[axis];
                      if (score === undefined || score === null) return null;
                      const isLeft = score > 50;
                      return (
                        <div key={axis} className="flex items-center gap-2 mb-1">
                          <div className="w-[95px] text-[9px] font-medium text-slate-500 uppercase tracking-wider text-right truncate">{labels.left}</div>
                          <div className="flex-grow h-2 bg-slate-100 rounded-full relative">
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 z-10"></div>
                            <div
                              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white shadow z-20 ${isLeft ? 'bg-blue-600' : 'bg-slate-700'}`}
                              style={{ left: `${100 - score}%` }}
                            />
                          </div>
                          <div className="w-[95px] text-[9px] font-medium text-slate-500 uppercase tracking-wider text-left truncate">{labels.right}</div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {/* Tolerance Axis */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Posture</div>
                    <div className="flex items-center gap-2">
                      <div className="w-[95px] text-[9px] font-bold text-amber-600 uppercase tracking-wider text-right truncate">Accepting</div>
                      <div className="flex-grow h-2.5 bg-slate-100 rounded-full relative">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 z-10"></div>
                        <div
                          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-500 border border-white shadow z-20"
                          style={{ left: `${100 - userTolerance}%` }}
                        />
                      </div>
                      <div className="w-[95px] text-[9px] font-bold text-amber-600 uppercase tracking-wider text-left truncate">Dogmatic</div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compass Chart Section */}
          <div className="h-full bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col">
            <CompassChart 
              userCoords={userCoords} 
              userTolerance={userTolerance} 
              isExport={true} 
              selectedMode={selectedMode}
              familyMatches={familyMatches}
              displayFamilies={displayFamilies}
            />
          </div>

          {/* Footer */}
          <div className="bg-slate-900 px-12 py-10 text-center border-t-4 border-slate-800">
            <p className="font-serif italic text-lg text-slate-300 mb-3">
              "He is before all things, and in him all things hold together." — Colossians 1:17
            </p>
            <div className="w-16 h-px bg-slate-700 mx-auto my-4"></div>
            <div className="text-sm font-medium text-slate-400 mb-1">Built for informed decision, not persuasion.</div>
            <div className="text-base text-slate-500 font-mono mt-2">
                theocompass.com • r/TheoCompass • © 2026 Oroq / TheoCompass Project
            </div>
          </div>
        </div>
        {/* --- END HIDDEN EXPORT CARD --- */}



        {/* --- PAGE HEADER --- */}

      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">

        {/* RESTART MODAL (For Results Page) */}
          {showRestartModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Retake Quiz?</h3>
                <p className="text-slate-600 mb-4">This will clear your current results and start a new session.</p>
                
                {/* Optional: You can keep the secret code input here too if you want, 
                    or remove it for the results page since the quiz is already done. */}
                
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowRestartModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmRestart}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                  >
                    Restart
                  </button>
                </div>
              </div>
            </div>
          )}
        
        {/* ROW 1: Logo and Title (Centered) */}
        <div className="p-4 flex items-center justify-center relative border-b border-slate-100">
          
          {/* Logo (Left) - Opens Modal */}
          <button 
            onClick={() => setShowBackModal(true)}
            className="absolute left-4 flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
          >
            <Image 
              src="/logo.png" 
              alt="TheoCompass Logo" 
              width={40} 
              height={40} 
              className="object-contain" 
            />
          </button>

          {/* Title (Center) - Opens Modal */}
          <button 
            onClick={() => setShowBackModal(true)}
            className="font-serif font-bold text-xl text-brand-primary tracking-tight cursor-pointer hover:opacity-80 transition"
          >
            TheoCompass
          </button>
          
        </div>

        {/* ROW 2: Back Button Banner */}
        <div className="px-4 py-2 bg-white">
          <button 
            onClick={() => setShowBackModal(true)}
            className="flex items-center text-sm text-slate-600 hover:text-brand-primary transition font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Main Page
          </button>
        </div>
        
      </header>

              {/* --- MODAL: Confirm Back / Home --- */}
        {showBackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Leave Quiz?</h3>
              <p className="text-slate-600 mb-6">Are you sure you want to go back? Your current progress might be lost.</p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowBackModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmBack}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition"
                >
                  Yes, go back
                </button>
              </div>
            </div>
          </div>
        )}


        <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col">
          {isCalculating ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-6">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-800 rounded-full animate-spin"></div>
              <h2 className="text-xl font-serif font-bold text-slate-700 animate-pulse">Calculating Alignment...</h2>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <div className="text-center mb-10">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Your Results
                </span>
                <h1 className="font-serif text-3xl md:text-5xl font-bold mt-4 mb-4 text-slate-900">
                  Your Theological Matches
                </h1>
                <p className="text-slate-600 max-w-xl mx-auto">
                  Based on your stances, certainty, and tolerance, here are the traditions that most closely align with your framework.
                </p>
              </div>

              {/* NEW: Specific Denominations Toggle & Disclaimer */}
              {selectedMode === 'quick' && (
                <div className="mb-8 bg-blue-50/50 border border-blue-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-blue-900 text-lg">Viewing {showSpecific ? 'Specific Denominations' : 'Denomination Families'}</h4>
                      <p className="text-sm text-blue-700 mt-1 max-w-md">
                        {showSpecific 
                          ? "Showing granular matches based on your 30 answers." 
                          : "Quick Mode groups results into broad theological families for accuracy."}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSpecific(!showSpecific)}
                      className="bg-white border-2 border-blue-600 text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm whitespace-nowrap"
                    >
                      {showSpecific ? '← Back to Families' : 'Show Specific Traditions'}
                    </button>
                  </div>
                  
                  {/* Disclaimer renders only when specific view is toggled ON */}
                  {showSpecific && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-amber-200 text-sm text-slate-700 shadow-sm flex gap-3">
                      <span className="text-amber-500 text-xl leading-none">⚠️</span>
                      <div>
                        <span className="font-bold text-amber-700">Disclaimer: </span> 
                        Because Quick Mode only asks 30 questions, it lacks the data to definitively distinguish between highly granular traditions. These specific matches carry a higher margin of error. We highly recommend taking the Standard or Deep Dive quiz for exact alignment.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* HERO / TOP RESULT */}
              {(displayFamilies ? familyMatches.length > 0 : results.length > 0) && (() => {
                const topPct = displayFamilies ? (topFamily?.matchPercentage ?? 0) : (topDenom?.matchPercentage ?? 0);
                const heroTier = getTierStyle(topPct);
                const isTopScore95 = topPct >= 95;
                return (
                <div className={`bg-white rounded-2xl border-2 shadow-xl overflow-hidden mb-8 relative ${heroTier.borderColor} ${isTopScore95 ? 'ring-2 ring-amber-300/50 ring-offset-4 ring-offset-slate-50' : ''}`}>
                  <div className={`absolute top-0 right-0 font-bold px-4 py-1 rounded-bl-lg text-sm shadow-sm text-white`}
                    style={{ background: `linear-gradient(135deg, ${heroTier.hex}, ${heroTier.hex}CC)` }}
                  >
                    #1 Match
                  </div>

                  <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {topSubtitle}
                      </div>
                      <h2 className="font-serif text-2xl md:text-4xl font-bold" style={{ color: heroTier.hex }}>
                        {topName}
                      </h2>
                      <div className="mt-2 text-sm text-slate-500 font-medium">
                        {topMetaLabel}
                      </div>
                    </div>

                    <div className={`flex flex-col items-center justify-center rounded-full w-32 h-32 border-4 shrink-0 shadow-inner ${heroTier.bg} ${heroTier.borderColor}`}>
                      <span className={`text-3xl font-bold ${heroTier.textColor} ${isTopScore95 ? 'animate-pulse' : ''}`}>{topScore}%</span>
                      <span className={`text-xs uppercase font-bold tracking-widest mt-1 ${heroTier.textColor.replace('text-', 'text-').replace('700', '500').replace('600', '400').replace('500', '400')}`}>
                        Match
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 md:p-8">
                    <p className="text-slate-700 text-base md:text-lg leading-relaxed font-medium">
                      {topDescription}
                    </p>

                    {displayFamilies && topFamily?.topDenomination && (() => {
                      const topDenomPct = topFamily.topDenomination.matchPercentage ?? 0;
                      const denomTier = getTierStyle(topDenomPct);
                      return (
                      <div className="mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
                        {/* Top denomination (always visible) */}
                        <div className="p-4 border-b border-slate-100">
                          <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">
                            Best specific denomination inside this family
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className={`font-semibold text-slate-800`}>
                                {topFamily.topDenomination.name}
                              </div>
                              <div className="text-sm text-slate-500">
                                {topFamily.family}
                              </div>
                            </div>
                            <div className={`font-bold ${denomTier.textColor}`}>
                              {topFamily.topDenomination.matchPercentage}%
                            </div>
                          </div>
                          {/* Visual progress bar */}
                          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${denomTier.barGradient || denomTier.barColor}`}
                              style={{ width: `${Math.min(topDenomPct, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Expandable: all denominations in this family */}
                        {topFamily.allDenominations && topFamily.allDenominations.length > 1 && (
                          <>
                            <div
                              className="px-4 py-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/60 transition-colors text-left"
                              onClick={() => setShowTopFamilyDenoms(!showTopFamilyDenoms)}
                            >
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Show the top 5 Denominations in Family
                              </span>
                              <div className={`text-slate-400 transform transition-transform duration-300 ${showTopFamilyDenoms ? 'rotate-180' : ''}`}>
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                              </div>
                            </div>
                            {showTopFamilyDenoms && (
                              <div className="px-4 pb-4 pt-1 bg-slate-50/80 border-t border-slate-100">
                                <div className="flex flex-col gap-1.5">
                                  {topFamily.allDenominations.slice(0, 5).map((denom: any) => {
                                    const rowTier = getTierStyle(denom.matchPercentage ?? 0);
                                    return (
                                    <div key={denom.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100">
                                      <span className="text-sm font-medium text-slate-700">{denom.name}</span>
                                      <span className={`text-sm font-bold ${rowTier.textColor}`}>{denom.matchPercentage}%</span>
                                    </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      );
                    })()}
                  </div>
                </div>
                );
              })()}

              {/* TIER LEGEND */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Match Tier Legend
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { range: "90–100%", badge: "Near Perfect Match", bg: "bg-amber-50/60", borderColor: "border-amber-200", barColor: "bg-amber-400", barGradient: "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500", hex: "#f59e0b" },
                    { range: "75–89%",  badge: "Strong Affinity",    bg: "bg-emerald-50/60", borderColor: "border-emerald-200", barColor: "bg-emerald-500", hex: "#10b981" },
                    { range: "60–74%",  badge: "Significant Overlap", bg: "bg-sky-50/60",    borderColor: "border-sky-200",     barColor: "bg-sky-500",    hex: "#0ea5e9" },
                    { range: "40–59%",  badge: "Moderate Resonance",  bg: "bg-slate-50/60",  borderColor: "border-slate-200",  barColor: "bg-slate-400",  hex: "#94a3b8" },
                    { range: "0–39%",   badge: "Light Alignment",     bg: "bg-stone-50/60",  borderColor: "border-stone-200",  barColor: "bg-stone-400",  hex: "#a8a29e" },
                  ].map(t => (
                    <div key={t.badge} className={`flex items-center gap-2 p-2 rounded-lg ${t.bg} ${t.borderColor} border`}>
                      <div className={`w-3 h-3 rounded-full shrink-0 ${t.barGradient || t.barColor}`} />
                      <div className="min-w-0">
                        <div className={`text-[10px] font-bold leading-tight truncate`}>
                          {t.badge}
                        </div>
                        <div className="text-[9px] text-slate-400 leading-tight">{t.range}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RUNNER UPS */}
              <h3 className="font-bold text-slate-800 mb-4 text-lg border-b pb-2">
                {displayFamilies ? 'Runner-Up Families' : 'Runner-Up Traditions'}
              </h3>
              <div className="flex flex-col gap-2 mb-12">
                {displayFamilies ? (
                  familyMatches.slice(1).map((fam: any, index: number) => (
                    <FamilyCard key={fam.family} familyData={fam} rank={index + 2} />
                  ))
                ) : (
                  results.slice(1).map((denom: any, index: number) => (
                    <DenominationCard key={denom.id} denom={denom} rank={index + 2} userCoords={userCoords} />
                  ))
                )}
              </div>

              {/* THEOLOGICAL FINGERPRINT (13-AXIS CHART — OVERHAULED) */}
              <div className="mt-12 mb-8">
                <h3 className="font-serif text-2xl font-bold text-slate-800 mb-2">Your Theological Fingerprint</h3>
                <p className="text-slate-600 mb-6 text-sm">
                  Your positions on 13 bipolar dimensions of Christian theology, grouped by category.
                  Click any axis or toggle compare to see how you line up with your top match.
                </p>

                {/* === SUMMARY MACRO RING === */}
                {Object.keys(userCoords).length > 0 && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
                    <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
                      {computeMacroRingScores(userCoords).map((macro) => {
                        const intensity = Math.abs(macro.score - 50) / 50;
                        const arcDeg = intensity * 180;
                        const rotate = macro.dominantPole === "left" ? 0 : -arcDeg;
                        const color = macro.name === "Theology"
                          ? (macro.dominantPole === "left" ? "#2563eb" : "#1e40af")
                          : macro.name === "Practice"
                          ? (macro.dominantPole === "left" ? "#7c3aed" : "#5b21b6")
                          : (macro.dominantPole === "left" ? "#059669" : "#047857");
                        return (
                          <div key={macro.name} className="flex flex-col items-center gap-1.5">
                            <div className="relative w-20 h-10 overflow-hidden">
                              <svg viewBox="0 0 80 40" className="w-full h-full">
                                <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                <circle
                                  cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="8"
                                  strokeDasharray={`${Math.PI * 32}`}
                                  strokeDashoffset={`${Math.PI * 32 * (1 - intensity)}`}
                                  transform="rotate(-90 40 40)"
                                  style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-slate-700">{macro.score}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{macro.name}</span>
                            <span className="text-[9px] text-slate-400">{macro.dominantPole === "left" ? "Left-leaning" : "Right-leaning"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* === COMPARISON TOGGLE + DISTINCTIVE VIEWS === */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <button
                    onClick={() => setShowCompare(!showCompare)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      showCompare
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-700"
                    }`}
                  >
                    {showCompare ? "Hide Comparison" : `Compare with ${results[0]?.name ?? "Top Match"}`}
                  </button>

                  {(() => {
                    const distinctive = getDistinctiveAxes(userCoords, 3);
                    if (distinctive.length === 0) return null;
                    return (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-medium">Distinctive Views:</span>
                        {distinctive.map((axis) => {
                          const labels = AXIS_LABELS[axis];
                          const score = userCoords[axis];
                          const pole = score <= 50 ? labels.right : labels.left;
                          return (
                            <span
                              key={axis}
                              className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold border border-purple-200 animate-pulse"
                            >
                              {pole}
                            </span>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* === CATEGORIZED ACCORDION FINGERPRINT === */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {Object.entries(FINGERPRINT_CATEGORIES).map(([catKey, catData]) => {
                    const isCollapsed = collapsedCategories[catKey] ?? false;
                    return (
                      <div key={catKey} className="border-b border-slate-100 last:border-b-0">
                        {/* Category Header */}
                        <button
                          type="button"
                          className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                          onClick={() =>
                            setCollapsedCategories((prev) => ({
                              ...prev,
                              [catKey]: !isCollapsed,
                            }))
                          }
                        >
                          <div>
                            <span className="font-bold text-slate-800 text-sm">{catData.label}</span>
                            <span className="text-xs text-slate-400 ml-2">{catData.desc}</span>
                          </div>
                          <svg
                            className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Category Body */}
                        {!isCollapsed && (
                          <div className="px-5 pb-4 pt-1 bg-slate-50/50">
                            {catData.axes.map((axis) => {
                              const labels = AXIS_LABELS[axis];
                              const score = userCoords[axis];
                              if (score === undefined || score === null) return null;

                              const isLeft = score > 50;
                              const intensity = Math.abs(score - 50) / 50;
                              const dotPercent = 100 - score;
                              const poleLabel = isLeft ? labels.left : labels.right;
                              const isDistinctive = getDistinctiveAxes(userCoords, 3).includes(axis);
                              const isZoomed = expandedAxis === axis;

                              // Comparison data (top match)
                              const topDenomData = results[0];
                              const compareScore = topDenomData?.dimCoords?.[axis];
                              const hasCompare = showCompare && compareScore !== undefined;

                              return (
                                <div key={axis} className="mb-3 last:mb-0">
                                  <button
                                    type="button"
                                    className="w-full text-left"
                                    onClick={() => setExpandedAxis(isZoomed ? null : axis)}
                                  >
                                    {/* Pole Labels */}
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1 px-1">
                                      <span className={isLeft ? "text-blue-700" : ""}>{labels.left}</span>
                                      <span className={!isLeft ? "text-blue-700" : ""}>{labels.right}</span>
                                    </div>

                                    {/* Gradient Track + Lollipop Dot */}
                                    <div className="relative h-6 flex items-center">
                                      {/* Track */}
                                      <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                                        <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-slate-400 via-slate-200 to-blue-500 relative">
                                          {/* Center tick */}
                                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-400 z-10" />
                                        </div>
                                      </div>

                                      {/* User Lollipop Dot */}
                                      <div
                                        className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow z-20 transition-all ${
                                          isDistinctive
                                            ? "bg-purple-500 ring-2 ring-purple-300 ring-offset-1 animate-pulse"
                                            : "bg-slate-800"
                                        }`}
                                        style={{ left: `${dotPercent}%` }}
                                      />

                                      {/* Comparison Diamond (Top Match) */}
                                      {hasCompare && (
                                        <div
                                          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                                          style={{ left: `${100 - compareScore}%` }}
                                          title={topDenomData.name}
                                        >
                                          <div className="w-2.5 h-2.5 bg-amber-500 border border-white rotate-45 shadow-sm" />
                                        </div>
                                      )}

                                      {/* Gap Indicator (when both present) */}
                                      {hasCompare && (
                                        <div
                                          className="absolute top-1/2 h-0.5 bg-red-400/60 z-10 rounded"
                                          style={{
                                            left: `${Math.min(dotPercent, 100 - compareScore)}%`,
                                            width: `${Math.abs(dotPercent - (100 - compareScore))}%`,
                                          }}
                                        />
                                      )}
                                    </div>

                                    {/* Score + Pole on Hover */}
                                    <div className="flex justify-end mt-0.5">
                                      <span className="text-[10px] font-mono text-slate-400">
                                        {score}/100 • {poleLabel}
                                      </span>
                                    </div>
                                  </button>

                                  {/* Zoom Card */}
                                  {isZoomed && (
                                    <div className="mt-2 p-4 bg-white rounded-lg border border-slate-200 shadow-inner text-sm">
                                      <p className="text-slate-700 font-medium mb-1">{labels.desc}</p>
                                      <p className="text-slate-500 text-xs">
                                        Your position (<strong>{score}/100</strong>) leans toward{" "}
                                        <strong>{poleLabel}</strong>.
                                        {Math.abs(score - 50) >= 40
                                          ? " This is a strongly held conviction."
                                          : Math.abs(score - 50) >= 20
                                          ? " This is a moderate lean."
                                          : " This is a balanced / near-neutral position."}
                                      </p>
                                      {hasCompare && (
                                        <p className="text-slate-500 text-xs mt-1">
                                          Your top match (<strong>{topDenomData.name}</strong>) scores{" "}
                                          <strong>{compareScore}/100</strong> on this axis —{" "}
                                          <span
                                            className={
                                              Math.abs(score - compareScore) <= 10
                                                ? "text-emerald-600 font-medium"
                                                : "text-amber-600 font-medium"
                                            }
                                          >
                                            {Math.abs(score - compareScore) <= 10
                                              ? "well aligned"
                                              : `${Math.abs(score - compareScore)}pt difference`}
                                          </span>
                                          .
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Tolerance Axis (always visible) */}
                  <div className="px-5 py-4 border-t border-slate-200 bg-white">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1 px-1">
                      <span className={userTolerance >= 50 ? "text-amber-600" : ""}>Accepting / Open</span>
                      <span className={userTolerance <= 50 ? "text-amber-600" : ""}>Dogmatic / Strict</span>
                    </div>
                    <div className="relative h-6 flex items-center">
                      <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                        <div className="w-full h-2 rounded-full bg-gradient-to-r from-amber-300 via-slate-200 to-amber-500 relative">
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-400 z-10" />
                        </div>
                      </div>
                      <div
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow z-20"
                        style={{ left: `${100 - userTolerance}%` }}
                      />
                    </div>
                    <div className="flex justify-end mt-0.5">
                      <span className="text-[10px] font-mono text-slate-400">
                        {userTolerance}/100 • Overall Dogmatism
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2D COMPASS CHART */}
              <div className="mb-16">
                <h3 className="font-serif text-2xl font-bold text-slate-800 mb-2">Tradition Compass</h3>
                <p className="text-slate-600 mb-4 text-sm">
                  See where you land among major Christian traditions on the socio-theological map.
                </p>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <CompassChart 
                    userCoords={userCoords} 
                    userTolerance={userTolerance} 
                  />
                </div>
              </div>

              {/* THEOLOGICAL LABEL CLOUD */}
              <div className="mb-16">
                <h3 className="font-serif text-2xl font-bold text-slate-800 mb-2">Your Theological Labels</h3>
                <p className="text-slate-600 mb-4 text-sm">
                  Key descriptors that emerge from your belief patterns, sized by conviction strength.
                </p>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <TheologicalLabelCloud userLabels={userLabels} />
                </div>
              </div>

              {/* NEXT STEPS & SHARE FOOTER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 mb-8">
                
                {/* Save / Share Card */}
                <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-8 rounded-2xl text-white shadow-xl text-center flex flex-col justify-center items-center">
                  <h4 className="font-serif font-bold text-2xl mb-2 text-blue-100">Save Your Results</h4>
                  <p className="text-sm text-blue-200 mb-6 opacity-80">
                    Download a clean summary image of your top matches and compass to share on social media.
                  </p>
                  <div className="flex flex-col gap-3 w-full sm:w-auto">
                    <button 
                      onClick={handleDownloadImage} 
                      disabled={isExporting}
                      className={`bg-white text-blue-900 font-bold py-3 px-8 rounded-full shadow-lg transition-transform flex items-center justify-center gap-2 ${isExporting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {isExporting ? "Generating PNG..." : "Download Image"}
                    </button>
                    <a href="https://www.reddit.com/r/TheoCompass/submit/?type=IMAGE" target="_blank" rel="noreferrer" className="text-blue-200 font-medium text-sm hover:text-white underline decoration-blue-500/50 underline-offset-4 transition-colors">
                      Post on r/TheoCompass
                    </a>
                  </div>
                </div>

                {/* Support Card */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col justify-center items-center">
                  <h4 className="font-bold text-slate-800 text-lg mb-2">Deep Dive Visualizations</h4>
                  <p className="text-sm text-slate-500 mb-6">
                    Coming Soon: <span className="font-medium text-slate-700">Historical/Creedal Timeline</span> & <span className="font-medium text-slate-700">Creedal Alignment Score.</span>
                  </p>
                  <div className="w-full h-px bg-slate-100 mb-6"></div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2">Support TheoCompass</h4>
                  <p className="text-sm text-slate-500 mb-6 max-w-sm">
                    Help me expand the database to 230+ denominations and build the full v2.0 experience.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <a href="https://ko-fi.com/oroq" target="_blank" rel="noreferrer" className="bg-[#FF5E5B] hover:bg-[#E55350] text-white py-2 px-6 rounded-full font-bold shadow transition-colors flex items-center gap-2">
                      Support on Ko-Fi
                    </a>
                    <button 
                      onClick={() => setShowRestartModal(true)} 
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-6 rounded-full font-bold transition-colors"
                    >
                      Retake Quiz
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
        
        {/* GLOBAL FOOTER */}
        <footer className="w-full bg-slate-900 text-slate-300 py-10 px-6 text-center mt-auto">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <p className="font-serif italic text-lg mb-6 text-slate-400">
              "He is before all things, and in him all things hold together." — Colossians 1:17
            </p>
            <div className="flex gap-6 mb-8 text-sm">
              <a href="https://theocompass.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">TheoCompass.com</a>
              <a href="https://www.reddit.com/r/TheoCompass" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">r/TheoCompass</a>
              <a href="https://ko-fi.com/oroq" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Support on Ko-fi</a>
              <a href="mailto:theocompass.project@gmail.com" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-xs text-slate-500 mb-2">Built for informed decision, not persuasion.</p>
            <p className="text-xs text-slate-500">© 2026 Oroq / TheoCompass Project</p>
          </div>
        </footer>
      </div>
    );
  }




  // ==========================================
  // VIEW 3: THE ACTUAL QUIZ
  // ==========================================
  if (!currentQuestion) return <div className="p-10 text-center">Error: No question data found.</div>;

return (
  <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
    {/* --- STICKY QUIZ HEADER WITH BUILT-IN PROGRESS BAR --- */}
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div className="p-4 flex items-center justify-center relative border-b border-slate-100">
        <button 
          onClick={() => setShowBackModal(true)}
          className="absolute left-4 flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
        >
          <Image src="/logo.png" alt="TheoCompass Logo" width={40} height={40} className="object-contain" />
        </button>
        <button 
          onClick={() => setShowBackModal(true)}
          className="font-serif font-bold text-xl text-brand-primary tracking-tight cursor-pointer hover:opacity-80 transition"
        >
          TheoCompass
        </button>
        <button 
          onClick={() => setShowRestartModal(true)}
          title="Restart quiz"
          className="absolute right-4 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all group"
        >
          <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="sm:hidden ml-1 text-xs underline">Restart</span>
        </button>
      </div>
      <div className="px-4 py-2 bg-white border-b border-slate-100">
        <button 
          onClick={() => setShowBackModal(true)}
          className="flex items-center text-sm text-slate-600 hover:text-brand-primary transition font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Main Page
        </button>
      </div>
      {/* Progress bar pinned to bottom of sticky header */}
      <div className="w-full bg-slate-200 h-3">
        <div 
          className="h-3 transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-700 rounded-r-full"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded-r-full"></div>
        </div>
      </div>
    </header>
    
      {/* --- ALL MODALS --- */}

      {/* 1. Back Modal */}
      {showBackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Leave Quiz?</h3>
            <p className="text-slate-600 mb-6">Your progress is saved automatically. You can resume later.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowBackModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition">Cancel</button>
              <button onClick={handleConfirmBack} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition">Yes, go back</button>
            </div>
          </div>
        </div>
      )}

        {/* 2. Dev Modal (Updated with API Testing) */}
        {showDevModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Developer Tools</h3>
              <p className="text-slate-600 mb-4 text-sm">Select how you want to auto-complete the quiz for testing.</p>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleConfirmDev}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                >
                  Generate Random Answers
                </button>
                <button 
                  onClick={() => handleDevDenomFill('DENOM_032')} 
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition"
                >
                  Test: Perfect Catholic (DENOM_032)
                </button>
                <button 
                  onClick={() => {
                    const customId = prompt("Enter a Denomination ID (e.g., DENOM_001):", "DENOM_001");
                    if (customId) handleDevDenomFill(customId.trim());
                  }} 
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-md transition"
                >
                  Test: Custom Denomination ID
                </button>
                <button 
                  onClick={() => setShowDevModal(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition mt-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}


      {/* 3. Restart Modal (With Secret Code) */}
      {showRestartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Restart Quiz?</h3>
            <p className="text-slate-600 mb-4">This will delete your saved progress.</p>
            
            {/* Secret Code Input */}
            <div className="mb-4 border-t pt-4 border-slate-100">
              <input 
                type="password" 
                placeholder="Enter code..." 
                value={devCode}
                onChange={(e) => setDevCode(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2 py-1 text-slate-400 focus:outline-none focus:border-slate-400"
              />
              
              {devCode === "mod" && (
                <button 
                  onClick={() => {
                    setShowRestartModal(false);
                    setShowDevModal(true); // This opens Modal #2 above
                    setDevCode("");
                  }}
                  className="w-full mt-2 bg-purple-100 text-purple-700 text-xs font-bold py-1.5 rounded hover:bg-purple-200 transition"
                >
                  🚀 Unlock Dev Tools
                </button>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowRestartModal(false);
                  setDevCode("");
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmRestart}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Auto-save Toast */}
        {showSaveToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg animate-scale-in-out flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Progress saved
            </div>
          </div>
        )}

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
                  onClick={() => setShowShortcutHint(false)}
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
                  onClick={() => setShowCategoryTransition(false)}
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
                      onClick={() => handleStandardAnswerClick(ans.id)}
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
                        onClick={(e) => toggleInfo(e, ans.id)}
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
                  onClick={() => handleSilenceClick("apathetic")}
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
                  onClick={() => handleSilenceClick("hostile")}
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
                    }`}>{certaintyLabels[certainty]}</span>
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
                      onChange={(e) => setCertainty(Number(e.target.value))} 
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
                        {toleranceLabels[tolerance]}
                      </span>
                    </div>
                    
                    <div className="h-5">
                      <span className="text-xs text-slate-500 italic transition-all duration-200">
                        {toleranceDescriptions[tolerance]}
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
                      onChange={(e) => setTolerance(Number(e.target.value))} 
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
              <button onClick={handleBack} className={`font-bold text-slate-500 hover:text-blue-700 transition-colors ${currentQuestionIndex === 0 ? "invisible" : ""}`}>← Back</button>
              
              {/* Certainty / Tolerance summary badges (only when answer selected) */}
              {(selectedAnswer || isSilenceSelected) && (
                <div className="flex items-center gap-2 text-[10px] font-semibold">
                  {selectedAnswer && !isSilenceSelected && (
                    <>
                      <span className="px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700">
                        {certaintyLabels[certainty]}
                      </span>
                      <span className={`px-2 py-1 rounded-md border ${
                        tolerance === 0 ? "bg-red-50 border-red-200 text-red-700" : 
                        tolerance === 1 ? "bg-orange-50 border-orange-200 text-orange-700" : 
                        tolerance === 2 ? "bg-yellow-50 border-yellow-200 text-yellow-700" : 
                        tolerance === 3 ? "bg-green-50 border-green-200 text-green-700" : 
                        "bg-emerald-50 border-emerald-200 text-emerald-700"
                      }`}>
                        {toleranceLabels[tolerance]}
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
                onClick={handleNext} 
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
    </div>
  );
}

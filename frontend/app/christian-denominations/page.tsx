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

// Tier styling helper
function getTierStyle(percentage: number): {
  badge: string;
  bg: string;
  barColor: string;
} {
  if (percentage >= 85) return { badge: "Strong Affinity", bg: "bg-emerald-50/60", barColor: "bg-emerald-500" };
  if (percentage >= 70) return { badge: "Significant Overlap", bg: "bg-amber-50/60", barColor: "bg-amber-400" };
  return { badge: "Moderate Resonance", bg: "bg-slate-50/60", barColor: "bg-slate-400" };
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

  const tierAccentColor =
    tier.badge === "Strong Affinity" ? "#10b981" :
    tier.badge === "Significant Overlap" ? "#f59e0b" :
    "#94a3b8";

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-3 overflow-hidden transition-all duration-200 hover:border-slate-300 hover:shadow-md border-l-4"
      style={{ borderLeftColor: tierAccentColor }}
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
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                tier.badge === "Strong Affinity"
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : tier.badge === "Significant Overlap"
                  ? "text-amber-700 bg-amber-50 border-amber-200"
                  : "text-slate-600 bg-slate-50 border-slate-200"
              }`}>
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

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-3 overflow-hidden transition-all duration-200 hover:border-slate-300 hover:shadow-md border-l-4 border-l-purple-400">
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
          <div className="font-bold text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
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
            {familyData.allDenominations.slice(0, 5).map((denom: any) => (
              <div key={denom.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100">
                 <span className="text-sm font-medium text-slate-700">{denom.name}</span>
                 <span className="text-sm font-bold text-blue-600">{denom.matchPercentage}%</span>
              </div>
            ))}
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

  // Current question temporary state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);
  const [isSilenceSelected, setIsSilenceSelected] = useState(false);
  const [silenceType, setSilenceType] = useState<"apathetic" | "hostile" | null>(null);
  const [certainty, setCertainty] = useState(2); 
  const [tolerance, setTolerance] = useState(2); 

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
    "None for Fellowship",
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
    if (isLoaded && currentView === "quiz" && questions.length > 0) {
      const dataToSave = {
        questions,
        userAnswers,
        currentQuestionIndex,
        selectedMode
      };
      localStorage.setItem('theocompass_quiz_progress', JSON.stringify(dataToSave));
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

  const handleSilenceClick = (type: "apathetic" | "hostile") => {
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
      setCurrentQuestionIndex(currentQuestionIndex + 1);
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
            className="absolute right-4 text-xs text-slate-400 hover:text-red-600 transition underline"
          >
            Restart
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

  // 2. Memoize the shuffle so it doesn't re-run when the user selects an answer
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


  // ==========================================
  // VIEW 1: MODE SELECT
  // ==========================================
  if (currentView === "mode-select") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <PageHeader />

        <Modals />
        <main className="flex-grow flex flex-col items-center justify-center p-6 max-w-4xl mx-auto">
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-center">Select Quiz Mode</h1>
          <p className="text-slate-600 mb-10 text-center max-w-xl">Choose how deep you want to go. Progress is saved automatically.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <button onClick={() => startInstructions("quick")} className="bg-white p-6 rounded-2xl border-2 border-blue-900 shadow-md hover:shadow-lg transition-all text-left group">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-2xl group-hover:text-blue-700 transition-colors">Quick</h2>
                <span className="bg-blue-100 text-blue-900 text-xs font-bold px-2 py-1 rounded">30 Qs</span>
              </div>
              <p className="text-slate-500 text-sm">A streamlined overview of the most defining Christian doctrines.</p>
            </button>
            <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 opacity-70 cursor-not-allowed text-left">
              <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-2xl text-slate-400">Standard</h2><span className="bg-slate-200 text-slate-500 text-xs font-bold px-2 py-1 rounded">70 Qs</span></div>
              <p className="text-slate-400 text-sm">The recommended TheoCompass experience.</p>
            </div>
            <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 opacity-70 cursor-not-allowed text-left">
              <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-2xl text-slate-400">Deep</h2><span className="bg-slate-200 text-slate-500 text-xs font-bold px-2 py-1 rounded">120 Qs</span></div>
              <p className="text-slate-400 text-sm">The ultimate theological audit.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: INSTRUCTIONS
  // ==========================================
  if (currentView === "instructions") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <PageHeader />
        <Modals />
       <main className="flex-grow p-6 max-w-2xl mx-auto w-full flex flex-col">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mt-8">
            <h1 className="font-serif text-3xl font-bold mb-6 text-blue-900">How to navigate the quiz</h1>
            <div className="space-y-6 text-slate-600 mb-8">
              <p>TheoCompass measures not just <em>what</em> you believe, but <em>how</em> you hold those beliefs. For each question:</p>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2">1. Select your Stance</h3>
                <p className="text-sm">Choose the answer that best represents your view. Use the <span className="inline-block w-5 h-5 bg-slate-200 text-center rounded-full text-xs font-serif italic mx-1">i</span> button if you need a detailed definition.</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h3 className="font-bold text-blue-700 mb-2">2. Set your Certainty</h3>
                <p className="text-sm">How confident are you in this specific belief? (Not Sure → Certain)</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h3 className="font-bold text-red-600 mb-2">3. Set Tolerance</h3>
                <p className="text-sm">
                  How exclusive is your stance? Are none of the other options valid, or are they all acceptable?
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2">4. Or, Choose Silence</h3>
                <p className="text-sm mb-2">If a question does not fit your theology, you can bypass the sliders entirely:</p>
                <ul className="text-sm space-y-2">
                  <li><span className="font-medium text-slate-700">Apathetic Silence:</span> The topic isn't relevant to you. This creates a soft, neutral stance (low certainty, medium tolerance).</li>
                  <li><span className="font-medium text-slate-700">Hostile Silence:</span> You fundamentally reject the question's premise. This creates a strong penalty against denominations that affirm it (high certainty, low tolerance).</li>
                </ul>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-center">
                {error} <br/>
                <button onClick={() => startInstructions(selectedMode!)} className="mt-2 underline font-bold">Try Again</button>
              </div>
            )}

            <button 
              onClick={startQuiz} 
              disabled={isLoading || !!error}
              className={`w-full py-4 rounded-xl font-bold shadow-md transition-all text-lg ${
                isLoading || error ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-blue-900 hover:bg-blue-800 text-white"
              }`}
            >
              {isLoading ? "Loading Database..." : error ? "Database Error" : "I understand, let's begin"}
            </button>
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
              {(displayFamilies ? familyMatches.length > 0 : results.length > 0) && (
                <div className="bg-white rounded-2xl border-2 border-blue-600 shadow-xl overflow-hidden mb-8 relative">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white font-bold px-4 py-1 rounded-bl-lg text-sm shadow-sm">
                    #1 Match
                  </div>

                  <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {topSubtitle}
                      </div>
                      <h2 className="font-serif text-2xl md:text-4xl font-bold text-blue-900">
                        {topName}
                      </h2>
                      <div className="mt-2 text-sm text-slate-500 font-medium">
                        {topMetaLabel}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-blue-50 rounded-full w-32 h-32 border-4 border-blue-100 shrink-0 shadow-inner">
                      <span className="text-3xl font-bold text-blue-700">{topScore}%</span>
                      <span className="text-xs text-blue-500 uppercase font-bold tracking-widest mt-1">
                        Match
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 md:p-8">
                    <p className="text-slate-700 text-base md:text-lg leading-relaxed font-medium">
                      {topDescription}
                    </p>

                    {displayFamilies && topFamily?.topDenomination && (
                      <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4">
                        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">
                          Best specific denomination inside this family
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="font-semibold text-slate-800">
                              {topFamily.topDenomination.name}
                            </div>
                            <div className="text-sm text-slate-500">
                              {topFamily.family}
                            </div>
                          </div>
                          <div className="font-bold text-blue-700">
                            {topFamily.topDenomination.matchPercentage}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
    <PageHeader showRestart={true} />
    
    
      {/* --- ALL MODALS DEFINED DIRECTLY BELOW HEADER --- */}

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

             {/* --- NEW PROGRESS BAR --- */}
        <div className="w-full bg-slate-200 h-1.5 z-10 sticky top-[73px]">
          <div 
            className="bg-blue-600 h-1.5 transition-all duration-300 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        {/* --- END PROGRESS BAR --- */}

        <main className="flex-grow w-full max-w-2xl mx-auto px-4 py-8 md:py-12 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {/* Category */}
              {QUIZ_CATEGORY_LABELS[currentQuestion.category] || currentQuestion.category}
            </div>
            
            {/* ---> NEW QUESTION COUNTER <--- */}
            <div className="text-xs font-bold text-slate-400">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
          </div>
          
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 mb-8 leading-snug">
            {currentQuestion.question}
          </h1>

        {/* ANSWERS */}
        <div className="flex flex-col gap-3 mb-6">
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
                  <span className={`font-medium pr-4 ${isSelected ? "text-blue-800" : "text-slate-700"}`}>
                    {ans.text}
                  </span>
                  <div 
                    onClick={(e) => toggleInfo(e, ans.id)}
                    className={`min-w-8 min-h-8 w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                      isInfoOpen ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    <span className="text-sm font-serif italic">i</span>
                  </div>
                </button>
                {isInfoOpen && (
                  <div className="mt-2 p-4 bg-white rounded-lg text-sm text-slate-600 border border-slate-200 shadow-inner">
                    <strong className="text-slate-800">Further Context:</strong> <br/>{ans.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* --- SILENCE OPTIONS --- */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <button 
            onClick={() => handleSilenceClick("apathetic")}
            className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all ${
              silenceType === "apathetic" ? "bg-slate-200 border-slate-400 text-slate-800 shadow-inner" : "bg-transparent border-slate-300 text-slate-500 hover:bg-slate-100"
            }`}
          >
            Apathetic Silence
            <span className="block text-xs font-normal opacity-70 mt-1">Not theologically relevant to me.</span>
          </button>

          <button 
            onClick={() => handleSilenceClick("hostile")}
            className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all ${
              silenceType === "hostile" ? "bg-red-50 border-red-300 text-red-800 shadow-inner" : "bg-transparent border-slate-300 text-slate-500 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
            }`}
          >
            Hostile Silence
            <span className="block text-xs font-normal opacity-70 mt-1">I reject this question's framing.</span>
          </button>
        </div>

        {/* --- CERTAINTY / TOLERANCE SLIDERS --- */}
        {selectedAnswer && !isSilenceSelected && (
          <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm mb-8 animate-fade-in-up">
            
            {/* Certainty Slider (Unchanged) */}
            <div className="mb-10">
              <p className="text-sm text-slate-500 italic mb-3">How confident are you in this particular stance?</p>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-800 font-bold">Certainty</span>
                <span className={`font-bold ${certaintyTextColors[certainty]}`}>{certaintyLabels[certainty]}</span>
              </div>
              <input 
                type="range" min="0" max="3" step="1" 
                value={certainty} 
                onChange={(e) => setCertainty(Number(e.target.value))} 
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
                <span>Not Sure</span><span>Leaning</span><span>Pretty Sure</span><span>Certain</span>
              </div>
            </div>
            
            {/* Exclusivity Slider */}
            <div>
              <p className="text-sm text-slate-500 italic mb-4">
                {hasPrimaryKeyword 
                  ? "How many of the other options are acceptable alternatives to your primary view?" 
                  : "How many of the other options listed do you consider valid?"}
              </p>
              
              <div className="mb-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-slate-800 text-sm font-bold">Valid Alternatives</span>
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-bold leading-tight ${
                      tolerance === 0 ? "text-red-600" : 
                      tolerance === 1 ? "text-orange-500" : 
                      tolerance === 2 ? "text-yellow-600" : 
                      tolerance === 3 ? "text-green-500" : "text-emerald-600"
                    }`}>
                      {toleranceLabels[tolerance]}
                    </span>
                  </div>
                </div>
                
                <div className="text-right h-8 sm:h-5">
                  <span className="text-xs text-slate-500 italic">
                    {toleranceDescriptions[tolerance]}
                  </span>
                </div>
              </div>

              {/* Slider Track */}
              <input 
                type="range" min="0" max="4" step="1" 
                value={tolerance} 
                onChange={(e) => setTolerance(Number(e.target.value))} 
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer relative z-10" 
              />
              
              {/* MATHEMATICALLY ALIGNED MINI-MARKERS */}
              <div className="relative w-full h-6 mt-2 text-xs text-slate-400">
                <span className="absolute left-[0%] -translate-x-[0%]">None</span>
                <span className="absolute left-[23%] -translate-x-[25%]">None for Fellowship</span>
                <span className="absolute left-[50%] -translate-x-[50%]">A Few</span>
                <span className="absolute left-[75%] -translate-x-[75%]">Most</span>
                <span className="absolute left-[100%] -translate-x-[100%]">All</span>
              </div>
            </div>
          </div>
        )}



        {/* NAV FOOTER */}
        <div className="mt-auto pt-4 pb-8 flex justify-between items-center border-t border-slate-200">
          <button onClick={handleBack} className={`font-bold text-slate-500 hover:text-blue-700 transition-colors ${currentQuestionIndex === 0 ? "invisible" : ""}`}>← Back</button>
          <button 
            onClick={handleNext} 
            disabled={!selectedAnswer && !isSilenceSelected} 
            className={`py-3 px-8 rounded-full font-bold text-lg transition-all ${(selectedAnswer || isSilenceSelected) ? "bg-slate-900 text-white hover:bg-black shadow-lg hover:-translate-y-1" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
          >
            {currentQuestionIndex === questions.length - 1 ? "See Results" : "Next →"}
          </button>
        </div>
      </main>
    </div>
  );
}

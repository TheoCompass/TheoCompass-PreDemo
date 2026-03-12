"use client";

import { useState } from "react";
import Link from "next/link";

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

// Track the user's choices
interface UserResponse {
  questionId: string;
  answerId: string;
  certainty: number;
  tolerance: number;
  isSilence: boolean;
  silenceType?: "apathetic" | "hostile";
}

export default function QuizPage() {
  // --- APP STATE ---
  const [currentView, setCurrentView] = useState<"mode-select" | "instructions" | "quiz">("mode-select");
  const [selectedMode, setSelectedMode] = useState<"quick" | "standard" | "deep" | null>(null);

  // --- DATA STATE ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- QUIZ STATE ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserResponse>>({}); // Stores all answers
  
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

  // Helper arrays for sliders
  const certaintyLabels = ["Not Sure", "Leaning", "Pretty Sure", "Certain"];
  const certaintyTextColors = ["text-slate-400", "text-sky-500", "text-blue-600", "text-brand-dark"];
  const toleranceLabels = ["Salvation Issue", "Opposed", "Discerning", "Charitable", "Accepting"];

  // --- HANDLERS ---
  const startInstructions = async (mode: "quick" | "standard" | "deep") => {
    setSelectedMode(mode);
    setCurrentView("instructions");
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://127.0.0.1:8787/api/questions?mode=${mode}`);
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
    setCertainty(2); // Default
    setTolerance(2); // Default
  };

  const handleSilenceClick = (type: "apathetic" | "hostile") => {
    setSelectedAnswer(`silence_${type}`); // Fake ID for state logic
    setIsSilenceSelected(true);
    setSilenceType(type);
    
    if (type === "apathetic") {
      setCertainty(0); // Not Sure
      setTolerance(2); // Discerning
    } else if (type === "hostile") {
      setCertainty(3); // Certain
      setTolerance(1); // Opposed
    }
  };

  const toggleInfo = (e: React.MouseEvent, answerId: string) => {
    e.stopPropagation();
    setExpandedInfo(expandedInfo === answerId ? null : answerId);
  };

  const handleNext = async () => {
    // 1. Save the current answer to our payload
    const response: UserResponse = {
      questionId: currentQuestion.id,
      answerId: selectedAnswer!,
      certainty,
      tolerance,
      isSilence: isSilenceSelected,
      silenceType: silenceType || undefined
    };

    const updatedAnswers = { ...userAnswers, [currentQuestion.id]: response };
    setUserAnswers(updatedAnswers);

    // 2. Move to next or submit
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      
      // Load previous answer if they are hitting "Next" after going "Back"
      const nextQId = questions[currentQuestionIndex + 1].id;
      if (updatedAnswers[nextQId]) {
        restoreQuestionState(updatedAnswers[nextQId]);
      } else {
        resetQuestionState();
      }
    } else {
      console.log("FINAL PAYLOAD TO SEND TO API:", updatedAnswers);
      alert("Quiz Complete! Check your console to see the JSON payload.");
      try {
        const res = await fetch("http://127.0.0.1:8787/api/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedAnswers)
        });
        const data = await res.json();
        console.log("SERVER RESPONSE:", data);
        alert(`Server received ${data.receivedCount} answers! Math engine is ready to be built.`);
      } catch (error) {
        console.error("Failed to calculate:", error);
      }

    }
  };

    const handleDevAutoFill = async () => {
    const dummyAnswers: Record<string, UserResponse> = {};
    
    // Loop through all questions and just grab the first answer
    questions.forEach((q) => {
      dummyAnswers[q.id] = {
        questionId: q.id,
        answerId: q.answers[0].id, 
        certainty: 2,
        tolerance: 2,
        isSilence: false
      };
    });

    setUserAnswers(dummyAnswers);
    setCurrentQuestionIndex(totalQuestions - 1); // Jump to the end

    console.log("DEV PAYLOAD:", dummyAnswers);
    
    try {
      const res = await fetch("http://127.0.0.1:8787/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dummyAnswers)
      });
      const data = await res.json();
      console.log("SERVER RESPONSE:", data);
      alert(`DEV TEST SUCCESS! DB fetched ${data.dataFetched?.denominationsCount} denominations.`);
    } catch (error) {
      console.error("Failed to calculate:", error);
    }
  };


  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevQId = questions[currentQuestionIndex - 1].id;
      restoreQuestionState(userAnswers[prevQId]);
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

  // ==========================================
  // VIEW 1 & 2: MODE SELECT & INSTRUCTIONS
  // ==========================================
  // ... [Keep your currentView === "mode-select" code exactly as it is]
  // ... [Keep your currentView === "instructions" code exactly as it is]
  if (currentView === "mode-select") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <header className="bg-white border-b border-slate-200 p-4 text-center shadow-sm">
          <Link href="/" className="font-serif font-bold text-blue-900 text-xl">TheoCompass</Link>
        </header>
        <main className="flex-grow flex flex-col items-center justify-center p-6 max-w-4xl mx-auto">
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-center">Select Quiz Mode</h1>
          <p className="text-slate-600 mb-10 text-center max-w-xl">Choose how deep you want to go into the theological landscape. The pre-demo version is currently limited to the Quick Match.</p>
          
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

  if (currentView === "instructions") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <header className="bg-white border-b border-slate-200 p-4 text-center shadow-sm">
          <span className="font-serif font-bold text-blue-900 text-xl">TheoCompass</span>
        </header>
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
                <h3 className="font-bold text-red-600 mb-2">3. Set your Tolerance</h3>
                <p className="text-sm">What is your posture toward other Christians who disagree with you? Is it a "Salvation Issue", or are you "Accepting"?</p>
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
  // VIEW 3: THE ACTUAL QUIZ
  // ==========================================
  if (!currentQuestion) return <div className="p-10 text-center">Error: No question data found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/" className="font-serif font-bold text-blue-900 text-lg">TheoCompass</Link>
            
            {/* DEV BUTTON START */}
            <button 
              onClick={handleDevAutoFill} 
              className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded border border-red-300 hover:bg-red-200"
            >
              🐛 DEV: Auto-Finish
            </button>
            {/* DEV BUTTON END */}

            <span className="text-sm font-bold text-slate-500 bg-slate-100 py-1 px-3 rounded-full">
              Q {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
        <div className="w-full h-1.5 bg-slate-100">
          <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-2xl mx-auto px-4 py-8 md:py-12 flex flex-col">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
          Category: {currentQuestion.category}
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 mb-8 leading-snug">
          {currentQuestion.question}
        </h1>

        {/* --- STANDARD ANSWERS --- */}
        <div className="flex flex-col gap-3 mb-6">
          {currentQuestion.answers.map((ans) => {
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
                  <span className={`font-medium pr-4 ${isSelected ? "text-blue-800" : "text-slate-700"}`}>{ans.text}</span>
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

        {/* --- CERTAINTY / TOLERANCE SLIDERS (Only show if a standard answer is picked) --- */}
        {selectedAnswer && !isSilenceSelected && (
          <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm mb-8 animate-fade-in-up">
            <div className="mb-10">
              <p className="text-sm text-slate-500 italic mb-3">How confident are you in this particular stance?</p>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-800 font-bold">Certainty</span>
                <span className={`font-bold ${certaintyTextColors[certainty]}`}>{certaintyLabels[certainty]}</span>
              </div>
              <input type="range" min="0" max="3" step="1" value={certainty} onChange={(e) => setCertainty(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              <div className="flex justify-between text-xs text-slate-400 mt-2 px-1"><span>Not Sure</span><span>Leaning</span><span>Pretty Sure</span><span>Certain</span></div>
            </div>
            <div>
              <p className="text-sm text-slate-500 italic mb-3">{hasPrimaryKeyword ? "What posture do you have toward Christians who disagree that your view should be primary?" : "What posture do you have toward Christians who disagree with you?"}</p>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-800 font-bold">Tolerance</span>
                {/* Add standard tailwind colors for tolerance based on value */}
                <span className={`font-bold ${
                  tolerance === 0 ? "text-red-600" : 
                  tolerance === 1 ? "text-orange-500" : 
                  tolerance === 2 ? "text-yellow-600" : 
                  tolerance === 3 ? "text-green-500" : "text-emerald-600"
                }`}>{toleranceLabels[tolerance]}</span>
              </div>
              <input type="range" min="0" max="4" step="1" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              <div className="flex justify-between text-xs text-slate-400 mt-2 px-1"><span>Issue</span><span>Opposed</span><span>Discern</span><span>Charity</span><span>Accept</span></div>
            </div>
          </div>
        )}

        {/* --- NAVIGATION FOOTER --- */}
        <div className="mt-auto pt-4 pb-8 flex justify-between items-center border-t border-slate-200">
          <button onClick={handleBack} className={`font-bold text-slate-500 hover:text-blue-700 transition-colors ${currentQuestionIndex === 0 ? "invisible" : ""}`}>← Back</button>
          <button onClick={handleNext} disabled={!selectedAnswer} className={`py-3 px-8 rounded-full font-bold text-lg transition-all ${selectedAnswer ? "bg-slate-900 text-white hover:bg-black shadow-lg hover:-translate-y-1" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>{currentQuestionIndex === totalQuestions - 1 ? "See Results" : "Next →"}</button>
        </div>
      </main>
    </div>
  );
}

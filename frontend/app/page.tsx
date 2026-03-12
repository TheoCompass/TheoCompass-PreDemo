import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-brand-light text-brand-dark">
      
      {/* 1. Header / Navigation */}
      <header className="w-full bg-brand-navy border-b border-gray-200 py-4 px-6 md:px-12 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="TheoCompass Logo" 
            width={40} 
            height={40} 
            className="rounded"
          />
          <span className="font-serif font-bold text-xl text-brand-primary tracking-tight">TheoCompass</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
          <Link href="#about" className="hover:text-brand-primary transition-colors">About the Project</Link>
          <a href="https://www.reddit.com/r/TheoCompass" target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary transition-colors">Community</a>
          <a href="https://ko-fi.com/oroq" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors">Support</a>
        </nav>
      </header>

      {/* 2. Hero Section (Focus on the Flagship Quiz) */}
      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-6 py-16 md:py-24 text-center">
        
        {/* Optional Banner Image could go here if you want to use banner.png */}
        <div className="mb-8 w-full max-w-3xl overflow-hidden rounded-xl shadow-lg border border-slate-200">
          <Image 
            src="/banner.png" 
            alt="TheoCompass Theological Landscape" 
            width={1200} 
            height={400} 
            className="w-full h-auto object-cover"
            priority
          />
        </div>

        <h1 className="font-serif text-4xl md:text-6xl font-black text-brand-primary mb-6 leading-tight">
          Find your theological alignment.
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          A nuanced quiz that maps your beliefs across 120 theological questions. We analyze not just what you believe, but your certainty and posture toward others.
        </p>
        
        <Link 
          href="/christian-denominations" 
          className="bg-brand-primary hover:bg-sky-800 text-white font-bold py-4 px-10 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 text-lg"
        >
          Take the Quiz (v2.0 Pre-Demo)
        </Link>
        <p className="mt-4 text-xs text-slate-400">Features 30 historical/major denominations.</p>
      </main>

      {/* 3. What is TheoCompass? (Platform Hub Section) */}
      <section id="about" className="w-full bg-slate-50 py-16 px-6 border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-brand-dark mb-4">More Than Just a Quiz</h2>
            <p className="text-slate-600 max-w-3xl mx-auto leading-relaxed text-left md:text-center">
              TheoCompass is a project designed to help you explore the vast and diverse world of Christian theology in a nuanced and insightful way. The goal is not to tell you what you are, but to provide a detailed map of your unique theological profile based on a transparent, data-driven scoring model.
            </p>
          </div>

          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Active Project */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-primary p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>
              <span className="bg-blue-100 text-brand-primary text-xs font-bold px-2 py-1 rounded w-max mb-4">Active Project</span>
              <h3 className="font-serif font-bold text-xl mb-2">Denomination Alignment</h3>
              <p className="text-slate-500 text-sm mb-6 flex-grow">Match your beliefs to over 230 different Christian denominations and movements across history.</p>
              <Link href="/christian-denominations" className="text-brand-primary font-bold text-sm hover:underline">
                Enter Module →
              </Link>
            </div>

            {/* Future Project 1 */}
            <div className="bg-slate-100 rounded-xl border border-slate-200 p-6 flex flex-col relative opacity-80">
              <span className="bg-slate-200 text-slate-500 text-xs font-bold px-2 py-1 rounded w-max mb-4">Coming Soon</span>
              <h3 className="font-serif font-bold text-xl mb-2 text-slate-700">Philosophical Compass</h3>
              <p className="text-slate-500 text-sm mb-6 flex-grow">Explore the philosophical '-isms' (Platonism, Existentialism, etc.) that form the bedrock of belief.</p>
              <span className="text-slate-400 font-bold text-sm cursor-not-allowed">Planned</span>
            </div>

            {/* Future Project 2 */}
            <div className="bg-slate-100 rounded-xl border border-slate-200 p-6 flex flex-col relative opacity-80">
              <span className="bg-slate-200 text-slate-500 text-xs font-bold px-2 py-1 rounded w-max mb-4">Coming Soon</span>
              <h3 className="font-serif font-bold text-xl mb-2 text-slate-700">Heresy Identifier</h3>
              <p className="text-slate-500 text-sm mb-6 flex-grow">An educational challenge testing your knowledge of historic Christian creeds against famous deviations.</p>
              <span className="text-slate-400 font-bold text-sm cursor-not-allowed">Planned</span>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="w-full bg-brand-dark text-slate-300 py-10 px-6 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <p className="font-serif italic text-lg mb-6 text-slate-400">
            "He is before all things, and in him all things hold together." — Colossians 1:17
          </p>
          <div className="flex gap-6 mb-8 text-sm">
            <a href="https://www.reddit.com/r/TheoCompass" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">r/TheoCompass</a>
            <a href="https://ko-fi.com/oroq" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors">Support on Ko-fi</a>
            <a href="mailto:theocompass.project@gmail.com" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-xs text-slate-500 mb-2">Built for informed decision, not persuasion.</p>
          <p className="text-xs text-slate-500">© 2026 Oroq / TheoCompass Project</p>
        </div>
      </footer>
    </div>
  );
}

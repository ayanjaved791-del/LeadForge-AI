import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Search, 
  Cpu, 
  Target, 
  Send, 
  CheckCircle2, 
  FileSpreadsheet, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Layers, 
  ChevronRight,
  Database
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLaunchDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onLaunchDemo }) => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Top Bar Navigation (3-Zone Contract) */}
      <header className="sticky top-0 z-40 h-16 border-b border-neutral-800 bg-black/90 backdrop-blur-md px-6 md:px-12 flex items-center justify-between">
        {/* Zone 1: Single element brand wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-black font-bold">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <span className="text-base font-bold text-white tracking-tight font-heading">
            LeadForge AI
          </span>
        </div>

        {/* Zone 2: Clean unboxed nav links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-neutral-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#features" className="hover:text-white transition-colors">Core Features</a>
          <a href="#preview" className="hover:text-white transition-colors">Product Preview</a>
          <a href="#use-cases" className="hover:text-white transition-colors">Use Cases</a>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth('login')}
            className="text-xs font-medium text-neutral-400 hover:text-white px-3 py-1.5 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onLaunchDemo}
            className="flex items-center gap-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 px-3.5 py-1.5 rounded-lg transition-all shadow-xs"
          >
            <span>Try Demo</span>
            <ArrowRight className="h-3 w-3 text-black" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 md:px-12 max-w-6xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/60 text-xs text-neutral-400 mb-8 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
          <span>Production-grade B2B Lead Intelligence & Prospecting CRM</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] text-balance font-heading">
          Find better B2B leads. Score opportunities with AI.
        </h1>

        <p className="mt-6 text-base md:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed text-balance">
          Research prospects, identify digital bottlenecks, score opportunities, and track your verified pipeline from one intelligent workspace.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={onLaunchDemo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all shadow-md active:scale-95"
          >
            <span>Try Demo Workspace</span>
            <ArrowRight className="h-4 w-4 text-black" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-6 py-3 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white font-medium text-sm transition-colors"
          >
            Explore Features
          </a>
        </div>

        {/* Hero Product Preview Image Container */}
        <div id="preview" className="mt-14 relative rounded-xl border border-neutral-800 bg-neutral-900/40 p-2 shadow-2xl backdrop-blur-sm overflow-hidden">
          <div className="rounded-lg overflow-hidden border border-neutral-850 bg-black">
            <img 
              src="/src/assets/images/leadforge_platform_preview_1791391647517.jpg"
              alt="LeadForge AI Platform Interface Preview"
              className="w-full h-auto object-cover max-h-[560px] opacity-90 hover:opacity-100 transition-opacity grayscale contrast-110"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 md:px-12 border-t border-neutral-900 bg-neutral-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Methodology</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1 font-heading">
              How LeadForge AI Works
            </h2>
            <p className="text-xs text-neutral-400 mt-2">
              From discovering unoptimized businesses to generating deep AI opportunity analysis in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 relative">
              <span className="font-mono text-xs text-white font-bold block mb-2">01. Step One</span>
              <h3 className="text-base font-semibold text-white mb-2 font-heading">Find Leads</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Filter prospective companies by industry, location, and web presence or import your custom prospect lists via CSV.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 relative">
              <span className="font-mono text-xs text-white font-bold block mb-2">02. Step Two</span>
              <h3 className="text-base font-semibold text-white mb-2 font-heading">AI Research</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Gemini analyzes company public signals, identifying digital bottlenecks, mobile UX flaws, and untapped conversion channels.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 relative">
              <span className="font-mono text-xs text-white font-bold block mb-2">03. Step Three</span>
              <h3 className="text-base font-semibold text-white mb-2 font-heading">Score Opportunities</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Review multi-dimensional AI Opportunity Scores across business potential, digital readiness, and service fit.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 relative">
              <span className="font-mono text-xs text-white font-bold block mb-2">04. Step Four</span>
              <h3 className="text-base font-semibold text-white mb-2 font-heading">Track & Export</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Manage your CRM pipeline stages and export verified leads with calibrated AI scores to CSV anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 px-6 md:px-12 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Capabilities</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1 font-heading">
              Engineered for Modern Sales Teams & Agencies
            </h2>
            <p className="text-xs text-neutral-400 mt-2">
              Everything required to scale outbound prospecting without losing authentic personalization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black mb-3 font-bold">
                <Search className="h-4 w-4 text-black" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5 font-heading">Lead Discovery & Input</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Filter and discover B2B prospects across global territories and vertical industries with granular criteria.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black mb-3 font-bold">
                <Cpu className="h-4 w-4 text-black" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5 font-heading">AI Company Research</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Deep digital assessment diagnosing specific operational bottlenecks and high-ROI modernization angles.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black mb-3 font-bold">
                <Target className="h-4 w-4 text-black" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5 font-heading">AI Opportunity Scoring</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                0–100 calibrated score breakdown distinguishing low-potential tire-kickers from high-probability hot prospects.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black mb-3 font-bold">
                <Sparkles className="h-4 w-4 text-black" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5 font-heading">AI Bottleneck Diagnostics</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Automated detection of conversion blockers, booking gaps, and modernization opportunities with Gemini AI.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black mb-3 font-bold">
                <Layers className="h-4 w-4 text-black" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5 font-heading">Visual CRM Pipeline</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Lightweight pipeline tracker moving opportunities from New through Contacted, Replied, Interested, and Converted.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black mb-3 font-bold">
                <FileSpreadsheet className="h-4 w-4 text-black" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5 font-heading">CSV Import & Export</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Bring your own scraped or purchased prospect sheets with a 4-step validation preview and batch AI scoring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 px-6 md:px-12 border-t border-neutral-900 bg-neutral-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Audience</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1 font-heading">
              Who Uses LeadForge AI
            </h2>
            <p className="text-xs text-neutral-400 mt-2">
              Designed for operators who sell high-ticket services and value targeted research over mass spam.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50">
              <h3 className="text-base font-semibold text-white mb-2 font-heading">Web & Software Agencies</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                Analyze local clinics, law firms, and real estate brokerages to find sites lacking responsive UX or online booking. Pitch modern web solutions with specific proof.
              </p>
              <div className="text-[11px] font-mono text-neutral-300">
                Primary pitch: Web Development · Custom Software · AI Chatbots
              </div>
            </div>

            <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50">
              <h3 className="text-base font-semibold text-white mb-2 font-heading">Solo Freelancers & Developers</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                Stop wasting hours drafting cold emails manually. Let LeadForge generate sharp, personalized observations so you can reach 20 qualified prospects in 30 minutes.
              </p>
              <div className="text-[11px] font-mono text-neutral-300">
                Primary pitch: Automation · Custom CRM · Mobile Optimization
              </div>
            </div>

            <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50">
              <h3 className="text-base font-semibold text-white mb-2 font-heading">B2B Sales Development Reps</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                Import target lists, organize your prospect pipeline, and review AI Opportunity Scores before picking up the phone or reaching out.
              </p>
              <div className="text-[11px] font-mono text-neutral-300">
                Primary pitch: Pipeline Acceleration · Tailored Value Propositions
              </div>
            </div>

            <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50">
              <h3 className="text-base font-semibold text-white mb-2 font-heading">Growth & Marketing Consultants</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                Identify service-fit gaps in local businesses, structure audit-driven prospect lists, and maintain clean tracking across your sales pipeline.
              </p>
              <div className="text-[11px] font-mono text-neutral-300">
                Primary pitch: SEO Domination · Inbound Lead Capture Funnels
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conversion CTA */}
      <section className="py-20 px-6 md:px-12 border-t border-neutral-900 text-center">
        <div className="max-w-3xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-900/60 p-10 backdrop-blur-sm">
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-heading">
            Ready to upgrade your B2B prospecting?
          </h2>
          <p className="mt-3 text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Test the live platform or connect your Google account to start managing your own leads in Cloud Firestore.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onLaunchDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all shadow-md active:scale-95"
            >
              <span>Launch Live Workspace</span>
              <ArrowRight className="h-4 w-4 text-black" />
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-6 py-3 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm transition-colors"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-900 py-8 px-6 md:px-12 text-center text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-neutral-400">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span className="font-semibold text-white font-heading">LeadForge AI</span>
            <span>· B2B Lead Intelligence & Prospecting</span>
          </div>
          <div>
            Built with React, TypeScript, Cloud Firestore & Gemini API.
          </div>
        </div>
      </footer>
    </div>
  );
};

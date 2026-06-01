import { useNavigate } from 'react-router-dom'
import {
  Activity, Mic, Brain, Zap, FileText, CheckCircle, ArrowRight,
  ChevronRight, Upload, Stethoscope
} from 'lucide-react'

function Navbar() {
  const navigate = useNavigate()
  return (
    <nav
      className="sticky top-0 z-50 border-b border-[rgba(51,65,85,0.4)]"
      style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[rgba(20,184,166,0.12)] border border-[rgba(20,184,166,0.25)]
                          flex items-center justify-center">
            <Activity size={16} className="text-[#14b8a6]" />
          </div>
          <span className="font-bold text-[#f8fafc] text-base" style={{ fontFamily: 'Figtree, sans-serif' }}>
            ClinicalDoc <span className="text-[#14b8a6]">AI</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14b8a6] hover:bg-[#0d9488]
                     text-white text-sm font-semibold transition-all duration-200 cursor-pointer
                     active:scale-[0.98]"
        >
          Open Workspace <ArrowRight size={14} />
        </button>
      </div>
    </nav>
  )
}

function HeroSection() {
  const navigate = useNavigate()
  return (
    <section className="relative pt-24 pb-20 px-6 text-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(20,184,166,0.12) 0%, transparent 70%)'
        }}
      />

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-elevated
                      text-xs text-[#14b8a6] border border-[rgba(20,184,166,0.25)] mb-8 animate-fade-up">
        <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]" style={{ animation: 'pulse 2s infinite' }} />
        AI-powered · SOAP · ICD-10 · Visit Summary
      </div>

      <h1
        className="animate-fade-up text-5xl sm:text-6xl font-bold text-[#f8fafc] max-w-3xl mx-auto leading-tight"
        style={{ fontFamily: 'Figtree, sans-serif', animationDelay: '60ms' }}
      >
        AI writes the notes.<br />
        <span
          style={{
            background: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 50%, #67e8f9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          You focus on the patient.
        </span>
      </h1>

      <p
        className="animate-fade-up mt-6 text-lg text-[#94a3b8] max-w-2xl mx-auto leading-relaxed"
        style={{ animationDelay: '120ms' }}
      >
        Clinical documentation in seconds, not hours. Upload audio, record live, or paste a transcript — ClinicalDoc AI generates
        structured SOAP notes, ICD-10 billing codes, and visit summaries with confidence scoring in 10–15 seconds.
      </p>

      <div
        className="animate-fade-up flex flex-col sm:flex-row gap-4 justify-center mt-10"
        style={{ animationDelay: '180ms' }}
      >
        <button
          onClick={() => navigate('/app')}
          className="group flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl
                     bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold text-base
                     transition-all duration-200 cursor-pointer shadow-[0_0_24px_rgba(20,184,166,0.3)]
                     hover:shadow-[0_0_32px_rgba(20,184,166,0.45)] active:scale-[0.98]"
        >
          Try it free
          <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform duration-200" />
        </button>
        <a
          href="#how-it-works"
          className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl
                     glass hover:bg-[rgba(255,255,255,0.05)] text-[#94a3b8] hover:text-[#f8fafc]
                     font-medium text-base transition-all duration-200 cursor-pointer"
        >
          See how it works
        </a>
      </div>

      <p className="animate-fade-up mt-8 text-xs text-[#475569]" style={{ animationDelay: '240ms' }}>
        72,000 ICD-10 codes · Semantic vector search · Powered by OpenAI & Whisper
      </p>
    </section>
  )
}

const FEATURES = [
  {
    icon: Mic,
    title: '3 Input Modes',
    description: 'Upload audio files (WAV/MP3/FLAC), record live from your mic, or paste a raw transcript — whichever fits your workflow.',
    color: 'rgba(20,184,166,0.1)',
    iconColor: '#14b8a6',
    borderColor: 'rgba(20,184,166,0.2)',
  },
  {
    icon: Brain,
    title: 'AI Confidence Scoring',
    description: 'Every SOAP section carries a green/amber/red confidence badge so you immediately know what needs a second look.',
    color: 'rgba(147,51,234,0.08)',
    iconColor: '#a78bfa',
    borderColor: 'rgba(139,92,246,0.2)',
  },
  {
    icon: Zap,
    title: 'ICD-10 in Seconds',
    description: 'Semantic vector search across 72,000 ICD-10 codes surfaces the right billing codes with clinical rationale — no manual lookup.',
    color: 'rgba(245,158,11,0.08)',
    iconColor: '#fbbf24',
    borderColor: 'rgba(245,158,11,0.2)',
  },
  {
    icon: FileText,
    title: 'Visit Summary & Follow-ups',
    description: 'A patient-ready visit summary plus a structured follow-up action list with timeframes, ready to copy into your EHR.',
    color: 'rgba(34,197,94,0.08)',
    iconColor: '#4ade80',
    borderColor: 'rgba(34,197,94,0.2)',
  },
]

function FeaturesSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-[#f8fafc]" style={{ fontFamily: 'Figtree, sans-serif' }}>
            Everything a clinician needs
          </h2>
          <p className="mt-3 text-[#64748b] text-base">
            Built around the real documentation workflow — not a generic AI wrapper.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(({ icon: Icon, title, description, color, iconColor, borderColor }) => (
            <div
              key={title}
              className="glass rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01]
                         hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                   style={{ background: color, border: `1px solid ${borderColor}` }}>
                <Icon size={20} style={{ color: iconColor }} />
              </div>
              <h3 className="font-semibold text-[#f8fafc] text-base mb-2"
                  style={{ fontFamily: 'Figtree, sans-serif' }}>{title}</h3>
              <p className="text-sm text-[#64748b] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  {
    step: '01',
    icon: Upload,
    title: 'Provide the consultation',
    description: 'Upload a recorded audio file, use your browser mic to record live, or paste the raw doctor–patient transcript.',
  },
  {
    step: '02',
    icon: Brain,
    title: 'AI processes the visit',
    description: 'OpenAI Whisper transcribes audio, then our pipeline extracts SOAP sections, searches 72,000 ICD-10 codes, and generates a visit summary — all in parallel.',
  },
  {
    step: '03',
    icon: CheckCircle,
    title: 'Review and finalize',
    description: 'Structured notes appear with confidence scores. Approve ICD codes, edit SOAP sections, and copy the output directly into your EHR.',
  },
]

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 px-6"
      style={{ background: 'rgba(15,23,42,0.4)' }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-[#f8fafc]" style={{ fontFamily: 'Figtree, sans-serif' }}>
            How it works
          </h2>
          <p className="mt-3 text-[#64748b] text-base">Three steps from conversation to structured notes.</p>
        </div>

        <div className="relative flex flex-col gap-0">
          <div
            className="absolute left-6 top-8 bottom-8 w-px bg-[rgba(20,184,166,0.15)]
                       hidden sm:block"
            aria-hidden="true"
          />

          {STEPS.map(({ step, icon: Icon, title, description }, idx) => (
            <div
              key={step}
              className="relative flex gap-6 pb-10 last:pb-0 animate-fade-up"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="shrink-0 w-12 h-12 rounded-full glass-elevated border border-[rgba(20,184,166,0.3)]
                              flex flex-col items-center justify-center z-10">
                <Icon size={18} className="text-[#14b8a6]" />
              </div>

              <div className="pt-2 pb-2">
                <span className="text-[10px] font-bold text-[#14b8a6] tracking-widest uppercase">{step}</span>
                <h3 className="font-semibold text-[#f8fafc] text-base mt-1 mb-1.5"
                    style={{ fontFamily: 'Figtree, sans-serif' }}>{title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTABanner() {
  const navigate = useNavigate()
  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto glass rounded-3xl p-10 border border-[rgba(20,184,166,0.3)]">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-[#f8fafc] mb-4" style={{ fontFamily: 'Figtree, sans-serif' }}>
            Ready to reclaim your time?
          </h2>
          <p className="text-[#94a3b8] mb-8 leading-relaxed">
            ClinicalDoc AI is free to try. Process your first consultation in seconds and see the difference.
          </p>
          <button
            onClick={() => navigate('/app')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl
                       bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold text-base
                       transition-all duration-200 cursor-pointer shadow-[0_0_24px_rgba(20,184,166,0.3)]
                       hover:shadow-[0_0_32px_rgba(20,184,166,0.45)] active:scale-[0.98]"
          >
            Start your first encounter
            <Stethoscope size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[rgba(51,65,85,0.4)] py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[rgba(20,184,166,0.12)] border border-[rgba(20,184,166,0.25)]
                          flex items-center justify-center">
            <Activity size={14} className="text-[#14b8a6]" />
          </div>
          <span className="font-bold text-[#f8fafc] text-sm" style={{ fontFamily: 'Figtree, sans-serif' }}>
            ClinicalDoc <span className="text-[#14b8a6]">AI</span>
          </span>
        </div>

        <p className="text-xs text-[#334155] text-center">
          Documentation Copilot · For demonstration purposes only.<br className="sm:hidden" />
          Not a certified medical device. Always verify clinical output.
        </p>

        <p className="text-xs text-[#334155]">
          &copy; {new Date().getFullYear()} ClinicalDoc AI
        </p>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#020617' }}>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTABanner />
      </main>
      <Footer />
    </div>
  )
}

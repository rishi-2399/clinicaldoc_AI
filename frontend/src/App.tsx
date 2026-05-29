import { useState, useCallback } from 'react'
import { Activity, AlertCircle, Loader2 } from 'lucide-react'
import AudioUpload from './components/AudioUpload'
import TranscriptView from './components/TranscriptView'
import SOAPNoteEditor from './components/SOAPNoteEditor'
import ICDSuggestions from './components/ICDSuggestions'
import VisitSummary from './components/VisitSummary'
import EncounterList from './components/EncounterList'
import { api } from './services/api'
import type { AppState, EncounterResponse } from './types'

function ProcessingOverlay({ state }: { state: AppState }) {
  if (state === 'idle' || state === 'done' || state === 'error') return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl px-10 py-8 flex flex-col items-center gap-5 max-w-xs w-full mx-4">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[rgba(20,184,166,0.3)]"
            style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
          <Loader2 size={28} className="text-[#14b8a6] animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-[#f8fafc] text-base" style={{ fontFamily: 'Figtree, sans-serif' }}>
            {state === 'uploading' ? 'Transcribing audio…' : 'Generating clinical notes…'}
          </p>
          <p className="text-sm text-[#64748b] mt-1.5">
            {state === 'uploading'
              ? 'Running local speech recognition'
              : 'AI pipeline · SOAP · ICD-10 · Summary'}
          </p>
        </div>
        <div className="flex gap-1.5">
          {['Transcription', 'SOAP', 'ICD-10', 'Summary'].map((step) => (
            <div key={step} title={step}
              className="w-8 h-1 rounded-full bg-[rgba(20,184,166,0.25)]" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [encounter, setEncounter] = useState<EncounterResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleResult = useCallback((enc: EncounterResponse) => {
    setEncounter(enc)
    setActiveEncounterId(enc.id)
    setAppState('done')
    setRefreshTrigger((n) => n + 1)
  }, [])

  const handleError = useCallback((msg: string) => {
    setError(msg)
    setAppState('error')
  }, [])

  const processAudio = async (file: File) => {
    setError(null)
    setAppState('uploading')
    try {
      const enc = await api.processAudio(file)
      handleResult(enc)
    } catch (e) {
      handleError(e instanceof Error ? e.message : 'Failed to process audio.')
    }
  }

  const processTranscript = async (text: string) => {
    setError(null)
    setAppState('processing')
    try {
      const enc = await api.processTranscript(text)
      handleResult(enc)
    } catch (e) {
      handleError(e instanceof Error ? e.message : 'Failed to process transcript.')
    }
  }

  const loadEncounter = async (id: string) => {
    setError(null)
    try {
      const enc = await api.getEncounter(id)
      setEncounter(enc)
      setActiveEncounterId(id)
      setAppState('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load encounter.')
    }
  }

  const handleSOAPSave = async (data: {
    subjective: string; objective: string; assessment: string; plan: string; finalized: boolean
  }) => {
    if (!encounter) return
    const updated = await api.updateSOAP(encounter.id, data)
    setEncounter(updated)
  }

  const handleICDSave = async (codes: { id: string; approved: boolean }[]) => {
    if (!encounter) return
    const updated = await api.updateICD(encounter.id, { icd_codes: codes })
    setEncounter(updated)
  }

  const handleDeletedEncounter = (id: string) => {
    if (activeEncounterId === id) {
      setEncounter(null)
      setActiveEncounterId(null)
      setAppState('idle')
    }
  }

  const busy = appState === 'uploading' || appState === 'processing'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#020617' }}>
      <ProcessingOverlay state={appState} />

      {/* Encounter history sidebar */}
      <EncounterList
        onSelect={loadEncounter}
        onDelete={handleDeletedEncounter}
        activeId={activeEncounterId}
        refreshTrigger={refreshTrigger}
      />

      {/* Main area */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-[rgba(51,65,85,0.4)]"
          style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[rgba(20,184,166,0.12)] border border-[rgba(20,184,166,0.25)]
                            flex items-center justify-center">
              <Activity size={14} className="text-[#14b8a6]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#f8fafc] leading-none" style={{ fontFamily: 'Figtree, sans-serif' }}>
                ClinicalDoc <span className="text-[#14b8a6]">AI</span>
              </h1>
              <p className="text-[10px] text-[#475569] mt-0.5">Documentation Copilot</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {appState === 'done' && encounter && (
              <span className="flex items-center gap-1.5 text-xs text-[#4ade80] bg-[rgba(34,197,94,0.08)]
                               px-3 py-1.5 rounded-full border border-[rgba(34,197,94,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                Note generated
                {encounter.processing_time_ms && ` · ${(encounter.processing_time_ms / 1000).toFixed(1)}s`}
              </span>
            )}
            {busy && (
              <span className="flex items-center gap-1.5 text-xs text-[#fbbf24] bg-[rgba(245,158,11,0.08)]
                               px-3 py-1.5 rounded-full border border-[rgba(245,158,11,0.2)]">
                <Loader2 size={11} className="animate-spin" />
                {appState === 'uploading' ? 'Transcribing…' : 'Processing…'}
              </span>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-[rgba(51,65,85,0.5)]">
              <span className="text-xs text-[#475569] px-2 py-1 rounded-md bg-[rgba(20,184,166,0.06)] border border-[rgba(20,184,166,0.15)]">
                Demo
              </span>
            </div>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-3 flex items-center gap-3 px-4 py-3 rounded-xl
                          bg-[rgba(239,68,68,0.07)] border border-[rgba(239,68,68,0.22)] text-[#f87171] text-sm shrink-0">
            <AlertCircle size={15} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => { setError(null); setAppState('idle') }}
              className="text-xs text-[#f87171]/70 hover:text-[#f87171] transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Two-column content */}
        <div className="flex-1 overflow-hidden flex min-h-0">

          {/* Left column — input & transcript */}
          <div className="w-[42%] shrink-0 min-h-0 overflow-y-auto
                          border-r border-[rgba(51,65,85,0.35)]">
            <div className="p-4 space-y-4">
              <AudioUpload
                appState={appState}
                onAudio={processAudio}
                onTranscript={processTranscript}
              />

              {encounter?.transcript && (
                <TranscriptView transcript={encounter.transcript} />
              )}
            </div>
          </div>

          {/* Right column — AI output */}
          <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
            {encounter ? (
              <div className="p-4 space-y-4">
                {encounter.soap_note && (
                  <SOAPNoteEditor
                    soap={encounter.soap_note}
                    encounterId={encounter.id}
                    onSave={handleSOAPSave}
                  />
                )}
                {encounter.icd_codes.length > 0 && (
                  <ICDSuggestions
                    codes={encounter.icd_codes}
                    encounterId={encounter.id}
                    onSave={handleICDSave}
                  />
                )}
                {encounter.visit_summary && (
                  <VisitSummary data={encounter.visit_summary} />
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="space-y-2.5 w-full max-w-md mb-8">
                  {['SOAP Note · Subjective · Objective · Assessment · Plan',
                    'ICD-10 Codes · AI-suggested with clinical rationale',
                    'Visit Summary · Follow-up recommendations'
                  ].map((label, i) => (
                    <div key={i} className="skeleton h-12 rounded-xl opacity-40" title={label} />
                  ))}
                </div>
                <p className="text-xs text-[#64748b]">Clinical output will appear here after processing</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

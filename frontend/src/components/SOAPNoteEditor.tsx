import { useState, useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Save, Lock } from 'lucide-react'
import type { SOAPNote, SOAPSection } from '../types'

interface Props {
  soap: SOAPNote
  encounterId: string
  onSave: (data: { subjective: string; objective: string; assessment: string; plan: string; finalized: boolean }) => Promise<void>
}

function confidenceColor(c: number): { badge: string; border: string; label: string } {
  if (c >= 0.85) return {
    badge: 'bg-[rgba(34,197,94,0.15)] text-[#4ade80] border border-[rgba(34,197,94,0.3)]',
    border: 'border-[rgba(51,65,85,0.6)]',
    label: 'High',
  }
  if (c >= 0.75) return {
    badge: 'bg-[rgba(245,158,11,0.15)] text-[#fbbf24] border border-[rgba(245,158,11,0.3)]',
    border: 'border-[rgba(245,158,11,0.4)]',
    label: 'Review',
  }
  return {
    badge: 'bg-[rgba(239,68,68,0.15)] text-[#f87171] border border-[rgba(239,68,68,0.3)]',
    border: 'border-[rgba(239,68,68,0.5)]',
    label: 'Low',
  }
}

interface SectionEditorProps {
  label: string
  section: SOAPSection
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  rows?: number
}

function SectionEditor({ label, section, value, onChange, disabled, rows = 5 }: SectionEditorProps) {
  const colors = confidenceColor(section.confidence)
  const showWarning = section.confidence < 0.75

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-[#64748b]"
          style={{ fontFamily: 'Figtree, sans-serif' }}>
          {label}
        </label>
        <div className="flex items-center gap-2">
          {showWarning && (
            <span className="flex items-center gap-1 text-xs text-[#fbbf24]">
              <AlertTriangle size={11} />
              Review needed
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
            {Math.round(section.confidence * 100)}% · {colors.label}
          </span>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        className={`
          w-full rounded-lg px-3 py-3 text-sm text-[#e2e8f0] leading-relaxed
          bg-[rgba(15,23,42,0.7)] border transition-all duration-200
          focus:outline-none focus:ring-1 focus:ring-[rgba(20,184,166,0.3)] focus:border-[#14b8a6]
          disabled:opacity-60 disabled:cursor-not-allowed
          placeholder-[#475569]
          ${showWarning ? colors.border + ' focus:border-[#f59e0b]' : 'border-[rgba(51,65,85,0.6)]'}
        `}
        aria-label={`${label} section`}
      />
    </div>
  )
}

export default function SOAPNoteEditor({ soap, onSave }: Props) {
  const [subjective, setSubjective] = useState(soap.subjective.content)
  const [objective, setObjective] = useState(soap.objective.content)
  const [assessment, setAssessment] = useState(soap.assessment.content)
  const [plan, setPlan] = useState(soap.plan.content)
  const [finalized, setFinalized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSubjective(soap.subjective.content)
    setObjective(soap.objective.content)
    setAssessment(soap.assessment.content)
    setPlan(soap.plan.content)
    setFinalized(false)
    setSaved(false)
  }, [soap])

  const handleSave = async (withFinalize = false) => {
    setSaving(true)
    try {
      await onSave({ subjective, objective, assessment, plan, finalized: withFinalize })
      if (withFinalize) setFinalized(true)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const anyUncertain = soap.subjective.uncertain || soap.objective.uncertain
    || soap.assessment.uncertain || soap.plan.uncertain

  return (
    <div className="glass rounded-xl overflow-hidden animate-fade-up">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(51,65,85,0.5)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#14b8a6]" />
          <h2 className="text-sm font-semibold text-[#f8fafc]" style={{ fontFamily: 'Figtree, sans-serif' }}>
            SOAP Note
          </h2>
          {finalized && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                             bg-[rgba(34,197,94,0.12)] text-[#4ade80] border border-[rgba(34,197,94,0.25)]">
              <Lock size={10} /> Finalized
            </span>
          )}
        </div>
        {anyUncertain && (
          <span className="flex items-center gap-1.5 text-xs text-[#fbbf24] bg-[rgba(245,158,11,0.1)]
                           px-2.5 py-1 rounded-full border border-[rgba(245,158,11,0.2)]">
            <AlertTriangle size={12} />
            {[soap.subjective, soap.objective, soap.assessment, soap.plan].filter(s => s.uncertain).length} section(s) need review
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 gap-5">
          <SectionEditor label="Subjective" section={soap.subjective} value={subjective}
            onChange={setSubjective} disabled={finalized} rows={4} />
          <SectionEditor label="Objective" section={soap.objective} value={objective}
            onChange={setObjective} disabled={finalized} rows={4} />
          <SectionEditor label="Assessment" section={soap.assessment} value={assessment}
            onChange={setAssessment} disabled={finalized} rows={4} />
          <SectionEditor label="Plan" section={soap.plan} value={plan}
            onChange={setPlan} disabled={finalized} rows={4} />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => handleSave(false)}
            disabled={saving || finalized}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                       bg-[rgba(20,184,166,0.12)] text-[#14b8a6] border border-[rgba(20,184,166,0.3)]
                       hover:bg-[rgba(20,184,166,0.2)] transition-all duration-200 cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Draft'}
          </button>

          {!finalized && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                         bg-[#14b8a6] text-white hover:bg-[#0d9488]
                         transition-all duration-200 cursor-pointer
                         disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]
                         shadow-[0_0_16px_rgba(20,184,166,0.25)]"
            >
              <Lock size={15} />
              {saving ? 'Finalizing…' : 'Finalize Note'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

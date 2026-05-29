import { useState, useEffect } from 'react'
import { ClipboardList, Clock, Save, CheckCircle2 } from 'lucide-react'
import type { VisitSummary as VisitSummaryType } from '../types'

interface Props {
  data: VisitSummaryType
}

function timeframeBadge(timeframe: string | null) {
  if (!timeframe) return null
  const t = timeframe.toLowerCase()
  if (t.includes('week') || t.includes('day')) return 'bg-[rgba(20,184,166,0.12)] text-[#2dd4bf] border-[rgba(20,184,166,0.25)]'
  if (t.includes('month')) return 'bg-[rgba(99,102,241,0.12)] text-[#a5b4fc] border-[rgba(99,102,241,0.25)]'
  if (t.includes('needed') || t.includes('prn')) return 'bg-[rgba(245,158,11,0.12)] text-[#fbbf24] border-[rgba(245,158,11,0.25)]'
  return 'bg-[rgba(51,65,85,0.4)] text-[#94a3b8] border-[rgba(71,85,105,0.3)]'
}

export default function VisitSummary({ data }: Props) {
  const [summary, setSummary] = useState(data.summary)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSummary(data.summary)
    setSaved(false)
  }, [data])

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="glass rounded-xl overflow-hidden animate-fade-up">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[rgba(51,65,85,0.5)]">
        <ClipboardList size={15} className="text-[#14b8a6]" />
        <h2 className="text-sm font-semibold text-[#f8fafc]" style={{ fontFamily: 'Figtree, sans-serif' }}>
          Visit Summary
        </h2>
      </div>

      <div className="p-5 space-y-5">
        {/* Summary textarea */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#64748b] mb-2"
            style={{ fontFamily: 'Figtree, sans-serif' }}>
            Summary
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className="w-full rounded-lg px-3 py-3 text-sm text-[#e2e8f0] leading-relaxed
                       bg-[rgba(15,23,42,0.7)] border border-[rgba(51,65,85,0.6)]
                       focus:outline-none focus:border-[#14b8a6] focus:ring-1 focus:ring-[rgba(20,184,166,0.3)]
                       transition-all duration-200 placeholder-[#475569]"
            aria-label="Visit summary"
          />
        </div>

        {/* Follow-ups */}
        {data.follow_ups.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={13} className="text-[#64748b]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#64748b]"
                style={{ fontFamily: 'Figtree, sans-serif' }}>
                Follow-up Actions
              </span>
            </div>
            <ul className="space-y-2" role="list">
              {data.follow_ups.map((f, i) => {
                const badge = timeframeBadge(f.timeframe)
                return (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-lg
                                          bg-[rgba(15,23,42,0.5)] border border-[rgba(51,65,85,0.4)]">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[rgba(20,184,166,0.15)] border border-[rgba(20,184,166,0.3)]
                                     flex items-center justify-center text-[#14b8a6] text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-[#cbd5e1] leading-snug">{f.action}</span>
                    {f.timeframe && badge && (
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${badge}`}>
                        {f.timeframe}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                     bg-[rgba(20,184,166,0.12)] text-[#14b8a6] border border-[rgba(20,184,166,0.3)]
                     hover:bg-[rgba(20,184,166,0.2)] transition-all duration-200 cursor-pointer
                     disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Summary'}
        </button>
      </div>
    </div>
  )
}

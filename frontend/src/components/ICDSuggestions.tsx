import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Save, X, Tag } from 'lucide-react'
import type { ICDCode, ICDSearchResult } from '../types'
import { api } from '../services/api'

interface Props {
  codes: ICDCode[]
  encounterId: string
  onSave: (codes: { id: string; approved: boolean }[]) => Promise<void>
}

function confidenceBadge(c: number) {
  if (c >= 0.85) return 'bg-[rgba(34,197,94,0.12)] text-[#4ade80] border-[rgba(34,197,94,0.25)]'
  if (c >= 0.65) return 'bg-[rgba(245,158,11,0.12)] text-[#fbbf24] border-[rgba(245,158,11,0.25)]'
  return 'bg-[rgba(239,68,68,0.12)] text-[#f87171] border-[rgba(239,68,68,0.25)]'
}

export default function ICDSuggestions({ codes: initialCodes, onSave }: Props) {
  const [codes, setCodes] = useState<ICDCode[]>(initialCodes)
  const [searchQ, setSearchQ] = useState('')
  const [results, setResults] = useState<ICDSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setCodes(initialCodes) }, [initialCodes])

  useEffect(() => {
    if (!searchQ.trim()) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await api.searchICD(searchQ, 6)
        setResults(r)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
  }, [searchQ])

  const toggleApproved = (idx: number) => {
    setCodes((prev) => prev.map((c, i) => i === idx ? { ...c, approved: !c.approved } : c))
  }

  const addCode = (r: ICDSearchResult) => {
    const exists = codes.some((c) => c.code === r.code)
    if (!exists) {
      setCodes((prev) => [...prev, {
        code: r.code,
        description: r.description,
        confidence: r.score,
        rationale: null,
        approved: true,
      }])
    }
    setSearchQ('')
    setResults([])
  }

  const removeCode = (idx: number) => {
    setCodes((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = codes
        .filter((c) => c.id)
        .map((c) => ({ id: c.id!, approved: c.approved }))
      await onSave(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass rounded-xl animate-fade-up">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(51,65,85,0.5)]">
        <div className="flex items-center gap-2">
          <Tag size={15} className="text-[#14b8a6]" />
          <h2 className="text-sm font-semibold text-[#f8fafc]" style={{ fontFamily: 'Figtree, sans-serif' }}>
            ICD-10 Codes
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(20,184,166,0.1)] text-[#14b8a6]">
            {codes.filter((c) => c.approved).length} approved
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Code list */}
        <div className="space-y-2">
          {codes.map((code, idx) => {
            const codeKey = code.id ?? `${code.code}-${idx}`
            const isExpanded = expandedId === codeKey
            return (
              <div
                key={codeKey}
                className={`rounded-lg border transition-all duration-200
                  ${code.approved
                    ? 'bg-[rgba(15,23,42,0.6)] border-[rgba(51,65,85,0.5)]'
                    : 'bg-[rgba(239,68,68,0.04)] border-[rgba(239,68,68,0.2)] opacity-60'}
                `}
              >
                <div className="flex items-start gap-3 px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={code.approved}
                    onChange={() => toggleApproved(idx)}
                    className="mt-0.5 w-4 h-4 rounded accent-[#14b8a6] cursor-pointer shrink-0"
                    aria-label={`${code.approved ? 'Deselect' : 'Select'} ${code.code}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold text-[#2dd4bf] bg-[rgba(20,184,166,0.12)]
                                       px-2 py-0.5 rounded border border-[rgba(20,184,166,0.2)]">
                        {code.code}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${confidenceBadge(code.confidence)}`}>
                        {Math.round(code.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-[#cbd5e1] leading-snug">{code.description}</p>
                    {code.rationale && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : codeKey)}
                        className="mt-1.5 text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors cursor-pointer"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? '▲ Hide rationale' : '▼ Show rationale'}
                      </button>
                    )}
                    {isExpanded && code.rationale && (
                      <p className="mt-2 text-xs text-[#94a3b8] italic leading-relaxed bg-[rgba(15,23,42,0.5)]
                                     rounded px-2.5 py-2 border-l-2 border-[rgba(20,184,166,0.3)]">
                        {code.rationale}
                      </p>
                    )}
                  </div>
                  {!code.id && (
                    <button
                      onClick={() => removeCode(idx)}
                      className="shrink-0 text-[#475569] hover:text-[#f87171] transition-colors cursor-pointer"
                      aria-label={`Remove ${code.code}`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Search to add */}
        <div className="relative">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search ICD-10 codes to add…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm
                         bg-[rgba(15,23,42,0.8)] border border-[rgba(51,65,85,0.6)] text-[#f8fafc]
                         placeholder-[#475569]
                         focus:outline-none focus:border-[#14b8a6] focus:ring-1 focus:ring-[rgba(20,184,166,0.25)]
                         transition-all duration-200"
              aria-label="Search ICD-10 codes"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2
                               border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {results.length > 0 && (
            <div className="absolute z-20 top-full mt-1.5 w-full rounded-xl glass-elevated shadow-lg overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.code}
                  onClick={() => addCode(r)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left
                             hover:bg-[rgba(20,184,166,0.08)] transition-colors duration-150 cursor-pointer
                             border-b border-[rgba(51,65,85,0.4)] last:border-0"
                >
                  <Plus size={13} className="shrink-0 text-[#14b8a6]" />
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-semibold text-[#2dd4bf] mr-2">{r.code}</span>
                    <span className="text-sm text-[#cbd5e1] truncate">{r.description}</span>
                  </div>
                  <span className="ml-auto text-xs text-[#64748b] shrink-0">
                    {Math.round(r.score * 100)}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                     bg-[#14b8a6] text-white hover:bg-[#0d9488]
                     transition-all duration-200 cursor-pointer
                     disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          <Save size={14} />
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save ICD Codes'}
        </button>
      </div>
    </div>
  )
}

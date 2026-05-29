import { useState, useEffect } from 'react'
import { Clock, Trash2, ChevronLeft, ChevronRight, Stethoscope } from 'lucide-react'
import type { EncounterListItem } from '../types'
import { api } from '../services/api'

interface Props {
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  activeId: string | null
  refreshTrigger: number
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

export default function EncounterList({ onSelect, onDelete, activeId, refreshTrigger }: Props) {
  const [encounters, setEncounters] = useState<EncounterListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await api.listEncounters(1, 30)
      setEncounters(res.items)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [refreshTrigger])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this encounter? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await api.deleteEncounter(id)
      setEncounters((prev) => prev.filter((enc) => enc.id !== id))
      onDelete(id)
    } catch {
      alert('Failed to delete encounter.')
    } finally {
      setDeletingId(null)
    }
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 w-12 glass border-r border-[rgba(51,65,85,0.4)] h-full">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg hover:bg-[rgba(20,184,166,0.1)] text-[#64748b] hover:text-[#14b8a6]
                     transition-all duration-200 cursor-pointer"
          aria-label="Expand encounter list"
        >
          <ChevronRight size={16} />
        </button>
        <div className="mt-4 flex flex-col items-center gap-3">
          {encounters.slice(0, 8).map((enc) => (
            <button
              key={enc.id}
              onClick={() => { onSelect(enc.id); setCollapsed(false) }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                          transition-all duration-200 cursor-pointer
                          ${activeId === enc.id
                            ? 'bg-[#14b8a6] text-white'
                            : 'bg-[rgba(30,41,59,0.8)] text-[#64748b] hover:text-[#14b8a6]'}`}
              title={formatDate(enc.encounter_date)}
            >
              {new Date(enc.encounter_date).getDate()}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-72 shrink-0 min-h-0 glass border-r border-[rgba(51,65,85,0.4)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[rgba(51,65,85,0.5)]">
        <div className="flex items-center gap-2">
          <Stethoscope size={15} className="text-[#14b8a6]" />
          <span className="text-sm font-semibold text-[#f8fafc]" style={{ fontFamily: 'Figtree, sans-serif' }}>
            Past Encounters
          </span>
          {encounters.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(20,184,166,0.15)] text-[#14b8a6]">
              {encounters.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[#64748b] hover:text-[#94a3b8]
                     transition-all duration-150 cursor-pointer"
          aria-label="Collapse encounter list"
        >
          <ChevronLeft size={15} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="px-4 py-3 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        ) : encounters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 px-6 text-center">
            <div className="w-10 h-10 rounded-full bg-[rgba(20,184,166,0.08)] flex items-center justify-center mb-3">
              <Stethoscope size={18} className="text-[#475569]" />
            </div>
            <p className="text-sm text-[#475569]">No encounters yet</p>
            <p className="text-xs text-[#334155] mt-1">Process your first consultation above</p>
          </div>
        ) : (
          encounters.map((enc) => (
            <div
              key={enc.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(enc.id)}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(enc.id)}
              className={`
                w-full text-left px-4 py-3 border-b border-[rgba(51,65,85,0.3)]
                hover:bg-[rgba(20,184,166,0.05)] transition-all duration-150 cursor-pointer
                group relative
                ${activeId === enc.id ? 'bg-[rgba(20,184,166,0.08)] border-l-2 border-l-[#14b8a6] pl-3.5' : ''}
              `}
              aria-current={activeId === enc.id ? 'true' : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={11} className="text-[#475569] shrink-0" />
                    <span className="text-xs text-[#64748b]">{formatDate(enc.encounter_date)}</span>
                    <span className="text-xs text-[#475569]">{formatTime(enc.encounter_date)}</span>
                  </div>
                  <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-2">
                    {enc.transcript.slice(0, 100)}…
                  </p>
                  {enc.processing_time_ms && (
                    <span className="mt-1.5 inline-block text-[10px] text-[#475569]">
                      {(enc.processing_time_ms / 1000).toFixed(1)}s to process
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => handleDelete(e, enc.id)}
                  disabled={deletingId === enc.id}
                  className="shrink-0 p-1.5 rounded opacity-0 group-hover:opacity-100
                             text-[#475569] hover:text-[#f87171] hover:bg-[rgba(239,68,68,0.1)]
                             transition-all duration-150 cursor-pointer
                             disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Delete encounter"
                >
                  {deletingId === enc.id
                    ? <div className="w-3 h-3 border border-[#f87171] border-t-transparent rounded-full animate-spin" />
                    : <Trash2 size={13} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

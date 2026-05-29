import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'

interface Props {
  transcript: string
}

export default function TranscriptView({ transcript }: Props) {
  const [expanded, setExpanded] = useState(false)
  const preview = transcript.slice(0, 300)
  const truncated = transcript.length > 300

  return (
    <div className="glass rounded-xl overflow-hidden animate-fade-up">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(51,65,85,0.5)]">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-[#14b8a6]" />
          <span className="text-sm font-semibold text-[#f8fafc]" style={{ fontFamily: 'Figtree, sans-serif' }}>
            Transcript
          </span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-[rgba(20,184,166,0.12)] text-[#14b8a6] text-xs font-medium">
            {transcript.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
        {truncated && (
          <button
            onClick={() => setExpanded((x) => !x)}
            className="flex items-center gap-1 text-xs text-[#94a3b8] hover:text-[#f8fafc]
                       transition-colors duration-150 cursor-pointer"
            aria-expanded={expanded}
          >
            {expanded ? <><ChevronUp size={13} /> Collapse</> : <><ChevronDown size={13} /> Expand</>}
          </button>
        )}
      </div>

      <div className="px-5 py-4">
        <p
          className="text-sm text-[#cbd5e1] leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}
        >
          {expanded ? transcript : preview}
          {!expanded && truncated && (
            <span className="text-[#475569]">…</span>
          )}
        </p>
        {!expanded && truncated && (
          <button
            onClick={() => setExpanded(true)}
            className="mt-3 text-xs text-[#14b8a6] hover:text-[#2dd4bf] transition-colors cursor-pointer"
          >
            Show full transcript ({transcript.length - 300} more chars)
          </button>
        )}
      </div>
    </div>
  )
}

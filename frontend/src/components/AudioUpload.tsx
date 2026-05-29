import { useState, useRef, useCallback } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { Upload, Mic, FileText, Square, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { AppState } from '../types'

type Tab = 'upload' | 'record' | 'paste'

interface Props {
  appState: AppState
  onAudio: (file: File) => void
  onTranscript: (text: string) => void
}

const ACCEPTED = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/flac', 'audio/x-flac', 'audio/ogg']
const ACCEPTED_EXT = '.wav,.mp3,.m4a,.webm,.flac'
const MAX_SIZE = 100 * 1024 * 1024

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function AudioUpload({ appState, onAudio, onTranscript }: Props) {
  const [tab, setTab] = useState<Tab>('upload')
  const [dragging, setDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const busy = appState === 'uploading' || appState === 'processing'

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED.includes(f.type) && !f.name.match(/\.(wav|mp3|m4a|webm|flac|ogg)$/i)) {
      return 'Unsupported format. Use WAV, MP3, M4A, WebM, or FLAC.'
    }
    if (f.size > MAX_SIZE) return 'File exceeds 100 MB limit.'
    return null
  }

  const handleFile = (f: File) => {
    const err = validateFile(f)
    if (err) { setFileError(err); setSelectedFile(null); return }
    setFileError(null)
    setSelectedFile(f)
  }

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const submitAudio = () => {
    if (selectedFile) onAudio(selectedFile)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4'
      const mr = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const file = new File([blob], 'recording.webm', { type: mimeType })
        stream.getTracks().forEach((t) => t.stop())
        onAudio(file)
      }
      mr.start(250)
      mediaRef.current = mr
      setRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    } catch {
      setFileError('Microphone access denied.')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const submitTranscript = () => {
    const trimmed = transcript.trim()
    if (trimmed.length < 20) { setFileError('Transcript is too short.'); return }
    setFileError(null)
    onTranscript(trimmed)
  }

  const tabs: { id: Tab; label: string; icon: typeof Upload }[] = [
    { id: 'upload', label: 'Upload File', icon: Upload },
    { id: 'record', label: 'Live Record', icon: Mic },
    { id: 'paste', label: 'Paste Text', icon: FileText },
  ]

  return (
    <div className="glass rounded-xl animate-fade-up">
      {/* Tab bar */}
      <div className="flex border-b border-[rgba(51,65,85,0.6)]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setFileError(null) }}
            disabled={busy}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
              transition-all duration-200 cursor-pointer
              ${tab === id
                ? 'text-[#14b8a6] border-b-2 border-[#14b8a6] bg-[rgba(20,184,166,0.06)]'
                : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[rgba(255,255,255,0.03)]'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-selected={tab === id}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* Error */}
        {fileError && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#f87171] text-sm">
            <AlertCircle size={14} className="shrink-0" />
            {fileError}
          </div>
        )}

        {/* Upload tab */}
        {tab === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !busy && fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center gap-3
                rounded-xl border-2 border-dashed py-10 px-6
                transition-all duration-200 cursor-pointer
                ${dragging
                  ? 'border-[#14b8a6] bg-[rgba(20,184,166,0.08)]'
                  : selectedFile
                    ? 'border-[rgba(34,197,94,0.5)] bg-[rgba(34,197,94,0.05)]'
                    : 'border-[rgba(51,65,85,0.7)] hover:border-[rgba(20,184,166,0.5)] hover:bg-[rgba(20,184,166,0.04)]'}
                ${busy ? 'pointer-events-none opacity-60' : ''}
              `}
              role="button"
              tabIndex={0}
              aria-label="Upload audio file"
              onKeyDown={(e) => e.key === 'Enter' && !busy && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXT}
                className="sr-only"
                onChange={onFileChange}
                aria-hidden="true"
              />
              {selectedFile ? (
                <>
                  <CheckCircle2 size={36} className="text-[#22c55e]" />
                  <div className="text-center">
                    <p className="font-medium text-[#f8fafc]">{selectedFile.name}</p>
                    <p className="text-xs text-[#64748b] mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-[rgba(20,184,166,0.1)] flex items-center justify-center">
                    <Upload size={22} className="text-[#14b8a6]" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-[#f8fafc]">Drop audio file here</p>
                    <p className="text-xs text-[#64748b] mt-1">WAV · MP3 · M4A · WebM · FLAC · max 100 MB</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={submitAudio}
              disabled={!selectedFile || busy}
              className="w-full py-2.5 rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold text-sm
                         transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
                         active:scale-[0.98]"
            >
              {busy ? 'Processing…' : 'Transcribe & Analyse'}
            </button>
          </div>
        )}

        {/* Record tab */}
        {tab === 'record' && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="relative flex items-center justify-center">
              {recording && (
                <>
                  <span className="absolute w-20 h-20 rounded-full border-2 border-[#ef4444] opacity-60"
                    style={{ animation: 'pulse-ring 1.5s ease-out infinite' }} />
                  <span className="absolute w-28 h-28 rounded-full border border-[#ef4444] opacity-25"
                    style={{ animation: 'pulse-ring 1.5s ease-out 0.4s infinite' }} />
                </>
              )}
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={busy}
                className={`
                  relative z-10 w-16 h-16 rounded-full flex items-center justify-center
                  transition-all duration-200 cursor-pointer shadow-lg
                  ${recording
                    ? 'bg-[#ef4444] hover:bg-[#dc2626] shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                    : 'bg-[rgba(20,184,166,0.15)] border-2 border-[#14b8a6] hover:bg-[rgba(20,184,166,0.25)]'}
                  disabled:opacity-40 disabled:cursor-not-allowed active:scale-95
                `}
                aria-label={recording ? 'Stop recording' : 'Start recording'}
              >
                {recording
                  ? <Square size={20} className="text-white fill-white" />
                  : <Mic size={22} className="text-[#14b8a6]" />}
              </button>
            </div>

            {recording ? (
              <div className="text-center">
                <p className="font-mono text-2xl font-semibold text-[#ef4444] animate-recording">
                  {formatTime(recordingTime)}
                </p>
                <p className="text-xs text-[#94a3b8] mt-1">Recording… tap square to stop</p>
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">Tap the mic to start recording</p>
            )}
          </div>
        )}

        {/* Paste tab */}
        {tab === 'paste' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="transcript-input" className="block text-xs font-medium text-[#94a3b8] mb-2 uppercase tracking-wide">
                Doctor–Patient Transcript
              </label>
              <textarea
                id="transcript-input"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={busy}
                rows={6}
                placeholder="Doctor: Good morning. What brings you in today?&#10;Patient: I've had a persistent cough for two weeks…"
                className="w-full rounded-lg px-3 py-3 text-sm text-[#f8fafc] placeholder-[#475569]
                           bg-[rgba(15,23,42,0.8)] border border-[rgba(51,65,85,0.6)]
                           focus:outline-none focus:border-[#14b8a6] focus:ring-1 focus:ring-[rgba(20,184,166,0.3)]
                           transition-all duration-200 disabled:opacity-50
                           font-[inherit] leading-relaxed resize-y"
                style={{ minHeight: '120px', maxHeight: '420px' }}
                aria-label="Paste transcript"
              />
              <p className="text-xs text-[#64748b] mt-1.5 text-right">{transcript.length} chars</p>
            </div>
            <button
              onClick={submitTranscript}
              disabled={transcript.trim().length < 20 || busy}
              className="w-full py-2.5 rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold text-sm
                         transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
                         active:scale-[0.98]"
            >
              {busy ? 'Processing…' : 'Generate SOAP Note'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

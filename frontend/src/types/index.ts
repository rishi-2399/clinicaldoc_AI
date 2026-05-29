export interface Patient {
  id: string
  name: string | null
  date_of_birth: string | null
  created_at: string
}

export interface SOAPSection {
  content: string
  confidence: number
  uncertain: boolean
}

export interface SOAPNote {
  subjective: SOAPSection
  objective: SOAPSection
  assessment: SOAPSection
  plan: SOAPSection
}

export interface ICDCode {
  id?: string
  encounter_id?: string
  code: string
  description: string
  confidence: number
  rationale: string | null
  approved: boolean
}

export interface FollowUp {
  action: string
  timeframe: string | null
}

export interface VisitSummary {
  summary: string
  follow_ups: FollowUp[]
}

export interface EncounterResponse {
  id: string
  patient_id: string | null
  encounter_date: string
  transcript: string
  processing_time_ms: number | null
  created_at: string
  soap_note: SOAPNote | null
  icd_codes: ICDCode[]
  visit_summary: VisitSummary | null
}

export interface EncounterListItem {
  id: string
  patient_id: string | null
  encounter_date: string
  transcript: string
  processing_time_ms: number | null
  created_at: string
}

export interface PaginatedEncounters {
  items: EncounterListItem[]
  total: number
  page: number
  page_size: number
}

export interface SOAPUpdatePayload {
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  finalized?: boolean
}

export interface ICDUpdatePayload {
  icd_codes: { id: string; approved: boolean }[]
}

export interface ICDSearchResult {
  code: string
  description: string
  score: number
}

export type AppState = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

import type {
  EncounterResponse,
  PaginatedEncounters,
  SOAPUpdatePayload,
  ICDUpdatePayload,
  ICDSearchResult,
} from '../types'
const BASE = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// The backend stores SOAP as flat fields (subjective: string, subjective_confidence: number).
// The frontend types expect nested SOAPSection objects. This transformer bridges the gap.
function transformEncounter(raw: Record<string, unknown>): EncounterResponse {
  const soap = raw.soap_note as Record<string, unknown> | null
  return {
    ...(raw as unknown as EncounterResponse),
    soap_note: soap ? {
      subjective: {
        content: soap.subjective as string,
        confidence: (soap.subjective_confidence as number) ?? 0.8,
        uncertain: ((soap.subjective_confidence as number) ?? 1) < 0.75,
      },
      objective: {
        content: soap.objective as string,
        confidence: (soap.objective_confidence as number) ?? 0.8,
        uncertain: ((soap.objective_confidence as number) ?? 1) < 0.75,
      },
      assessment: {
        content: soap.assessment as string,
        confidence: (soap.assessment_confidence as number) ?? 0.8,
        uncertain: ((soap.assessment_confidence as number) ?? 1) < 0.75,
      },
      plan: {
        content: soap.plan as string,
        confidence: (soap.plan_confidence as number) ?? 0.8,
        uncertain: ((soap.plan_confidence as number) ?? 1) < 0.75,
      },
    } : null,
  }
}

export const api = {
  async processTranscript(transcript: string): Promise<EncounterResponse> {
    const raw = await request<Record<string, unknown>>('/api/encounter/transcript', {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    })
    return transformEncounter(raw)
  },

  async processAudio(file: File): Promise<EncounterResponse> {
    const form = new FormData()
    form.append('file', file)
    const raw = await request<Record<string, unknown>>('/api/encounter/audio', { method: 'POST', body: form })
    return transformEncounter(raw)
  },

  listEncounters(page = 1, pageSize = 20): Promise<PaginatedEncounters> {
    return request(`/api/encounters?page=${page}&page_size=${pageSize}`)
  },

  async getEncounter(id: string): Promise<EncounterResponse> {
    const raw = await request<Record<string, unknown>>(`/api/encounters/${id}`)
    return transformEncounter(raw)
  },

  async updateSOAP(id: string, payload: SOAPUpdatePayload): Promise<EncounterResponse> {
    const raw = await request<Record<string, unknown>>(`/api/encounters/${id}/soap`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return transformEncounter(raw)
  },

  async updateICD(id: string, payload: ICDUpdatePayload): Promise<EncounterResponse> {
    const raw = await request<Record<string, unknown>>(`/api/encounters/${id}/icd`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return transformEncounter(raw)
  },

  deleteEncounter(id: string): Promise<void> {
    return request(`/api/encounters/${id}`, { method: 'DELETE' })
  },

  searchICD(q: string, n = 8): Promise<ICDSearchResult[]> {
    return request(`/api/icd/search?q=${encodeURIComponent(q)}&n=${n}`)
  },
}

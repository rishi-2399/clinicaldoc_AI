from __future__ import annotations
import uuid
from datetime import datetime, date
from typing import Optional, List, Any
from pydantic import BaseModel


class TranscriptRequest(BaseModel):
    transcript: str


class SOAPNoteBase(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str
    subjective_confidence: Optional[float] = None
    objective_confidence: Optional[float] = None
    assessment_confidence: Optional[float] = None
    plan_confidence: Optional[float] = None
    finalized: bool = False


class SOAPNoteResponse(SOAPNoteBase):
    id: uuid.UUID
    encounter_id: uuid.UUID
    updated_at: datetime

    model_config = {"from_attributes": True}


class SOAPUpdateRequest(BaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    finalized: Optional[bool] = None


class ICDCodeBase(BaseModel):
    code: str
    description: str
    confidence: Optional[float] = None
    rationale: Optional[str] = None
    approved: bool = True


class ICDCodeResponse(ICDCodeBase):
    id: uuid.UUID
    encounter_id: uuid.UUID

    model_config = {"from_attributes": True}


class ICDUpdateItem(BaseModel):
    id: uuid.UUID
    approved: bool


class ICDUpdateRequest(BaseModel):
    codes: List[ICDUpdateItem]


class VisitSummaryBase(BaseModel):
    summary: str
    follow_ups: List[Any] = []


class VisitSummaryResponse(VisitSummaryBase):
    id: uuid.UUID
    encounter_id: uuid.UUID
    updated_at: datetime

    model_config = {"from_attributes": True}


class EncounterResponse(BaseModel):
    id: uuid.UUID
    patient_id: Optional[uuid.UUID] = None
    encounter_date: datetime
    transcript: str
    processing_time_ms: Optional[int] = None
    created_at: datetime
    soap_note: Optional[SOAPNoteResponse] = None
    icd_codes: List[ICDCodeResponse] = []
    visit_summary: Optional[VisitSummaryResponse] = None

    model_config = {"from_attributes": True}


class EncounterListItem(BaseModel):
    id: uuid.UUID
    encounter_date: datetime
    transcript: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedEncounters(BaseModel):
    items: List[EncounterListItem]
    total: int
    page: int
    page_size: int


class ICDSearchResult(BaseModel):
    code: str
    description: str
    score: Optional[float] = None

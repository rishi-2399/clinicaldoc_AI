import time
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.db_models import Encounter, SOAPNote, ICDCode, VisitSummary
from app.models.schemas import (
    TranscriptRequest, EncounterResponse, PaginatedEncounters,
    SOAPUpdateRequest, ICDUpdateRequest,
)
from app.services import transcription as transcription_svc
from app.services import soap_generator, icd_service, summary_service
from datetime import datetime

router = APIRouter(prefix="/api", tags=["encounters"])


async def _load_encounter(
    encounter_id: uuid.UUID, db: AsyncSession, user_id: str
) -> Encounter | None:
    result = await db.execute(
        select(Encounter)
        .where(Encounter.id == encounter_id, Encounter.user_id == user_id)
        .options(
            selectinload(Encounter.soap_note),
            selectinload(Encounter.icd_codes),
            selectinload(Encounter.visit_summary),
        )
    )
    return result.scalar_one_or_none()


async def _run_pipeline(transcript_text: str, db: AsyncSession, user_id: str) -> Encounter:
    start = time.monotonic()

    soap = await soap_generator.generate_soap(transcript_text)
    icd_codes = await icd_service.get_icd_suggestions(soap.assessment, soap.plan)
    summary = await summary_service.generate_summary(soap.model_dump(), icd_codes)

    elapsed_ms = int((time.monotonic() - start) * 1000)

    encounter = Encounter(transcript=transcript_text, processing_time_ms=elapsed_ms, user_id=user_id)
    db.add(encounter)
    await db.flush()

    db.add(SOAPNote(
        encounter_id=encounter.id,
        subjective=soap.subjective,
        objective=soap.objective,
        assessment=soap.assessment,
        plan=soap.plan,
        subjective_confidence=soap.subjective_confidence,
        objective_confidence=soap.objective_confidence,
        assessment_confidence=soap.assessment_confidence,
        plan_confidence=soap.plan_confidence,
    ))

    for code in icd_codes:
        db.add(ICDCode(
            encounter_id=encounter.id,
            code=code.code,
            description=code.description,
            confidence=code.confidence,
            rationale=code.rationale,
        ))

    db.add(VisitSummary(
        encounter_id=encounter.id,
        summary=summary.summary,
        follow_ups=summary.follow_ups,
    ))

    await db.commit()
    return await _load_encounter(encounter.id, db, user_id)


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/encounter/transcript", response_model=EncounterResponse)
async def process_transcript(
    req: TranscriptRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    return await _run_pipeline(req.transcript, db, current_user)


@router.post("/encounter/audio", response_model=EncounterResponse)
async def process_audio(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    audio_bytes = await file.read()
    transcript_text = await transcription_svc.transcribe_audio(audio_bytes)
    return await _run_pipeline(transcript_text, db, current_user)


@router.get("/encounters", response_model=PaginatedEncounters)
async def list_encounters(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    offset = (page - 1) * page_size
    total = (await db.execute(
        select(func.count()).select_from(Encounter).where(Encounter.user_id == current_user)
    )).scalar_one()
    rows = (await db.execute(
        select(Encounter)
        .where(Encounter.user_id == current_user)
        .order_by(Encounter.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )).scalars().all()
    return PaginatedEncounters(items=rows, total=total, page=page, page_size=page_size)


@router.get("/encounters/{encounter_id}", response_model=EncounterResponse)
async def get_encounter(
    encounter_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    encounter = await _load_encounter(encounter_id, db, current_user)
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    return encounter


@router.patch("/encounters/{encounter_id}/soap", response_model=EncounterResponse)
async def update_soap(
    encounter_id: uuid.UUID,
    req: SOAPUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    encounter = await _load_encounter(encounter_id, db, current_user)
    if not encounter or not encounter.soap_note:
        raise HTTPException(status_code=404, detail="Encounter not found")

    for field, value in req.model_dump(exclude_none=True).items():
        setattr(encounter.soap_note, field, value)
    encounter.soap_note.updated_at = datetime.utcnow()

    await db.commit()
    return await _load_encounter(encounter_id, db, current_user)


@router.patch("/encounters/{encounter_id}/icd", response_model=EncounterResponse)
async def update_icd(
    encounter_id: uuid.UUID,
    req: ICDUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    encounter = await _load_encounter(encounter_id, db, current_user)
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    code_map = {c.id: c for c in encounter.icd_codes}
    for item in req.codes:
        if item.id in code_map:
            code_map[item.id].approved = item.approved

    await db.commit()
    return await _load_encounter(encounter_id, db, current_user)


@router.delete("/encounters/{encounter_id}")
async def delete_encounter(
    encounter_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    result = await db.execute(
        select(Encounter).where(Encounter.id == encounter_id, Encounter.user_id == current_user)
    )
    encounter = result.scalar_one_or_none()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    await db.delete(encounter)
    await db.commit()
    return {"deleted": True}

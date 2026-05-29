import uuid
from datetime import datetime, date
from sqlalchemy import Text, Float, Boolean, Integer, ForeignKey, Date
from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str | None] = mapped_column(Text)
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    encounters: Mapped[list["Encounter"]] = relationship(back_populates="patient")


class Encounter(Base):
    __tablename__ = "encounters"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    patient_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="SET NULL"), nullable=True
    )
    encounter_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    transcript: Mapped[str] = mapped_column(Text, nullable=False)
    processing_time_ms: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    patient: Mapped["Patient | None"] = relationship(back_populates="encounters")
    soap_note: Mapped["SOAPNote | None"] = relationship(back_populates="encounter", cascade="all, delete-orphan")
    icd_codes: Mapped[list["ICDCode"]] = relationship(back_populates="encounter", cascade="all, delete-orphan")
    visit_summary: Mapped["VisitSummary | None"] = relationship(back_populates="encounter", cascade="all, delete-orphan")


class SOAPNote(Base):
    __tablename__ = "soap_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    encounter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("encounters.id", ondelete="CASCADE"), unique=True
    )
    subjective: Mapped[str] = mapped_column(Text, nullable=False)
    objective: Mapped[str] = mapped_column(Text, nullable=False)
    assessment: Mapped[str] = mapped_column(Text, nullable=False)
    plan: Mapped[str] = mapped_column(Text, nullable=False)
    subjective_confidence: Mapped[float | None] = mapped_column(Float)
    objective_confidence: Mapped[float | None] = mapped_column(Float)
    assessment_confidence: Mapped[float | None] = mapped_column(Float)
    plan_confidence: Mapped[float | None] = mapped_column(Float)
    finalized: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    encounter: Mapped["Encounter"] = relationship(back_populates="soap_note")


class ICDCode(Base):
    __tablename__ = "icd_codes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    encounter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("encounters.id", ondelete="CASCADE")
    )
    code: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float)
    rationale: Mapped[str | None] = mapped_column(Text)
    approved: Mapped[bool] = mapped_column(Boolean, default=True)

    encounter: Mapped["Encounter"] = relationship(back_populates="icd_codes")


class VisitSummary(Base):
    __tablename__ = "visit_summaries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    encounter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("encounters.id", ondelete="CASCADE"), unique=True
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    follow_ups: Mapped[list] = mapped_column(JSONB, default=list)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    encounter: Mapped["Encounter"] = relationship(back_populates="visit_summary")

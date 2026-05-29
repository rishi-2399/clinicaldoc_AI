import json
from openai import AsyncOpenAI
from app.core.config import settings
from app.models.schemas import SOAPNoteBase

client = AsyncOpenAI(api_key=settings.openai_api_key)

_SYSTEM_PROMPT = (
    "You are a clinical documentation assistant. Given a doctor-patient conversation transcript, "
    "extract and generate a structured SOAP note. Be precise and clinically accurate. "
    "If information for a section is absent from the transcript, write 'Not documented'. "
    "Assign confidence scores (0.0–1.0) reflecting how clearly the transcript supports each section."
)

_RESPONSE_FORMAT = {
    "type": "json_schema",
    "json_schema": {
        "name": "soap_note",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "subjective": {"type": "string"},
                "objective": {"type": "string"},
                "assessment": {"type": "string"},
                "plan": {"type": "string"},
                "subjective_confidence": {"type": "number"},
                "objective_confidence": {"type": "number"},
                "assessment_confidence": {"type": "number"},
                "plan_confidence": {"type": "number"},
            },
            "required": [
                "subjective", "objective", "assessment", "plan",
                "subjective_confidence", "objective_confidence",
                "assessment_confidence", "plan_confidence",
            ],
            "additionalProperties": False,
        },
    },
}


async def generate_soap(transcript: str) -> SOAPNoteBase:
    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"Transcript:\n{transcript}"},
        ],
        response_format=_RESPONSE_FORMAT,
    )
    data = json.loads(response.choices[0].message.content)
    return SOAPNoteBase(**data)

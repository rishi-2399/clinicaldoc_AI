import json
from openai import AsyncOpenAI
from app.core.config import settings
from app.models.schemas import VisitSummaryBase, ICDCodeBase

client = AsyncOpenAI(api_key=settings.openai_api_key)

_RESPONSE_FORMAT = {
    "type": "json_schema",
    "json_schema": {
        "name": "visit_summary",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "summary": {"type": "string"},
                "follow_ups": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "action": {"type": "string"},
                            "timeframe": {"type": "string"},
                        },
                        "required": ["action", "timeframe"],
                        "additionalProperties": False,
                    },
                },
            },
            "required": ["summary", "follow_ups"],
            "additionalProperties": False,
        },
    },
}


async def generate_summary(soap: dict, icd_codes: list[ICDCodeBase]) -> VisitSummaryBase:
    icd_text = ", ".join(f"{c.code} ({c.description})" for c in icd_codes) or "None"
    user_content = (
        f"Subjective: {soap['subjective']}\n"
        f"Objective: {soap['objective']}\n"
        f"Assessment: {soap['assessment']}\n"
        f"Plan: {soap['plan']}\n\n"
        f"ICD-10 Codes: {icd_text}"
    )
    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a clinical documentation assistant. Write a concise 2–3 sentence "
                    "plain-language visit summary and list follow-up actions with timeframes. "
                    "Use an empty string for timeframe if none applies."
                ),
            },
            {"role": "user", "content": user_content},
        ],
        response_format=_RESPONSE_FORMAT,
    )
    data = json.loads(response.choices[0].message.content)
    return VisitSummaryBase(**data)

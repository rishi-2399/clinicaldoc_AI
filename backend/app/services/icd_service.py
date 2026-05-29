import asyncio
import json
import chromadb
from openai import AsyncOpenAI
from sentence_transformers import SentenceTransformer
from app.core.config import settings
from app.models.schemas import ICDCodeBase, ICDSearchResult

client = AsyncOpenAI(api_key=settings.openai_api_key)

_embedder: SentenceTransformer | None = None
_collection = None

_RERANK_FORMAT = {
    "type": "json_schema",
    "json_schema": {
        "name": "icd_suggestions",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "codes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "code": {"type": "string"},
                            "description": {"type": "string"},
                            "confidence": {"type": "number"},
                            "rationale": {"type": "string"},
                        },
                        "required": ["code", "description", "confidence", "rationale"],
                        "additionalProperties": False,
                    },
                }
            },
            "required": ["codes"],
            "additionalProperties": False,
        },
    },
}


def init_icd():
    global _embedder, _collection
    _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    chroma_client = chromadb.PersistentClient(path="data/chroma")
    _collection = chroma_client.get_collection("icd10")


def _vector_search(query: str, n: int) -> tuple[list[str], list[str], list[float]]:
    embedding = _embedder.encode(query).tolist()
    results = _collection.query(query_embeddings=[embedding], n_results=n)
    return results["ids"][0], results["documents"][0], results["distances"][0]


async def get_icd_suggestions(assessment: str, plan: str) -> list[ICDCodeBase]:
    query = f"{assessment} {plan}"
    ids, docs, _ = await asyncio.to_thread(_vector_search, query, 10)

    candidates = "\n".join(f"{code}: {desc}" for code, desc in zip(ids, docs))
    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a clinical coding specialist. Select the 3–5 most appropriate "
                    "ICD-10-CM codes from the candidates for the given clinical context. "
                    "Assign confidence scores (0.0–1.0) and a one-sentence rationale for each."
                ),
            },
            {
                "role": "user",
                "content": f"Assessment: {assessment}\nPlan: {plan}\n\nCandidates:\n{candidates}",
            },
        ],
        response_format=_RERANK_FORMAT,
    )
    data = json.loads(response.choices[0].message.content)
    return [ICDCodeBase(**item) for item in data["codes"]]


async def search_icd_direct(query: str, n: int = 10) -> list[ICDSearchResult]:
    ids, docs, distances = await asyncio.to_thread(_vector_search, query, n)
    return [
        ICDSearchResult(code=code, description=desc, score=round(1 - dist, 4))
        for code, desc, dist in zip(ids, docs, distances)
    ]

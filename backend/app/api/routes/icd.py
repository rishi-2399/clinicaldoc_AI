from fastapi import APIRouter, Query
from app.services.icd_service import search_icd_direct
from app.models.schemas import ICDSearchResult

router = APIRouter(prefix="/api/icd", tags=["icd"])


@router.get("/search", response_model=list[ICDSearchResult])
async def icd_search(q: str = Query(..., min_length=1), n: int = Query(10, ge=1, le=50)):
    return await search_icd_direct(q, n)

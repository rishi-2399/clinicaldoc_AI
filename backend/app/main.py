from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import encounters, icd
from app.services import transcription as transcription_svc
from app.services import icd_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    transcription_svc.init_model()
    icd_service.init_icd()
    yield


app = FastAPI(title="AI Clinical Documentation API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(encounters.router)
app.include_router(icd.router)

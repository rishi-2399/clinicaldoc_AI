import asyncio
import tempfile
import os
from faster_whisper import WhisperModel

_model: WhisperModel | None = None


def init_model():
    global _model
    if _model is None:
        _model = WhisperModel("base", device="cpu", compute_type="int8")


def _transcribe_sync(audio_bytes: bytes) -> str:
    with tempfile.NamedTemporaryFile(suffix=".audio", delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name
    try:
        segments, _ = _model.transcribe(tmp_path, vad_filter=True)
        return " ".join(seg.text.strip() for seg in segments)
    finally:
        os.unlink(tmp_path)


async def transcribe_audio(audio_bytes: bytes) -> str:
    return await asyncio.to_thread(_transcribe_sync, audio_bytes)

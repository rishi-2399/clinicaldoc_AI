from fastapi import Header, HTTPException
from typing import Optional
import jwt
from app.core.config import settings

DEMO_USER_ID = "demo-user"


async def get_current_user(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization:
        return DEMO_USER_ID
    try:
        token = authorization.removeprefix("Bearer ")
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

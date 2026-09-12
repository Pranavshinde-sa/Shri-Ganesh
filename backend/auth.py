import os
import time
import hmac
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_SECONDS = 60 * 60 * 12  # 12 hours

# The single admin account. Override these in a backend/.env file:
#   ADMIN_USERNAME=your_username
#   ADMIN_PASSWORD=your_password
#   SECRET_KEY=some_long_random_string
# Defaults are provided so it runs out of the box, but change them
# before you rely on this for anything sensitive.
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "changeme123")

# auto_error=False so read-only (GET) endpoints work with no token at all.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


def verify_credentials(username: str, password: str) -> bool:
    return hmac.compare_digest(username, ADMIN_USERNAME) and hmac.compare_digest(password, ADMIN_PASSWORD)


def create_access_token(username: str) -> str:
    payload = {"sub": username, "exp": int(time.time()) + TOKEN_EXPIRE_SECONDS}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_admin(token: str | None = Depends(oauth2_scheme)) -> str:
    """Dependency for write endpoints. Raises 401 unless a valid admin token is presented."""
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin login required for this action",
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired, please log in again",
        )
    if payload.get("sub") != ADMIN_USERNAME:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authorized")
    return payload["sub"]

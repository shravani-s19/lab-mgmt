""""Auth helpers: bcrypt password hashing + JWT issuance/verification."""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import smtplib
from email.mime.text import MIMEText
from db import main_db

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
JWT_ALG = "HS256"
JWT_EXP_HOURS = 24 * 7  # 7 days

RESET_SECRET = os.environ.get("RESET_SECRET", "reset-dev-secret")
RESET_EXP_MINUTES = 30

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://crce-lab-management.netlify.app")

bearer = HTTPBearer(auto_error=False)


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: int, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])


def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = decode_token(creds.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = int(payload["sub"])
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, email, name, role, roll_no, department, year FROM users WHERE id = %s",
            (user_id,),
        )
        cols = [d[0] for d in cur.description]
        raw = cur.fetchone()
        row = dict(zip(cols, raw)) if raw else None
    if not row:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return row


def require_role(*roles: str):
    def _dep(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return user

    return _dep

def create_reset_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=RESET_EXP_MINUTES),
    }
    return jwt.encode(payload, RESET_SECRET, algorithm=JWT_ALG)

def decode_reset_token(token: str) -> str:
    try:
        payload = jwt.decode(token, RESET_SECRET, algorithms=[JWT_ALG])
        return payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

def send_reset_email(to_email: str, token: str):
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    body = f"""Hello,

You requested a password reset for your CRCE Lab Manager account.

Click the link below to reset your password (valid for 30 minutes):
{reset_url}

If you did not request this, ignore this email.
"""
    msg = MIMEText(body)
    msg["Subject"] = "CRCE Lab Manager — Password Reset"
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(SMTP_USER, to_email, msg.as_string())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
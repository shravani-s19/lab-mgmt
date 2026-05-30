""""CRCE Lab Manager — FastAPI backend with SQLite multi-database architecture."""
from dotenv import load_dotenv
load_dotenv()
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

from db import init_main_db, main_db, lab_db, init_lab_db, lab_db_path, migrate_equipment_columns, migrate_lab_columns, dict_row, dict_rows, dict_row, dict_rows
from auth import (
    hash_password,
    verify_password,
    create_token,
    get_current_user,
    require_role,
)
from db import migrate_security_questions
migrate_security_questions()

from chatbot import chat_reply
from seed import run_seed
from fastapi import FastAPI, Depends, HTTPException, APIRouter, UploadFile, File
import tempfile, re
from fastapi.responses import StreamingResponse
import openpyxl, io

app = FastAPI(title="CRCE Lab Manager API")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SignupReq(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    roll_no: str
    department: str
    year: str
    security_q1: str = ""
    security_a1: str = ""
    security_q2: str = ""
    security_a2: str = ""


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class CreateAssistantReq(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    department: Optional[str] = None


class LabCreate(BaseModel):
    name: str
    location: str
    capacity: int = 0
    budget: float = 0
    department: Optional[str] = None
    assistant_id: Optional[int] = None
    incharge_name: Optional[str] = None  # ADD THIS
    incharge_id: Optional[int] = None

class LabBudgetUpdate(BaseModel):
    budget: float


class LabAssignAssistant(BaseModel):
    assistant_id: int


class EquipmentCreate(BaseModel):
    name: str
    category: Optional[str] = "general"
    description: Optional[str] = ""
    total_qty: int = 1
    cost: float = 0
    purchase_date: Optional[str] = None
    supplier_name: Optional[str] = None
    serial_no: Optional[str] = None
    remarks: Optional[str] = None


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    total_qty: Optional[int] = None
    status: Optional[str] = None
    cost: Optional[float] = None
    purchase_date: Optional[str] = None
    supplier_name: Optional[str] = None
    serial_no: Optional[str] = None
    remarks: Optional[str] = None


class RequestCreate(BaseModel):
    equipment_id: int
    quantity: int = 1
    purpose: Optional[str] = ""


class MaintenanceCreate(BaseModel):
    equipment_id: int
    description: str
    cost: float = 0


class ChatReq(BaseModel):
    message: str
    session_id: Optional[str] = None

class AssistantCreate(BaseModel):
    name: str
    email: str
    password: str
    department: Optional[str] = None
    role: Optional[str] = "ASSISTANT"

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyQuestionsRequest(BaseModel):
    email: str
    answer1: str
    answer2: str

class ResetPasswordRequest(BaseModel):
    email: str
    answer1: str
    answer2: str
    new_password: str


@app.on_event("startup")
def _startup():
    init_main_db()
    migrate_equipment_columns()
    migrate_lab_columns()  # ADD THIS
    run_seed()


@api.get("/")
def root():
    return {"message": "CRCE Lab Manager API", "status": "ok"}


@api.post("/auth/signup")
def signup(req: SignupReq):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM users WHERE email = %s", (req.email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        cur.execute(
            "INSERT INTO users (email, password_hash, name, role, roll_no, department, year, security_q1, security_a1, security_q2, security_a2) "
            "VALUES (%s, %s, %s, 'STUDENT', %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (req.email, hash_password(req.password), req.name, req.roll_no, req.department, req.year,
             req.security_q1, req.security_a1.strip().lower(), req.security_q2, req.security_a2.strip().lower()),
        )
        uid = cur.fetchone()[0]
    token = create_token(uid, "STUDENT")
    return {
        "token": token,
        "user": {
            "id": uid, "name": req.name, "email": req.email, "role": "STUDENT",
            "roll_no": req.roll_no, "department": req.department, "year": req.year,
        },
    }

@api.post("/auth/login")
def login(req: LoginReq):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, email, password_hash, name, role, roll_no, department, year FROM users WHERE email = %s",
            (req.email,),
        )
        row = dict_row(cur, cur.fetchone())
    if not row or not verify_password(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(row["id"], row["role"])
    row.pop("password_hash", None)
    return {"token": token, "user": row}


@api.get("/auth/me")
def me(user: dict = Depends(get_current_user)):
    return user

class UpdateProfileReq(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    roll_no: Optional[str] = None

class ChangePasswordReq(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6)

class SetSecurityQuestionsReq(BaseModel):
    security_q1: str
    security_a1: str
    security_q2: str
    security_a2: str

@api.put("/users/me")
def update_profile(req: UpdateProfileReq, user: dict = Depends(get_current_user)):
    fields, values = [], []
    if req.name is not None: fields.append("name = %s"); values.append(req.name)
    if req.department is not None: fields.append("department = %s"); values.append(req.department)
    if req.year is not None: fields.append("year = %s"); values.append(req.year)
    if req.roll_no is not None: fields.append("roll_no = %s"); values.append(req.roll_no)
    if not fields:
        raise HTTPException(status_code=400, detail="Nothing to update")
    values.append(user["id"])
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = %s", values)
    return {"message": "Profile updated"}

@api.put("/users/me/password")
def change_password(req: ChangePasswordReq, user: dict = Depends(get_current_user)):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT password_hash FROM users WHERE id = %s", (user["id"],))
        row = dict_row(cur, cur.fetchone())
        if not verify_password(req.old_password, row["password_hash"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s",
                     (hash_password(req.new_password), user["id"]))
    return {"message": "Password changed successfully"}

@api.put("/users/me/security-questions")
def set_security_questions(req: SetSecurityQuestionsReq, user: dict = Depends(get_current_user)):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET security_q1=%s, security_a1=%s, security_q2=%s, security_a2=%s WHERE id=%s",
            (req.security_q1, req.security_a1.strip().lower(),
             req.security_q2, req.security_a2.strip().lower(), user["id"])
        )
    return {"message": "Security questions saved"}

@api.get("/users/me/security-questions-status")
def security_questions_status(user: dict = Depends(get_current_user)):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT security_q1 FROM users WHERE id = %s", (user["id"],))
        row = dict_row(cur, cur.fetchone())
    return {"has_security_questions": bool(row and row["security_q1"])}

@api.get("/auth/security-questions")
def get_security_questions(email: str):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT security_q1, security_q2 FROM users WHERE email = %s", (email,))
        row = dict_row(cur, cur.fetchone())
    if not row or not row["security_q1"]:
        raise HTTPException(status_code=404, detail="No security questions found for this account")
    return {"q1": row["security_q1"], "q2": row["security_q2"]}

@api.post("/auth/reset-password")
def reset_password(body: ResetPasswordRequest):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT security_a1, security_a2 FROM users WHERE email = %s", (body.email,))
        row = dict_row(cur, cur.fetchone())
        if not row:
            raise HTTPException(status_code=404, detail="Account not found")
        if not row["security_a1"] or not row["security_a2"]:
            raise HTTPException(status_code=400, detail="No security questions set for this account")
        if (body.answer1.strip().lower() != row["security_a1"].strip().lower() or
            body.answer2.strip().lower() != row["security_a2"].strip().lower()):
            raise HTTPException(status_code=400, detail="One or more answers are incorrect")
        if len(body.new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        new_hash = hash_password(body.new_password)
        cur.execute("UPDATE users SET password_hash = %s WHERE email = %s", (new_hash, body.email))
    return {"message": "Password reset successful"}

@api.post("/admin/create-assistant")
def create_assistant(body: AssistantCreate, _admin: dict = Depends(require_role("ADMIN"))):
    role = getattr(body, "role", "ASSISTANT") or "ASSISTANT"
    if role not in ("ASSISTANT", "INCHARGE"):
        role = "ASSISTANT"
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (email, password_hash, name, role, department) VALUES (%s, %s, %s, %s, %s)",
            (body.email, hash_password(body.password), body.name, role, body.department),
        )
    return {"ok": True}

@api.get("/admin/assistants")
def list_assistants(_admin: dict = Depends(require_role("ADMIN"))):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, role, department FROM users WHERE role IN ('ASSISTANT','INCHARGE') ORDER BY id")
        rows = dict_rows(cur, cur.fetchall())
    return rows

@api.delete("/admin/users/{user_id}")
def delete_user(user_id: int, _admin: dict = Depends(require_role("ADMIN"))):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
        row = dict_row(cur, cur.fetchone())
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        if row["role"] == "ADMIN":
            raise HTTPException(status_code=403, detail="Cannot delete admin")
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    return {"deleted": user_id}

@api.get("/admin/users")
def list_users(_admin: dict = Depends(require_role("ADMIN"))):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, role, roll_no, department, year, created_at FROM users ORDER BY id")
        rows = dict_rows(cur, cur.fetchall())
    return rows


@api.get("/labs")
def list_labs(user: dict = Depends(get_current_user)):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT l.id, l.name, l.location, l.capacity, l.budget, l.department, "
            "l.db_name, l.assistant_id, l.incharge_id, l.created_at, "
            "u.name AS assistant_name, i.name AS incharge_name "
            "FROM labs l "
            "LEFT JOIN users u ON u.id = l.assistant_id "
            "LEFT JOIN users i ON i.id = l.incharge_id "
            "ORDER BY l.id"
        )
        rows = dict_rows(cur, cur.fetchall())
    return rows


@api.get("/labs/{lab_id}")
def get_lab(lab_id: int, user: dict = Depends(get_current_user)):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT l.id, l.name, l.location, l.capacity, l.budget, l.department, "
            "l.db_name, l.assistant_id, l.incharge_id, l.created_at, "
            "u.name AS assistant_name, i.name AS incharge_name "
            "FROM labs l "
            "LEFT JOIN users u ON u.id = l.assistant_id "
            "LEFT JOIN users i ON i.id = l.incharge_id "
            "WHERE l.id = %s", (lab_id,)
        )
        row = dict_row(cur, cur.fetchone())
    if not row:
        raise HTTPException(status_code=404, detail="Lab not found")
    return row


@api.post("/admin/labs")
def create_lab(req: LabCreate, _admin: dict = Depends(require_role("ADMIN"))):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO labs (name, location, capacity, budget, department, db_name, assistant_id, incharge_id) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (req.name, req.location, req.capacity, req.budget, req.department, "pending", req.assistant_id, req.incharge_id),
        )
        lab_id = cur.fetchone()[0]
        cur.execute("UPDATE labs SET db_name = %s WHERE id = %s", (f"lab_{lab_id}", lab_id))
    init_lab_db(lab_id)
    return {"id": lab_id, "name": req.name, "db_name": f"lab_{lab_id}"}


@api.put("/admin/labs/{lab_id}/budget")
def set_lab_budget(lab_id: int, req: LabBudgetUpdate, _admin: dict = Depends(require_role("ADMIN"))):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM labs WHERE id = %s", (lab_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Lab not found")
        cur.execute("UPDATE labs SET budget = %s WHERE id = %s", (req.budget, lab_id))
    return {"id": lab_id, "budget": req.budget}


@api.put("/admin/labs/{lab_id}/assign-assistant")
def assign_assistant(lab_id: int, req: LabAssignAssistant, _admin: dict = Depends(require_role("ADMIN"))):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE id = %s AND role = 'ASSISTANT'", (req.assistant_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=400, detail="Assistant not found")
        conn.execute("UPDATE labs SET assistant_id = ? WHERE id = ?", (req.assistant_id, lab_id))
    return {"id": lab_id, "assistant_id": req.assistant_id}

class LabAssignIncharge(BaseModel):
    incharge_id: int

@api.put("/admin/labs/{lab_id}/assign-incharge")
def assign_incharge(lab_id: int, req: LabAssignIncharge, _admin: dict = Depends(require_role("ADMIN"))):
    with main_db() as conn:
        u = cur.execute("SELECT id FROM users WHERE id = %s AND role = 'INCHARGE'", (req.incharge_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=400, detail="Incharge user not found")
        cur.execute("UPDATE labs SET incharge_id = %s WHERE id = %s", (req.incharge_id, lab_id))
    return {"id": lab_id, "incharge_id": req.incharge_id}

@api.delete("/admin/labs/{lab_id}")
def delete_lab(lab_id: int, _admin: dict = Depends(require_role("ADMIN"))):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM labs WHERE id = %s", (lab_id,))
    return {"deleted": lab_id}

@api.post("/admin/labs/{lab_id}/import-registry")
async def import_registry(lab_id: int, file: UploadFile = File(...), _admin: dict = Depends(require_role("ADMIN"))):
    import pdfplumber, openpyxl
    suffix = file.filename.split(".")[-1].lower()
    contents = await file.read()
    rows = []

    with tempfile.NamedTemporaryFile(suffix=f".{suffix}", delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    if suffix == "pdf":
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table[1:]:  # skip header
                        if not row or not row[1]:
                            continue
                        try:
                            rows.append({
                                "name": str(row[1]).strip(),
                                "total_qty": int(re.sub(r"[^\d]", "", str(row[2])) or 1),
                                "purchase_date": str(row[3]).strip() if row[3] else None,
                                "supplier_name": str(row[4]).strip() if row[4] else None,
                                "serial_no": str(row[5]).strip() if row[5] else None,
                                "cost": float(re.sub(r"[^\d.]", "", str(row[6])) or 0),
                                "remarks": str(row[7]).strip() if len(row) > 7 and row[7] else None,
                            })
                        except:
                            continue

    elif suffix in ("xlsx", "xls"):
        wb = openpyxl.load_workbook(tmp_path, data_only=True)
        ws = wb.active
        for row in list(ws.iter_rows(values_only=True))[1:]:
            if not row[1]:
                continue
            try:
                rows.append({
                    "name": str(row[1]).strip(),
                    "total_qty": int(row[2] or 1),
                    "purchase_date": str(row[3]) if row[3] else None,
                    "supplier_name": str(row[4]) if row[4] else None,
                    "serial_no": str(row[5]) if row[5] else None,
                    "cost": float(row[6] or 0),
                    "remarks": str(row[7]) if len(row) > 7 and row[7] else None,
                })
            except:
                continue
    else:
        raise HTTPException(status_code=400, detail="Only PDF or Excel files supported")

    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        for r in rows:
            cur.execute(
                f"INSERT INTO equipment_{lab_id} (name, total_qty, available_qty, cost, purchase_date, supplier_name, serial_no, remarks, status) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'AVAILABLE')",
                (r["name"], r["total_qty"], r["total_qty"], r["cost"],
                 r["purchase_date"], r["supplier_name"], r["serial_no"], r["remarks"])
            )
    return {"imported": len(rows)}

@api.get("/admin/labs/{lab_id}/export")
def export_lab_registry(lab_id: int, _admin: dict = Depends(require_role("ADMIN"))):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM labs WHERE id = %s", (lab_id,))
        lab = dict_row(cur, cur.fetchone())
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM equipment_{lab_id} ORDER BY id")
        items = dict_rows(cur, cur.fetchall())

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = lab["name"]
    ws.append(["Sr.No", "Description", "Quantity", "Purchase Date", 
                "Supplier", "Serial No", "Cost (₹)", "Status", "Remarks"])
    for i, it in enumerate(items, 1):
        ws.append([i, it["name"], it["total_qty"], it["purchase_date"],
                   it["supplier_name"], it["serial_no"], it["cost"],
                   it["status"], it["remarks"]])

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"{lab['name'].replace(' ', '_')}_registry.xlsx"
    return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                             headers={"Content-Disposition": f"attachment; filename={filename}"})

def _ensure_assistant_for_lab(lab_id: int, user: dict):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM labs WHERE id = %s", (lab_id,))
        lab = dict_row(cur, cur.fetchone())
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    if user["role"] == "ADMIN":
        return
    if user["role"] == "INCHARGE" and lab["incharge_id"] == user["id"]:
        return
    if user["role"] == "ASSISTANT" and lab["assistant_id"] == user["id"]:
        return
    raise HTTPException(status_code=403, detail="Not your lab")

@api.get("/labs/{lab_id}/equipment")
def list_equipment(lab_id: int, user: dict = Depends(get_current_user)):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM labs WHERE id = %s", (lab_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Lab not found")
    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM equipment_{lab_id} ORDER BY id DESC")
        rows = dict_rows(cur, cur.fetchall())
    return rows


@api.post("/labs/{lab_id}/equipment")
def add_equipment(lab_id: int, req: EquipmentCreate, user: dict = Depends(get_current_user)):
    _ensure_assistant_for_lab(lab_id, user)
    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO equipment_{lab_id} (name, category, description, total_qty, available_qty, cost, status) "
            f"VALUES (%s, %s, %s, %s, %s, %s, 'AVAILABLE') RETURNING id",
            (req.name, req.category, req.description, req.total_qty, req.total_qty, req.cost),
        )
        eid = cur.fetchone()[0]
        cur.execute(f"SELECT * FROM equipment_{lab_id} WHERE id = %s", (eid,))
        row = dict_row(cur, cur.fetchone())
    return row


@api.put("/labs/{lab_id}/equipment/{eid}")
def update_equipment(lab_id: int, eid: int, req: EquipmentUpdate, user: dict = Depends(get_current_user)):
    _ensure_assistant_for_lab(lab_id, user)
    fields = {k: v for k, v in req.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM equipment_{lab_id} WHERE id = %s", (eid,))
        existing = dict_row(cur, cur.fetchone())
        if not existing:
            raise HTTPException(status_code=404, detail="Equipment not found")
        if "total_qty" in fields:
            issued = existing["total_qty"] - existing["available_qty"]
            new_total = max(fields["total_qty"], issued)
            fields["total_qty"] = new_total
            fields["available_qty"] = max(0, new_total - issued)
        sets = ", ".join(f"{k} = %s" for k in fields.keys())
        vals = list(fields.values()) + [eid]
        cur.execute(f"UPDATE equipment_{lab_id} SET {sets} WHERE id = %s", vals)
        cur.execute(f"SELECT * FROM equipment_{lab_id} WHERE id = %s", (eid,))
        row = dict_row(cur, cur.fetchone())
    return dict(row)


@api.delete("/labs/{lab_id}/equipment/{eid}")
def delete_equipment(lab_id: int, eid: int, user: dict = Depends(get_current_user)):
    _ensure_assistant_for_lab(lab_id, user)
    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        cur.execute(f"DELETE FROM equipment_{lab_id} WHERE id = %s", (eid,))
    return {"deleted": eid}


@api.post("/labs/{lab_id}/requests")
def create_request(lab_id: int, req: RequestCreate, user: dict = Depends(require_role("STUDENT"))):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM labs WHERE id = %s", (lab_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Lab not found")
    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM equipment_{lab_id} WHERE id = %s", (req.equipment_id,))
        eq = dict_row(cur, cur.fetchone())
        if not eq:
            raise HTTPException(status_code=404, detail="Equipment not found")
        if eq["available_qty"] < req.quantity:
            raise HTTPException(status_code=400, detail="Not enough quantity available")
        cur.execute(
            f"INSERT INTO requests_{lab_id} (equipment_id, student_id, student_name, student_email, quantity, purpose, status) "
            f"VALUES (%s, %s, %s, %s, %s, %s, 'PENDING') RETURNING id",
            (req.equipment_id, user["id"], user["name"], user["email"], req.quantity, req.purpose),
        )
        rid = cur.fetchone()[0]
        cur.execute(f"SELECT * FROM requests_{lab_id} WHERE id = %s", (rid,))
        row = dict_row(cur, cur.fetchone())
    return row


@api.get("/labs/{lab_id}/requests")
def list_requests(lab_id: int, user: dict = Depends(get_current_user)):
    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        if user["role"] == "STUDENT":
            cur.execute(
                f"SELECT r.*, e.name AS equipment_name FROM requests_{lab_id} r "
                f"LEFT JOIN equipment_{lab_id} e ON e.id = r.equipment_id WHERE r.student_id = %s ORDER BY r.id DESC",
                (user["id"],),
            )
        else:
            cur.execute(
                f"SELECT r.*, e.name AS equipment_name FROM requests_{lab_id} r "
                f"LEFT JOIN equipment_{lab_id} e ON e.id = r.equipment_id ORDER BY r.id DESC"
            )
        rows = dict_rows(cur, cur.fetchall())
    return rows


@api.put("/labs/{lab_id}/requests/{rid}/approve")
def approve_request(lab_id: int, rid: int, user: dict = Depends(get_current_user)):
    _ensure_assistant_for_lab(lab_id, user)
    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM requests_{lab_id} WHERE id = %s", (rid,))
        r = dict_row(cur, cur.fetchone())
        if not r:
            raise HTTPException(status_code=404, detail="Request not found")
        if r["status"] != "PENDING":
            raise HTTPException(status_code=400, detail="Request not pending")
        cur.execute(f"SELECT * FROM equipment_{lab_id} WHERE id = %s", (r["equipment_id"],))
        eq = dict_row(cur, cur.fetchone())
        if eq["available_qty"] < r["quantity"]:
            raise HTTPException(status_code=400, detail="Not enough available")
        due = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        cur.execute(
            f"UPDATE requests_{lab_id} SET status = 'ISSUED', approved_at = NOW(), due_date = %s WHERE id = %s",
            (due, rid),
        )
        cur.execute(
            f"UPDATE equipment_{lab_id} SET available_qty = available_qty - %s WHERE id = %s",
            (r["quantity"], r["equipment_id"]),
        )
    return {"id": rid, "status": "ISSUED", "due_date": due}


@api.put("/labs/{lab_id}/requests/{rid}/reject")
def reject_request(lab_id: int, rid: int, user: dict = Depends(get_current_user)):
    _ensure_assistant_for_lab(lab_id, user)
    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM requests_{lab_id} WHERE id = %s", (rid,))
        r = dict_row(cur, cur.fetchone())
        if not r or r["status"] != "PENDING":
            raise HTTPException(status_code=400, detail="Cannot reject")
        cur.execute(f"UPDATE requests_{lab_id} SET status = 'REJECTED' WHERE id = %s", (rid,))
    return {"id": rid, "status": "REJECTED"}


@api.put("/labs/{lab_id}/requests/{rid}/return")
def return_request(lab_id: int, rid: int, user: dict = Depends(get_current_user)):
    _ensure_assistant_for_lab(lab_id, user)
    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM requests_{lab_id} WHERE id = %s", (rid,))
        r = dict_row(cur, cur.fetchone())
        if not r or r["status"] != "ISSUED":
            raise HTTPException(status_code=400, detail="Not an issued request")
        cur.execute(
            f"UPDATE requests_{lab_id} SET status = 'RETURNED', returned_at = NOW() WHERE id = %s", (rid,)
        )
        cur.execute(
            f"UPDATE equipment_{lab_id} SET available_qty = available_qty + %s WHERE id = %s",
            (r["quantity"], r["equipment_id"]),
        )
    return {"id": rid, "status": "RETURNED"}


@api.get("/labs/{lab_id}/maintenance")
def list_maintenance(lab_id: int, user: dict = Depends(get_current_user)):
    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        cur.execute(
            f"SELECT m.*, e.name AS equipment_name FROM maintenance_{lab_id} m "
            f"LEFT JOIN equipment_{lab_id} e ON e.id = m.equipment_id ORDER BY m.id DESC"
        )
        rows = dict_rows(cur, cur.fetchall())
    return rows


@api.post("/labs/{lab_id}/maintenance")
def add_maintenance(lab_id: int, req: MaintenanceCreate, user: dict = Depends(get_current_user)):
    _ensure_assistant_for_lab(lab_id, user)
    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM equipment_{lab_id} WHERE id = %s", (req.equipment_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Equipment not found")
        cur.execute(
            f"INSERT INTO maintenance_{lab_id} (equipment_id, description, cost, status) VALUES (%s, %s, %s, 'IN_PROGRESS') RETURNING id",
            (req.equipment_id, req.description, req.cost),
        )
        mid = cur.fetchone()[0]
        cur.execute(f"UPDATE equipment_{lab_id} SET status = 'MAINTENANCE' WHERE id = %s", (req.equipment_id,))
    return {"id": mid, "status": "IN_PROGRESS"}


@api.put("/labs/{lab_id}/maintenance/{mid}/complete")
def complete_maintenance(lab_id: int, mid: int, user: dict = Depends(get_current_user)):
    _ensure_assistant_for_lab(lab_id, user)
    with lab_db(lab_id) as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM maintenance_{lab_id} WHERE id = %s", (mid,))
        m = dict_row(cur, cur.fetchone())
        if not m:
            raise HTTPException(status_code=404, detail="Not found")
        cur.execute(
            f"UPDATE maintenance_{lab_id} SET status = 'COMPLETED', completed_at = NOW() WHERE id = %s", (mid,)
        )
        cur.execute(f"UPDATE equipment_{lab_id} SET status = 'AVAILABLE' WHERE id = %s", (m["equipment_id"],))
    return {"id": mid, "status": "COMPLETED"}


@api.get("/students/me/borrowed")
def my_borrowed(user: dict = Depends(require_role("STUDENT"))):
    out = []
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM labs")
        labs = dict_rows(cur, cur.fetchall())
    for lab in labs:
        try:
            with lab_db(lab["id"]) as conn:
                cur = conn.cursor()
                cur.execute(
                    f"SELECT r.*, e.name AS equipment_name FROM requests_{lab['id']} r "
                    f"LEFT JOIN equipment_{lab['id']} e ON e.id = r.equipment_id "
                    f"WHERE r.student_id = %s ORDER BY r.id DESC",
                    (user["id"],),
                )
                rows = dict_rows(cur, cur.fetchall())
            for r in rows:
                r["lab_id"] = lab["id"]
                r["lab_name"] = lab["name"]
                out.append(r)
        except Exception:
            continue
    return out


@api.get("/admin/analytics")
def analytics(_admin: dict = Depends(require_role("ADMIN"))):
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, name, budget FROM labs")
        labs = dict_rows(cur, cur.fetchall())
        cur.execute("SELECT role, COUNT(*) AS c FROM users GROUP BY role")
        users = dict_rows(cur, cur.fetchall())
    per_lab = []
    total_equipment = 0
    total_issued = 0
    total_pending_requests = 0
    for lab in labs:
        try:
            with lab_db(lab["id"]) as conn:
                cur = conn.cursor()
                cur.execute(
                    f"SELECT COUNT(*) AS c, COALESCE(SUM(total_qty),0) AS total, "
                    f"COALESCE(SUM(total_qty - available_qty),0) AS issued, "
                    f"COALESCE(SUM(cost*total_qty),0) AS spend FROM equipment_{lab['id']}"
                )
                eq = dict_row(cur, cur.fetchone())
                cur.execute(f"SELECT COUNT(*) AS c FROM requests_{lab['id']} WHERE status = 'PENDING'")
                pending = dict_row(cur, cur.fetchone())["c"]
            per_lab.append({
                "lab_id": lab["id"], "lab_name": lab["name"], "budget": lab["budget"],
                "spend": eq["spend"], "equipment_count": eq["c"],
                "total_units": eq["total"], "issued_units": eq["issued"],
                "pending_requests": pending,
            })
            total_equipment += eq["total"]
            total_issued += eq["issued"]
            total_pending_requests += pending
        except Exception:
            continue
    return {
        "users": {row["role"]: row["c"] for row in users},
        "totals": {
            "labs": len(labs),
            "equipment_units": total_equipment,
            "issued_units": total_issued,
            "pending_requests": total_pending_requests,
        },
        "per_lab": per_lab,
    }


@api.post("/chatbot")
async def chatbot(req: ChatReq, user: dict = Depends(get_current_user)):
    sid = req.session_id or f"user-{user['id']}-{uuid.uuid4().hex[:8]}"
    try:
        reply = await chat_reply(sid, req.message, user_name=user["name"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {e}")
    return {"session_id": sid, "reply": reply}


app.include_router(api)

import os
import asyncio
import google.generativeai as genai
from db import main_db, lab_db, dict_rows

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")

def _build_context():
    try:
        with main_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id, name, location, department, capacity FROM labs")
            labs = dict_rows(cur, cur.fetchall())

        if not labs:
            return "No labs are currently registered in the system."

        lines = []
        for lab in labs:
            try:
                with lab_db(lab["id"]) as conn:
                    cur = conn.cursor()
                    cur.execute(
                        f"SELECT name, category, total_qty, available_qty, status "
                        f"FROM equipment_{lab['id']} ORDER BY name"
                    )
                    equipment = dict_rows(cur, cur.fetchall())
                eq_lines = []
                for e in equipment:
                    eq_lines.append(
                        f"  - {e['name']} ({e['category']}): {e['available_qty']}/{e['total_qty']} available, status={e['status']}"
                    )
                eq_text = "\n".join(eq_lines) if eq_lines else "  No equipment yet."
                lines.append(
                    f"Lab: {lab['name']} | Location: {lab['location']} | "
                    f"Department: {lab['department']} | Capacity: {lab['capacity']}\n{eq_text}"
                )
            except Exception:
                lines.append(f"Lab: {lab['name']} | Location: {lab['location']}")

        return "\n\n".join(lines)
    except Exception as e:
        return f"Could not fetch lab data: {e}"

async def chat_reply(session_id, message, user_name="Student"):
    context = _build_context()

    prompt = f"""You are CRCE Bot, the helpful assistant for CRCE Lab Manager system at Fr. Conceicao Rodrigues College of Engineering (FRCRCE).

You help students, assistants, and admins with:
- Finding which lab has specific equipment
- Checking equipment availability
- Explaining how to request equipment
- General lab information

Here is the LIVE data from the system right now:

{context}

Guidelines:
- Be concise and helpful
- If equipment is not available say so clearly
- For requests, tell students to go to Browse Labs, select the lab, and request equipment
- If asked something outside lab management, politely redirect
- Address the user as {user_name}

User message: {message}"""

    response = await asyncio.to_thread(
        model.generate_content, prompt
    )
    return response.text
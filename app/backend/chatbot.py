import os
import json
import requests
from dotenv import load_dotenv
from db import main_db, lab_db

load_dotenv()

# We use 'auto' to let OpenRouter pick a working free model automatically
API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = "openrouter/auto" 

def _build_context():
    try:
        with main_db() as conn:
            labs = conn.execute("SELECT name, location FROM labs").fetchall()
            return "Live Lab Data: " + ", ".join([f"{l['name']} is at {l['location']}" for l in labs])
    except:
        return "Lab info: FRCRCE Labs available."

async def chat_reply(session_id, message, user_name="Student"):
    if not API_KEY:
        return "Error: OPENROUTER_API_KEY not found in backend/.env"

    context = _build_context()
    
    # These headers are MANDATORY for OpenRouter free tier
    headers = {
        "Authorization": f"Bearer {API_KEY.strip()}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173", 
        "X-Title": "CRCE Lab Manager",
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": f"You are CRCE Bot. {context}. Help the student concisely."},
            {"role": "user", "content": message}
        ]
    }

    try:
        # 1. First Attempt
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            data=json.dumps(payload),
            timeout=15
        )
        
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        
        # 2. Safety Net: If 'auto' fails, try one more specific known-good model
        print(f"Primary failed ({response.status_code}), trying backup...")
        payload["model"] = "google/gemini-2.0-flash-lite-preview-02-05:free"
        
        backup_res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            data=json.dumps(payload),
            timeout=15
        )

        if backup_res.status_code == 200:
            return backup_res.json()['choices'][0]['message']['content']
        else:
            return f"API Error {backup_res.status_code}: Please check your OpenRouter credits or key."

    except Exception as e:
        print(f"Request Error: {e}")
        return "Connection issue. Please restart your backend server and try again."
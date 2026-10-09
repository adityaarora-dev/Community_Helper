# Intelligent Community Resource Chatbot

Express + Supabase PostgreSQL (IPv4 Session Pooler) + React dashboard for deterministic welfare scheme matching.

## Structure
```
DB_PROJECT/
├── backend/    # Express server, pg pool, and DB migration
├── frontend/   # React + Vite dashboard
├── README.md   # Quickstart guide
├── agent.md    # Architecture, SQL matching logic, & AI roadmap
└── progress.md # Task execution log
```

---

## Quickstart

### 1. Check or Initialize Database
```bash
cd backend

# Inspect tables, columns, rows & location:
npm run db:check

# Seed / re-initialize tables:
npm run db:init
```

### 2. Start Backend Server
```bash
cd backend
npm run dev
```
* **URL**: `http://localhost:5000` | **Health**: `http://localhost:5000/health`

### 3. Start React Frontend
In a separate terminal:
```bash
cd frontend
npm run dev
```
* **URL**: `http://localhost:3000`

---

## Demo Citizen Credentials (Ready to Test)
Use these pre-seeded accounts to sign in via the **Citizen Sign In** modal:

| Citizen Name | Email (ID) | Password | Profile Demographics |
| :--- | :--- | :--- | :--- |
| **Ramesh Kumar** | `citizen@example.com` | `Citizen@123` | Farmer, North Zone, Income ₹1,80,000, 3 Members, 2.0 Acres |
| **Sunita Devi** | `vendor@example.com` | `Citizen@123` | Street Vendor, Central Zone, Income ₹1,20,000, 4 Members |

*(Or click "Register" in the modal to create any new citizen account)*

---

## Database Location & Tables (Supabase)
* **Location**: Host `aws-0-ap-northeast-2.pooler.supabase.com:5432` > Database `postgres` > Schema `public`
* **Dashboard View**: [Supabase Table Editor](https://supabase.com/dashboard/project/jluaxwcdyyvmmazrhjqv/editor)
* **Tables**:
  * `govt_schemes`: Welfare schemes & documents.
  * `eligibility_rules`: Income, age, gender, occupation, family size, disability, land limits.
  * `service_centers`: Facilitation centers by zone.
  * `users`: Citizen demographic profiles & auth credentials.
  * `user_interactions`: Chat logs & matched scheme IDs.

---

## AI Architecture & Gemini API Key
Powered by Google GenAI SDK (`@google/genai`):
* **Key Role**: Powers unstructured language understanding, strict JSON demographic extraction, multi-turn conversational follow-up questions, and grounded benefit explanations.
* **Deterministic Relational Guardrail**: The LLM NEVER generates SQL queries. It only extracts demographic JSON parameters, which the backend safely maps to parameterized SQL (`$1..$8`).
* **Models**: Primary `gemini-3.5-flash` with fallback to `gemini-3.8-flash` and rule-based heuristic parser.

---

## Roadmap (What More to Go)
1. Scheme bookmarking & application status tracker.
2. Document verification & upload via Supabase Storage.
3. Multilingual voice/text support (Hindi, regional languages).
4. Cloud deployment (Vercel + Render).

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

### 1. Initialize & Seed Database (Run Once)
```bash
cd backend
npm run db:init
```
* Seeds 7 government schemes, 7 eligibility rules, and 5 service centers.

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

## Database Architecture
* **`users`**: Demographic records.
* **`govt_schemes`**: Welfare schemes & required documents.
* **`eligibility_rules`**: Income, age, gender, occupation, family size, disability, and landholding rules.
* **`service_centers`**: Facilitation centers by zone.
* **`user_interactions`**: Chat logs & matched scheme IDs.

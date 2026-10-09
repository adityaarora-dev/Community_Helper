# Supabase + Express + React Fullstack

A clean fullstack project connecting Express to Supabase PostgreSQL (IPv4 Session Pooler) with a React dashboard.

## Structure
```
DB_PROJECT/
├── backend/    # Express server & Supabase pg pool
├── frontend/   # React + Vite dashboard
├── README.md   # Quickstart guide
├── agent.md    # Architecture & constraints
└── progress.md # Tasks & verification log
```

---

## Quickstart

### 1. Run Backend
```bash
cd backend
npm run dev
```
* **Terminal output**:
  ```text
  🚀 Express server running on http://localhost:5000
  ✅ [Database Connected] Successfully connected to Supabase PostgreSQL database 'postgres'
  ```

### 2. Run React Frontend
In a new terminal:
```bash
cd frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Verify Connection Messages

* **In Browser / Frontend**: Visit `http://localhost:3000` or `http://localhost:5000/health`.
* **On Router**: Returns HTTP 200:
  ```json
  { "status": "success", "message": "Database connection successful and healthy!" }
  ```
* **In Backend Terminal**: Logs on every request:
  ```text
  [HTTP] GET /health
  ✅ [Health Check Success] Supabase PostgreSQL database 'postgres' ping successful (...)
  ```

---

## Teammate Setup
1. Clone the repository.
2. In `backend/`, copy `.env.example` to `.env`.
3. Paste the provided `DATABASE_URL` (Port 5432).
4. Run `npm install` in both `backend` and `frontend`.

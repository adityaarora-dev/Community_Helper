# AI Agent Context & System Architecture

## Project Purpose
Intelligent Community Resource Chatbot connecting citizens to government welfare schemes via **deterministic relational SQL filtering** based on demographic constraints extracted by Google Gemini LLM.

---

## Current Architecture & State

### 1. Database Schema (Supabase PostgreSQL - Port 5432)
* **Location**: Host `aws-0-ap-northeast-2.pooler.supabase.com:5432` > DB `postgres` > Schema `public`.
* **`users`**: Auth credentials (email, hashed password) + Demographics (income, age, gender, occupation, family size, disability, landholding).
* **`govt_schemes`**: 7 pre-seeded welfare schemes (PMAY, PM-Kisan, Ayushman Bharat, etc.).
* **`eligibility_rules`**: Relational constraints (`max_income`, `min_age`, `max_age`, `target_gender`, `target_occupation`, `requires_disability`, `max_landholding`).
* **`service_centers`**: 5 civic facilitation centers across North, South, East, West, and Central zones.
* **`user_interactions`**: Logs `user_id`, raw query, extracted JSON payload, and matched scheme UUIDs.

### 2. Full-Stack Endpoints & Demo Credentials
* **Demo Citizen Credentials (Pre-seeded in DB)**:
  * `citizen@example.com` / `Citizen@123` (Ramesh Kumar, Farmer, North Zone)
  * `vendor@example.com` / `Citizen@123` (Sunita Devi, Street Vendor, Central Zone)
* **Auth & Profile Endpoints**:
  * `POST /api/users/register`: Register with password hashing (`bcryptjs`) and JWT token.
  * `POST /api/users/login`: Authenticate citizen credentials.
  * `GET /api/users/profile/:userId` & `PUT /api/users/profile/:userId`: Profile & demographic persistence.
* **Conversational AI & Matching**:
  * `POST /api/chat`: Multi-turn conversational flow via Gemini with parameter extraction and deterministic relational SQL matching.
* **Catalog**:
  * `GET /api/schemes`: All government schemes with eligibility rules.
  * `GET /api/service-centers`: Facilitation help desks (filterable by `?zone=`).
  * `GET /health`: Health and connection pool status.

### 3. Frontend Architecture (React + Tailwind v4 + Framer Motion)
* **Tabs**:
  * `AI Assistant`: Multi-turn conversational dialogue with live matched schemes.
  * `Demographic Intake`: Interactive citizen profile form (income, age, family size, zone, occupation, disability).
  * `All Schemes`: Searchable catalog with documentation checklists.
  * `Service Centers`: Local civic desks by zone with contact numbers.
* **Auth**: Glassmorphic modal with localStorage JWT persistence.

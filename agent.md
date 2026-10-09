# AI Agent Context & System Architecture

## Project Purpose
Intelligent Community Resource Chatbot connecting citizens to government welfare schemes via **deterministic relational SQL filtering** based on demographic constraints extracted by an LLM.

---

## Current Architecture & State

### 1. Database Schema (Supabase PostgreSQL - Port 5432)
* **`users`**: Demographics (income, age, gender, occupation, family size, disability, landholding).
* **`govt_schemes`**: 7 pre-seeded welfare schemes (PMAY, PM-Kisan, Ayushman Bharat, etc.).
* **`eligibility_rules`**: Relational filtering constraints (`max_income`, `min_age`, `max_age`, `target_gender`, `target_occupation`, `requires_disability`, `max_landholding`).
* **`service_centers`**: 5 civic facilitation centers across North, South, East, West, and Central zones.
* **`user_interactions`**: Logs raw user query, extracted LLM JSON payload, and matched scheme UUIDs.

### 2. Execution Scripts
* **Run DB Migration & Seed**:
  ```bash
  cd backend && npm run db:init
  ```
* **Run Backend Server**: `npm run dev` (Port 5000)
* **Run React Frontend**: `npm run dev` (Port 3000)

---

## Deterministic SQL Filtering Engine (Core Logic)

```sql
SELECT s.scheme_name, s.category, s.total_benefit_value, s.required_documents, s.official_url
FROM govt_schemes s
JOIN eligibility_rules r ON s.scheme_id = r.scheme_id
WHERE ($1::numeric IS NULL OR r.max_income IS NULL OR $1 <= r.max_income)
  AND ($2::int IS NULL OR ($2 >= r.min_age AND $2 <= r.max_age))
  AND (r.target_gender IS NULL OR r.target_gender = $3)
  AND ($4::int IS NULL OR $4 >= r.min_family_size)
  AND (r.target_occupation IS NULL OR r.target_occupation = $5)
  AND (r.target_social_category IS NULL OR r.target_social_category = $6)
  AND (r.requires_disability = FALSE OR $7 = TRUE)
  AND ($8::numeric IS NULL OR r.max_landholding IS NULL OR $8 <= r.max_landholding);
```

---

## Roadmap: What Next AI / Developer Must Do

1. **LLM Extraction Service (`backend/src/services/llmExtractor.js`)**:
   * Integrate Gemini/LLM to parse free-form user chat into demographic JSON:
     `{ age, gender, annual_income, occupation, family_size, disability_status, landholding_acres, location_zone }`.
2. **Chatbot API Endpoint (`backend/src/routes/chat.js`)**:
   * Accept user message -> call LLM extractor -> execute SQL matching query -> return matched schemes + service centers -> log into `user_interactions`.
3. **Frontend Chat Interface (`frontend/src/components/ChatWidget.jsx`)**:
   * Add interactive chat UI in React frontend to let users describe their situation and receive eligible schemes with required documents.

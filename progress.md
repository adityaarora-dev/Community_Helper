# CivicHelper AI — Project Master Guide & Progress Log

> **For Team & Collaborators**: This document contains the complete from-scratch breakdown of what has been built, every third-party service and API key used, installations, demo citizen credentials, and how the entire system operates.

---

## 1. Project Mission & Architecture

**CivicHelper AI** is an enterprise-grade civic resource matching platform that deterministically connects citizens to government welfare programs (agricultural subsidies, housing grants, health protection, student scholarships) without LLM hallucinations.

### The Dual-Engine Core:
```
Citizen Message (English / Hindi / Regional)
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. GOOGLE GEMINI AI (Extraction & Conversational Empathy)                │
│    • Converts natural language into strict JSON parameters              │
│    • Carries multi-turn dialogue, asking for missing parameters        │
│    • Speaks in English, Hindi, Bengali, Marathi, Telugu, Tamil          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (JSON Parameters only — NO SQL!)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. SUPABASE POSTGRESQL (Deterministic Relational SQL Engine)           │
│    • Safe parameterized SQL ($1..$8) joins govt_schemes & rules         │
│    • 100% mathematical precision: Zero SQL injection, Zero hallucination│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Verified Scheme Matches)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. GROUNDED BENEFIT EXPLANATION & SEVA KENDRA GEO-ROUTING               │
│    • Gemini explains WHY citizen qualifies in their chosen language    │
│    • Routes citizen to the nearest municipal Seva Kendra help desk      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Services & Technologies (What Are We Using & Why?)

| Technology / Service | Role in Project | Key Details |
| :--- | :--- | :--- |
| **Supabase PostgreSQL** | Primary Cloud Relational Database | Hosted on AWS Seoul (`aws-0-ap-northeast-2.pooler.supabase.com:5432`). Uses IPv4 Session Pooler on Port `5432` with connection pool (`pg.Pool`). |
| **Google Gemini AI** | Parameter Extraction & Multilingual Chat | Official SDK `@google/genai`. Primary model `gemini-3.5-flash` with automatic fallback to `gemini-3.8-flash` and rule-based heuristic parser. |
| **Brevo (Sendinblue)** | Transactional Email & Registration OTP | Sends 6-digit OTP verification codes to users before credentials are saved to PostgreSQL. Configured with **Port 2525 Render Bypass** + REST API v3 fallback. |
| **Node.js / Express** | RESTful Backend API | Runs on `http://localhost:5000`. Handles user auth, Brevo OTP, dynamic SQL filters, and Gemini AI pipeline. |
| **React 18 + Vite** | High-Performance Frontend SPA | Runs on `http://localhost:3000`. Fast HMR, production build compiles in ~2.4 seconds. |
| **Tailwind CSS v4** | Modern Executive Styling | Obsidian Dark (`slate-950`), Emerald Jade (`emerald-500/600`), and Warm Amber Gold (`amber-400`). No generic blues! |
| **Framer Motion** | Fluid Component Animations | Spring physics, tab transitions, typing indicators, and floating hero particles. |
| **Bcryptjs + JWT** | Security & Authentication | Salted password hashing (cost factor 10) and 7-day signed JSON Web Tokens. |

---

## 3. API Keys & Environment Variables

All sensitive credentials reside in `backend/.env` (and documented in `backend/.env.example`):

```ini
# Application Port
PORT=5000
NODE_ENV=development

# 1. Supabase PostgreSQL Connection String (Port 5432 Session Pooler)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

# 2. Google Gemini API Key (Multilingual Conversational Extraction)
GEMINI_API_KEY="[YOUR_GEMINI_API_KEY]"

# 3. Brevo Transactional Email (Registration OTP Delivery)
BREVO_API_KEY="[YOUR_BREVO_API_KEY]"
BREVO_SENDER_EMAIL="[YOUR_VERIFIED_SENDER_EMAIL]"
BREVO_SENDER_NAME="CivicHelper AI Portal"
BREVO_SMTP_PORT=2525
```

### The Render Outbound Port Override Solution:
* **The Problem**: Render's free/starter tiers block outbound traffic on standard SMTP port `25` and sometimes port `587`.
* **The Brevo Solution**: Brevo provides **Port 2525** as an alternative unblocked port.
* **Implementation**: Nodemailer is configured with `port: 2525` and `secure: false`, completely bypassing outbound firewall blocks. As an additional layer, Brevo REST API v3 (HTTPS Port 443) provides an instant direct delivery guarantee.

---

## 4. All Installations & Packages

### Backend Dependencies (`backend/package.json`):
```bash
npm install express pg cors dotenv @google/genai bcryptjs jsonwebtoken nodemailer
npm install --save-dev nodemon
```
* `express`: Web server framework
* `pg`: PostgreSQL client with connection pooling
* `cors`: Cross-Origin Resource Sharing for frontend
* `dotenv`: Environment variable loader
* `@google/genai`: Google Gemini Generative AI SDK
* `bcryptjs`: Password hashing
* `jsonwebtoken`: JWT authentication tokens
* `nodemailer`: Email sender supporting Port 2525 SMTP

### Frontend Dependencies (`frontend/package.json`):
```bash
npm install react react-dom lucide-react axios framer-motion tailwindcss @tailwindcss/vite
npm install --save-dev vite @vitejs/plugin-react
```
* `tailwindcss` (v4) & `@tailwindcss/vite`: Utility-first CSS styling
* `framer-motion`: Smooth UI transitions and micro-interactions
* `lucide-react`: Modern vector icon library
* `axios`: HTTP client with JWT interceptors
* `vite`: Lightning-fast build tool

---

## 5. Pre-Seeded Demo Citizen Accounts (Instant Login)

You do **not** need to create an account to start testing immediately. Use the **Pre-Seeded Demo Accounts Dropdown** on the Login page:

| Citizen Name | Email (Login ID) | Password | Demographic Profile (Auto-Populates) |
| :--- | :--- | :--- | :--- |
| **Ramesh Kumar** | `citizen@example.com` | `Citizen@123` | **Farmer** &bull; North Zone &bull; Income: **₹1,80,000** &bull; 3 Members &bull; 2.0 Acres Land |
| **Sunita Devi** | `vendor@example.com` | `Citizen@123` | **Street Vendor** &bull; Central Zone &bull; Income: **₹1,20,000** &bull; 4 Members &bull; 0 Acres |

---

## 6. User Journey & Navigation Flow

The application follows the strict **Home Default ➔ Auth ➔ Authorized Routes** flow:

```
[ HOME PAGE (/) ] ──── Unauthenticated Default Showcase ────┐
   │                                                         │
   ▼                                                         ▼
[ LOGIN / REGISTER ] (Pre-seeded Dropdown OR Brevo OTP)   [ PUBLIC ACCESS ]
   │                                                         • /allschemes
   │  1. Citizen enters details                              • /servicecenters
   │  2. Brevo sends 6-digit OTP to user's email
   │  3. Citizen enters OTP
   │  4. Credentials hashed & saved in Supabase PostgreSQL
   │  5. JWT token issued
   ▼
[ AUTHORIZED CITIZEN PORTAL ]
   ├── /citizen/intake   ──► Full demographic sliders, income presets, zone cards, DB save
   ├── /chat/ai          ──► Gemini multi-turn chat + live relational matching cards
   ├── /allschemes       ──► Complete catalog of 7 welfare schemes & checklists
   └── /servicecenters   ──► Local Seva Kendras with phone numbers & directions
```

* **Authentication Guard**: If an unauthenticated user tries to visit `/citizen/intake` or `/chat/ai`, the portal presents a secure **Authentication Required Guard** card inviting them to log in or use 1-click demo access.

---

## 7. Database Tables (Supabase PostgreSQL)

5 core tables defined in `backend/src/db/init.sql`:
1. **`users`**: `user_id` (UUID), `name`, `email` (UNIQUE), `password_hash`, `annual_income`, `family_size`, `location_zone`, `age`, `gender`, `occupation`, `social_category`, `disability_status`, `landholding_acres`, `created_at`.
2. **`govt_schemes`**: 7 pre-seeded welfare schemes (PM-KISAN, PMAY Housing, Ayushman Bharat, National Social Assistance Pension, etc.) with benefit amounts and document lists.
3. **`eligibility_rules`**: Relational constraints (`max_income`, `min_age`, `max_age`, `target_occupation`, `requires_disability`, `max_landholding`).
4. **`service_centers`**: 5 facilitation centers across North, South, Central, East, and West municipal zones.
5. **`user_interactions`**: Logs `user_id`, raw query, extracted JSON parameters, and matched scheme UUIDs.

---

## 8. How to Run & Verify

### Start Backend API:
```bash
cd backend
npm run dev
# Server running at http://localhost:5000
# Health check at http://localhost:5000/health
```

### Start Frontend Dashboard:
```bash
cd frontend
npm run dev
# Dashboard running at http://localhost:3000
```

### Run Integration Test Suites:
```bash
cd backend

# Test 1: Full System (Auth, Profile, Relational Match, Schemes, Centers)
node src/scripts/testAllFeatures.js

# Test 2: Brevo OTP Email Delivery Flow
node src/scripts/testOtpRegistration.js

# Test 3: Inspect Database Tables & Row Counts
npm run db:check
```

# AI Agent Context & System Architecture

## Project Purpose
Intelligent Community Resource Chatbot connecting citizens to government welfare schemes via **zero-fallback AI Text-to-SQL dynamic generation** and **deterministic relational SQL filtering** powered by Google Gemini and Supabase PostgreSQL.

> **Detailed Specification**: See [ARCHITECTURE.md](file:///D:/Projects/DB_PROJECT/ARCHITECTURE.md) for the complete multi-tier diagrams, sequence charts, and ER models.

---

## Current Architecture & Component Topology

### 1. Database Tier (Supabase PostgreSQL - Port 5432)
* **Location**: Host `aws-0-ap-northeast-2.pooler.supabase.com:5432` > DB `postgres` > Schema `public`.
* **IPv4 Session Pooler**: `pg.Pool` with `max: 10`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 10000`, `ssl: { rejectUnauthorized: false }`.
* **Core Relational Tables**:
  * `users`: Citizen credentials & demographic profile (income, age, gender, occupation, family size, disability, landholding, zone).
  * `citizen_sessions`: Server-tracked citizen session state (8h hard expiry, 15m sliding inactivity expiry).
  * `govt_schemes`: Welfare schemes, metadata, benefit amounts, required documents, location zone.
  * `eligibility_rules`: Relational constraints (`max_income`, `min_age`, `max_age`, `target_gender`, `target_occupation`, `requires_disability`, `max_landholding`).
  * `service_centers`: Civic facilitation centers across municipal zones (North, South, East, West, Central).
  * `scheme_notifications`: User-to-scheme notification records created via database trigger.
  * `user_interactions`: Audit logging for natural queries, extracted payloads, and matched scheme UUIDs.
  * `admins` & `admin_sessions`: Administrator credentials and 30-day sliding sessions.
* **Database Triggers**:
  * `notify_new_zone_scheme()`: Automatically generates in-app notifications in `scheme_notifications` when a scheme is published with a matching `location_zone`.

### 2. Application Tier (Node.js & Express 5 API)
* **Demo Citizen Credentials (Pre-seeded in DB)**:
  * `citizen@example.com` / `Citizen@123` (Ramesh Kumar, Farmer, North Zone)
  * `vendor@example.com` / `Citizen@123` (Sunita Devi, Street Vendor, Central Zone)
* **Endpoints**:
  * `POST /api/users/send-registration-otp`: Generates 6-digit OTP and delivers via Brevo (Port 2525 / REST API v3).
  * `POST /api/users/verify-otp-and-register`: Verifies OTP, hashes password with `bcryptjs`, issues `citizen_sessions` JWT.
  * `POST /api/users/login`: Authenticates credentials, cleans expired sessions, returns session JWT.
  * `POST /api/users/session`: Heartbeat keepalive updating `last_active_at`.
  * `POST /api/users/logout`: Revokes active session row from `citizen_sessions`.
  * `GET /api/users/profile/:userId` & `PUT /api/users/profile/:userId`: Citizen profile management with strict IDOR ownership checks.
  * `POST /api/chat`: Zero-fallback Text-to-SQL conversational handler (Live schema discovery → Gemini SQL generation → SQL validation → Read-only execution → Result grounding).
  * `GET /api/schemes` & `GET /api/schemes/:schemeId`: Public catalog endpoints.
  * `GET /api/service-centers`: Municipal Seva Kendra directory.
  * `GET /api/notifications` & `PATCH /api/notifications/:id/read`: Citizen notification inbox.
  * `POST /api/admin/login`, `GET /api/admin/me`, `POST /api/admin/logout`: Admin session management with 10-attempt / 15-min IP rate limiting.
  * `GET|POST|PUT|DELETE /api/admin/schemes` & `/api/admin/service-centers`: Admin CRUD operations.
  * `GET /health` & `GET /api/health`: Health status and connection pool telemetry.

### 3. Presentation Tier (React 18 + Vite SPA)
* **Design & Styling**: Obsidian Dark / Warm Emerald theme built with Tailwind CSS v4 and Framer Motion.
* **Component Architecture**:
  * `Navbar.jsx`: Brand header, navigation links, unread notification counter badge, language switcher, auth controls.
  * `HomeView.jsx`: Public landing page, category chips, hero banner, next steps onboarding.
  * `LoginView.jsx`: Brevo OTP registration & pre-seeded demo citizen profile selector dropdown.
  * `ProfileIntakeView.jsx`: Interactive demographic intake form with real-time database persistence.
  * `ChatInterface.jsx`: Multi-turn conversational UI with `AssistantMarkdown`, collapsible `SqlCollapsible` (with execution metrics & reasoning), and `DataTableViewer`.
  * `StructuredFilterPanel.jsx`: Sliders, inputs, and category filters for instant parametric SQL matching.
  * `SchemeCatalogView.jsx`: Comprehensive catalog of all welfare initiatives with document checklist modals.
  * `ServiceCentersView.jsx`: Seva Kendra locator filterable by municipal zones.
  * `NotificationsView.jsx`: Zone-based alert notifications with mark-as-read state.
  * `AdminView.jsx`: Admin dashboard with multi-rule set scheme creator and center manager.
* **Localization**:
  * 6 regional languages supported via `i18n.jsx`: English, Hindi (हिन्दी), Bengali (বাংলা), Marathi (मराठी), Telugu (తెలుగు), Tamil (தமிழ்).

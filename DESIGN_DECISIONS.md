# Pre-Implementation Design & Architecture Decisions
**University Lost & Found Matcher — Nemma Assessment**

This document records the architectural answers, design rationale, and exact implementations chosen for the pre-implementation design questions across the 7 evaluation dimensions.

---

## 1. Product Scope & Users

### 1.1 Who can submit reports: students, university staff, or anyone?
- **Decision:** Anyone within the campus community (students, faculty, visitors, and campus staff) can submit lost and found reports.
- **Implemented:** Open submission form accessible without role gates via the "Report Lost / Found" tab (`POST /api/reports`).

### 1.2 Does the application require authentication, or can users submit reports anonymously?
- **Decision:** Anonymous submission is supported by default for fast intake at campus lost-and-found desks and kiosks; contact information (email/phone) is optional but encouraged.
- **Implemented:** Reports do not require user logins or session tokens. Contact information is captured optionally in `contact_info` and protected from public exposure.

### 1.3 Can users browse all reports or only reports they submitted?
- **Decision:** Users and campus staff can browse all active and claimed reports across campus to ensure transparency and community recovery.
- **Implemented:** Filterable repository tab in the UI displaying all reports with status chips (`open` vs. `claimed`), categories, locations, and dates (`GET /api/reports`).

---

## 2. Report Data & Structure

### 2.1 What information should be required for lost and found reports?
- **Decision:** Core identification fields are required: `type` (`lost` | `found`), `title`, `category`, `subcategory`, `location`, and `event_date`. Detailed attributes (`color`, `brand`, `description`, `contact_info`) remain optional.
- **Implemented:** Zod schemas (`CreateReportSchema`) enforce non-empty strings and valid dates, with informative client-side field validation in `ReportForm.tsx`.

### 2.2 Should categories, colors, and campus locations be predefined or allow custom input?
- **Decision:** Standardized taxonomies ensure reliable matching while supporting open text for distinguishing details.
- **Implemented:** 
  - Standardized hierarchal categories (`electronics`, `personal_items`, `accessories`, `bags`, `cards_ids`, `keys`, `documents_books`).
  - Standardized locations (`library`, `student_union`, `science_center`, `engineering_hall`, `dining_commons`, `gymnasium`, `dormitory_quad`).
  - Open freeform inputs for `title`, `brand`, `description`, and `distinguishing_features`.

### 2.3 Should users be able to attach photos and edit or delete submitted reports?
- **Decision:** In this release, textual descriptions, color tags, and distinguishing feature tokens represent items; photo storage and full CRUD are scoped for future cloud storage expansion.
- **Implemented:** Soft status transitions (`open` -> `claimed`) and dismissal records (`dismissed_matches`). Direct destructive deletion is restricted to preserve audit integrity.

---

## 3. Matching Algorithm

### 3.1 Which attributes should determine whether two reports are potential matches?
- **Decision:** 5 multi-factor dimensions: Category/Subcategory compatibility (30%), Distinctive Text Attributes (25%), Location Proximity (20%), Time Proximity (15%), and Color Similarity (10%).
- **Implemented:** Pure heuristic scoring function in `server/src/services/scoring.ts` generating itemized component scores and human-readable explanations.

### 3.2 How should different descriptions, missing information, and conflicting attributes affect similarity?
- **Decision:** Missing attributes must reduce *information coverage* rather than penalizing the similarity score; conflicting hard attributes (e.g. found before lost, or incompatible category) immediately hard-reject.
- **Implemented:** Normalized re-weighting formula $S = \frac{\sum w_i s_i}{\sum w_i} \times 100$ and independent coverage metric $C = \frac{\sum w_i}{100} \times 100$. Found-before-lost and cross-category conflicts produce candidate rejection ($S = 0$).

### 3.3 Should matching use rule-based scoring, semantic similarity, or a combination of both?
- **Decision:** A deterministic hybrid engine combining rule-based heuristics (dates, campus topology, category compatibility trees) and tokenized fuzzy text search (Fuse.js with stop-word filtering).
- **Implemented:** `Fuse.js` + token normalization for titles/brands/features, combined with explicit location adjacency matrices and time decay curves. Zero opaque black-box LLM dependencies in the critical scoring path.

---

## 4. Matching Lifecycle

### 4.1 When should matching run: immediately after submission or periodically?
- **Decision:** On-demand dynamic matching whenever requested by the user interface or API.
- **Implemented:** `GET /api/matches` evaluates all active `open` lost reports against open found reports in real time, guaranteeing up-to-the-second suggestions.

### 4.2 Should existing matches be recalculated when a report is updated?
- **Decision:** Because matching is computed dynamically from current database state, any report addition or status change is instantly reflected.
- **Implemented:** Dynamic query pipeline executes fresh evaluations upon each query; no stale cached score rows.

### 4.3 How should the system handle duplicate, dismissed, or already matched candidates?
- **Decision:** Claimed reports and dismissed candidate pairs must be completely excluded from future suggestion queues.
- **Implemented:** SQL queries filter out reports with `status != 'open'`. The `dismissed_matches` table stores `(lost_report_id, found_report_id)` with a unique composite index, automatically skipped by `findMatches()`.

---

## 5. Match Confirmation & Ownership

### 5.1 Who can confirm a potential match: the person who lost the item, the finder, or university staff?
- **Decision:** Matches require deliberate human confirmation (by university desk staff or report owners) rather than automatic autonomous resolution.
- **Implemented:** Match review dashboard requires clicking "Confirm Match" with a confirmation dialog, displaying full transparent breakdown before action.

### 5.2 Does confirming a match automatically mark both reports as claimed?
- **Decision:** Yes. Confirming a match atomically marks both the lost report and found report as `claimed` and records the resolution timestamp.
- **Implemented:** `POST /api/matches/confirm` executes an atomic SQLite transaction (`BEGIN IMMEDIATE` / `COMMIT`) setting `status = 'claimed'` on both reports simultaneously.

### 5.3 Can a confirmed match be reversed, and how should ownership disputes be handled?
- **Decision:** Confirmed matches cannot be re-confirmed or claimed by third parties. Staff can review historical claimed statuses; dispute escalation is handled through campus desk records.
- **Implemented:** Server returns `400 Bad Request` if either report is already claimed, preventing race conditions and double-claims.

---

## 6. Database & Data Management

### 6.1 Should lost and found reports share the same database structure?
- **Decision:** Yes. Lost and found reports share identical physical item attributes and schema, differentiated by the `type` column (`'lost'` | `'found'`).
- **Implemented:** Single unified `reports` table in SQLite (`server/src/database/db.ts`) with typed check constraints `CHECK(type IN ('lost', 'found'))`.

### 6.2 Should match results be stored in the database or calculated dynamically?
- **Decision:** Match scores are calculated dynamically to avoid synchronization anomalies; only persistent human decisions (`dismissed_matches`) and status updates are stored in the database.
- **Implemented:** Lightweight, sub-millisecond dynamic calculation in memory on query; SQLite stores persistent entities (`reports`, `dismissed_matches`).

### 6.3 How should the system handle expired reports, deleted reports, and historical matches?
- **Decision:** Reports outside the 30-day window are filtered out of candidate pairing by the scoring engine; historical claimed reports remain in the database for record auditing.
- **Implemented:** Strict $0 \le \Delta t \le 30$ day eligibility window. Reports remain stored and browsable in the archive.

---

## 7. Technical & Performance Requirements

### 7.1 What is the expected number of reports and concurrent users?
- **Decision:** Designed for a campus environment handling thousands of seasonal reports with sub-100ms response times.
- **Implemented:** SQLite with Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and indexed columns (`type`, `status`, `category`, `event_date`) allowing rapid reads and concurrent writes.

### 7.2 How should the system handle simultaneous match confirmations?
- **Decision:** Prevent double-claim race conditions through atomic transactional isolation.
- **Implemented:** `better-sqlite3` synchronous database transaction (`db.transaction()`) ensures that verification and update of both report statuses happen as an indivisible unit.

### 7.3 What validation, error handling, and logging mechanisms are necessary?
- **Decision:** End-to-end schema validation at the API boundary, standard HTTP status codes, structured error payloads, and console audit logging.
- **Implemented:**
  - Runtime request validation with `zod`.
  - Consistent error responses (`{ error: string, details?: any }`).
  - Safe 400/404/500 error boundaries on the backend.
  - User-friendly toast notices and form validation cues in the frontend.

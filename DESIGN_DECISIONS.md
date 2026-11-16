# Pre-Implementation Design & Architecture Decisions
**University Lost & Found Matcher — Nemma Assessment**

## 1. Product Scope & Users

- **Access:** Anyone in the campus community can submit and browse reports.
- **Authentication:** No login is required. Contact details are optional.
- **Visibility:** All reports are visible in the repository, including their current status.

## 2. Report Data & Structure

- **Required fields:** Report type, title, category, subcategory, location, and event date. Other details are optional.
- **Standardization:** Categories and campus locations use predefined options, while item descriptions and distinguishing features remain free text.
- **Scope:** Photo uploads, editing, and destructive deletion were left out to keep the initial version focused.

## 3. Matching Algorithm

- **Scoring:** Category (30%), distinctive attributes (25%), location (20%), time (15%), and color (10%).
- **Missing information:** Missing attributes reduce information coverage, not the similarity score. Hard conflicts reject candidates.
- **Approach:** Used rule-based scoring combined with Fuse.js for fuzzy text matching instead of relying on LLM-based matching.

## 4. Matching Lifecycle

- **Execution:** Matches are calculated dynamically whenever `GET /api/matches` is requested.
- **Updates:** New reports and status changes are reflected automatically without maintaining cached scores.
- **Dismissals:** Dismissed pairs are stored in SQLite, while claimed reports are excluded from future suggestions.

## 5. Match Confirmation & Ownership

- **Confirmation:** A person must review and manually confirm a suggested match.
- **Resolution:** Confirming a match marks both reports as `claimed` in a single database transaction.
- **Duplicate claims:** Already claimed reports cannot be confirmed again. Dispute handling is left to the university's existing process.

## 6. Database & Data Management

- **Structure:** One `reports` table stores both lost and found items, differentiated by a `type` field.
- **Persistence:** Reports and dismissed pairs are stored; matching scores are calculated when needed.
- **History:** Reports remain available for reference, but only reports within the 30-day window are considered for matching.

## 7. Technical Decisions

- **Database:** SQLite with WAL mode and indexes on frequently queried fields, suitable for the expected campus-scale workload.
- **Concurrency:** Atomic transactions prevent two users from claiming the same reports simultaneously.
- **Validation:** Zod handles request validation, with structured API errors and frontend feedback for invalid input.

## Final Thought

I prioritized a simple, explainable matching system with a clear report lifecycle. Features such as authentication, image matching, notifications, and advanced AI matching were intentionally left out to keep the solution focused on the actual assessment requirements.

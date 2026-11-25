# Community Hero — Principal-Level Interview Preparation

---

## 1. Project Overview & Architecture

### Elevator Pitch

Community Hero is a **full-stack, AI-powered civic issue reporting platform** that enables citizens in Delhi NCR to geolocate and report infrastructure problems (potholes, water leaks, broken streetlights), have them **auto-categorized and severity-scored by Google Gemini 2.5 Flash**, and then escalate verified grievances to local government authorities via **AI-generated formal complaint letters** that are cross-verified against user-uploaded screenshots using **Gemini Vision multimodal inference**. The platform drives community engagement through a gamified points-and-badges economy that rewards reporting, verification, commenting, and civic escalation. It is built as a zero-build-step vanilla JS SPA monolith backed by Node.js/Express and MongoDB Atlas, architected for fast time-to-interactive and dead-simple deployment — the entire codebase is under 32 source files with no Webpack, no React, no transpilation step.

---

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser SPA)                         │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐│
│  │ home.js  │ │ report.js│ │ tracker.js│ │ map.js   │ │dashboard ││
│  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └────┬─────┘ └────┬─────┘│
│       │  Hash-based SPA Router (app.js)        │            │      │
│       └──────────────┬─────────────────────────┘            │      │
│                      ▼                                      │      │
│               ┌──────────┐    ┌──────────┐                  │      │
│               │  api.js  │    │  auth.js  │◄─ localStorage  │      │
│               │ (fetch)  │    │ (JWT mgr) │   (ch_token,    │      │
│               └────┬─────┘    └──────────┘    ch_user)      │      │
│                    │                                        │      │
│  CDN Deps: Leaflet 1.9.4 + MarkerCluster, Chart.js 4.4.4   │      │
└────────────────────┼────────────────────────────────────────┘      │
                     │ HTTP (JSON / multipart/form-data)              │
                     ▼                                                │
┌────────────────────────────────────────────────────────────────────┐│
│                    EXPRESS.JS SERVER (:3000)                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ server.js — Entrypoint                                      │   │
│  │  ├─ dotenv (absolute path override)                         │   │
│  │  ├─ cors(), express.json({limit:'10mb'})                    │   │
│  │  ├─ express.static('/public')                               │   │
│  │  └─ SPA fallback: GET * → index.html                       │   │
│  └────────────────────┬────────────────────────────────────────┘   │
│                       │                                            │
│  ┌────────────────────▼────────────────────────────────────────┐   │
│  │ ROUTES                                                      │   │
│  │  /api/auth    → auth.js    (signup, login, me)              │   │
│  │  /api/issues  → issues.js  (CRUD, upvote, verify, comment,  │   │
│  │  │                          analyze, gov-draft, gov-file,    │   │
│  │  │                          stats, predictions, delete)      │   │
│  │  /api/users   → users.js   (leaderboard, user stats)        │   │
│  └───────────┬─────────┬──────────────────────┬────────────────┘   │
│              │         │                      │                    │
│  ┌───────────▼──┐  ┌───▼──────────────┐  ┌───▼──────────────┐     │
│  │ middleware/   │  │ gemini.js        │  │ database.js      │     │
│  │  auth.js      │  │  analyzeIssue()  │  │  Mongoose schemas│     │
│  │  requireAuth  │  │  generatePred()  │  │  seedDatabase()  │     │
│  │  optionalAuth │  │  generateGriev() │  │                  │     │
│  │  generateToken│  │  verifyScreen()  │  │                  │     │
│  └──────────────┘  └────────┬─────────┘  └────────┬─────────┘     │
│                             │                      │               │
└─────────────────────────────┼──────────────────────┼───────────────┘
                              │                      │
                     ┌────────▼──────┐    ┌──────────▼─────────┐
                     │ Google Gemini │    │  MongoDB Atlas      │
                     │ 2.5 Flash API │    │  (Cluster0)         │
                     │  - Text       │    │  Collections:       │
                     │  - Vision     │    │   users, issues,    │
                     │  (Free Tier:  │    │   comments,         │
                     │   15 RPM,     │    │   verifications,    │
                     │   1500 RPD)   │    │   userupvotes,      │
                     └───────────────┘    │   badges            │
                                          └────────────────────┘
```

---

### Tech Stack & Justifications

| Layer | Technology | Why This Over Alternatives |
|---|---|---|
| **Frontend Framework** | Vanilla HTML/CSS/JS (SPA) | Zero build step, zero dependency footprint, instant load. No React/Vue/Svelte overhead for a content-driven CRUD app. Eliminates Webpack/Vite config entirely. |
| **SPA Routing** | Hash-based router (`window.location.hash`) | No server-side route config needed. SPA fallback in Express (`GET * → index.html`) handles deep links. Avoids `pushState` complexity for a monolith. |
| **Backend** | Node.js + Express 4.21 | Ubiquitous, fast prototyping, single-language stack (JS everywhere). Express is battle-tested for REST APIs. Chose REST over GraphQL because every frontend view maps 1:1 to a specific endpoint—no over-fetching problem exists. |
| **Database** | MongoDB Atlas (Mongoose 9.8) | Migrated from SQLite/PostgreSQL to MongoDB for cloud-native scalability, zero-ops managed hosting, and flexible schema evolution. Document model fits issue reports naturally (nested fields like `gov_*` metadata). Compound unique indexes on `(issue_id, user_id)` enforce idempotency on upvotes/verifications. |
| **AI Engine** | Google Gemini 2.5 Flash (`@google/generative-ai`) | Free tier (15 RPM, 1500 RPD) sufficient for demo scale. Multimodal: same model handles text classification AND screenshot verification (Vision). Chose over OpenAI for cost (free) and native multimodal support without separate vision API. |
| **Auth** | JWT (jsonwebtoken) + bcryptjs | Stateless auth—no session store needed. 7-day token expiry. `bcryptjs` (pure JS) avoids native compilation issues with `bcrypt` on Windows/ARM. Chose JWT over session cookies for API-first architecture. |
| **File Upload** | Multer (disk storage) | Standard Express middleware. 50MB limit accommodates short video uploads. Files immediately deleted after AI processing to conserve disk. |
| **Mapping** | Leaflet 1.9.4 + MarkerCluster (CDN) | Open-source, no API key required (vs. Google Maps). MarkerCluster handles dense pin overlaps automatically. |
| **Charts** | Chart.js 4.4.4 (CDN) | Lightweight (~60KB gzipped), declarative API, responsive by default. Overkill alternatives like D3 not needed for 4 chart types. |
| **ID Generation** | UUID v4 (`uuid` package) | Globally unique, no auto-increment leakage. Stored as `String` in Mongoose—avoids ObjectId coupling in API responses. |

---

## 2. Core Components & Deep-Dive Internals

### 2.1 Server Entry Point — `server/server.js`

**Responsibility:** Bootstrap the entire application — load environment, wire middleware, mount routes, seed database, initialize Gemini.

**Key implementation details:**
- **Line 1:** `dotenv` is loaded with an **absolute path override** (`path.join(__dirname, '../.env'), override: true`). This ensures the `.env` is always resolved relative to the server directory, not the working directory. The `override: true` flag means `.env` values always win over system env vars — critical for local development where system `PORT` might conflict.
- **Lines 18-21:** Eagerly creates `public/uploads/` on startup to prevent `ENOENT` crashes from multer on first upload.
- **Lines 47-64:** `start()` is an async function that calls `seedDatabase()` (which connects to MongoDB and conditionally seeds demo data) before `app.listen()`. This guarantees the DB connection is established before accepting HTTP traffic.
- **Line 25:** `express.json({ limit: '10mb' })` — raised from default 100KB to handle large base64-encoded payloads in analyze requests.

### 2.2 Database Layer — `server/database.js`

**Responsibility:** Define all Mongoose schemas, enforce unique constraints via compound indexes, seed demo data on first run.

**6 Mongoose Models:**

| Model | Key Fields | Indexes | Purpose |
|---|---|---|---|
| `User` | `id` (UUID, unique), `name`, `email` (unique), `password_hash`, `points` | `email: unique`, `id: unique` | Authentication, gamification |
| `Issue` | `id`, `title`, `description`, `category`, `severity`, `status`, `lat/lng`, `address`, `image_url`, `reported_by`, `ai_category`, `ai_confidence`, `upvotes`, `verifications`, `gov_*` fields | `id: unique` | Core entity |
| `Comment` | `id`, `issue_id`, `user_id`, `text` | `id: unique` | Discussion thread per issue |
| `Verification` | `id`, `issue_id`, `user_id` | `{issue_id, user_id}: unique` | Prevents double-verification |
| `UserUpvote` | `issue_id`, `user_id` | `{issue_id, user_id}: unique` | Toggle-based upvote idempotency |
| `Badge` | `id`, `user_id`, `badge_type` | `{user_id, badge_type}: unique` | Achievement system |

**Schema design decisions:**
- **Denormalized counters:** `Issue.upvotes` and `Issue.verifications` are denormalized counters maintained via `$inc` atomic updates, avoiding expensive `COUNT` joins on every read. The `UserUpvote` and `Verification` collections serve as the source of truth; the counter is a read optimization.
- **Application-layer UUIDs:** Every document uses a `uuid` v4 string `id` field rather than MongoDB's native `_id` ObjectId. This decouples the API contract from the database engine — the same API would work with PostgreSQL, DynamoDB, or any other store.
- **Compound unique indexes** on `(issue_id, user_id)` enforce one-upvote-per-user and one-verification-per-user at the database level, preventing race conditions from concurrent requests.

**Seed function (`seedDatabase()`):**
- Checks `User.countDocuments()` — if >0, skips seeding entirely (idempotent across restarts).
- Seeds 8 demo users with bcrypt-hashed passwords (cost factor 10).
- Seeds 18 geo-located issues across Delhi NCR with realistic addresses, varied categories/severities/statuses, and historical `created_at` dates calculated by subtracting `daysAgo` from `Date.now()`.
- Seeds 12 badges for top demo users.

### 2.3 Authentication — `server/middleware/auth.js` + `server/routes/auth.js`

**Middleware:**
- **`requireAuth`**: Extracts `Bearer <token>` from `Authorization` header, verifies with `jwt.verify()`, attaches decoded payload (`{ id, name, email }`) to `req.user`. Returns 401 on missing/invalid token.
- **`optionalAuth`**: Same extraction logic but **never rejects** — silently continues without `req.user` if token is absent or invalid. Used on `GET /issues` and `GET /issues/:id` so logged-out users can browse but logged-in users get personalized state (e.g., `userUpvoted`, `userVerified` flags).
- **`generateToken`**: Signs `{ id, name, email }` with `JWT_SECRET`, expires in **7 days**.

**Routes:**
- **POST `/signup`**: Validates name/email/password, checks email uniqueness (case-insensitive `.toLowerCase().trim()`), hashes password with bcrypt (salt rounds: 10), creates user, returns `{ user, token }`.
- **POST `/login`**: Finds user by normalized email, `bcrypt.compareSync`, returns token.
- **GET `/me`**: Protected by `requireAuth`. Aggregates the user's badges, `total_reported`, `total_resolved`, and `total_verifications` counts via separate queries. This powers the user dropdown and profile view.

### 2.4 Issue Routes — `server/routes/issues.js` (610 lines, the core of the app)

**12 endpoints, covering the entire issue lifecycle:**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | optional | List/filter/search/sort/paginate issues |
| GET | `/stats` | none | Aggregate dashboard (5 aggregation pipelines) |
| GET | `/predictions` | none | AI-generated predictive insights |
| GET | `/:id` | optional | Full issue detail + comments + verifiers + user state |
| POST | `/` | required | Create issue (multer upload + AI analysis) |
| POST | `/analyze` | none | AI-only analysis without persisting |
| POST | `/:id/analyze` | none | Same, legacy route |
| PATCH | `/:id/status` | required | Update status (reported→verified→in_progress→resolved) |
| POST | `/:id/upvote` | required | Toggle upvote (+1/-1 with idempotency check) |
| POST | `/:id/verify` | required | One-time verification (409 if duplicate) |
| POST | `/:id/comments` | required | Add comment |
| GET | `/:id/gov-draft` | optional | AI-generate formal grievance letter |
| POST | `/:id/gov-file` | required | Upload screenshot + AI verify + record filing |
| DELETE | `/:id` | required | Owner-only delete (cascades comments, upvotes, verifications) |

**Multer configuration:**
- Disk storage to `public/uploads/`.
- Filename: `issue-{timestamp}-{random6chars}.{ext}` — avoids collisions without a database lookup.
- File filter: accepts images (jpeg, jpg, png, gif, webp) and videos (mp4, mov, webm, ogg).
- Size limit: 50MB to accommodate short video evidence.

**Aggregation pipelines in `/stats`:**
1. Average resolution time: `$subtract[resolved_at, created_at]` → `$avg` in milliseconds → convert to days.
2. Issues by category: `$group` by `category`.
3. Issues by status: `$group` by `status`.
4. Issues by severity: `$group` by `severity`.
5. 30-day trend: `$match created_at >= 30 days ago` → `$group` by `$dateToString("%Y-%m-%d")`.
6. Top areas: `$group` by `address` → `$sort` → `$limit 8`.

### 2.5 Gemini AI Module — `server/gemini.js` (333 lines)

**4 exported functions, each with a Gemini-primary + keyword-fallback architecture:**

| Function | Input | Output | Gemini Feature Used |
|---|---|---|---|
| `analyzeIssue(title, desc, imagePath)` | Text + optional image file path | `{category, confidence, severity, summary}` | Text generation (+ image if provided) |
| `generatePredictions(issueStats)` | Aggregated category stats JSON | `{predictions: [{text, trend, confidence}]}` | Text generation |
| `generateGrievanceLetter(...)` | Issue title, desc, category, address, lat/lng, upvotes, verifications, authority | `{authority, subject, body}` | Text generation |
| `verifyScreenshotWithAI(base64Image, complaintId)` | Base64 PNG + ticket ID string | `boolean` | **Vision (multimodal)** |

**Graceful degradation pattern (critical design decision):**
Every function follows the same structure:
```
if (model) {
  try { return geminiResult; }
  catch { console.error; /* fall through */ }
}
return fallbackResult;
```
If `GEMINI_API_KEY` is missing, `initGemini()` returns `false` and `model` stays `null`. All AI functions then execute their local fallbacks:
- `analyzeIssue` → `keywordCategorize()` (weighted keyword matching with multi-word bonus scoring).
- `generatePredictions` → hardcoded seasonal predictions for Delhi NCR.
- `generateGrievanceLetter` → template letter with dynamic city extraction from address.
- `verifyScreenshotWithAI` → returns `true` (demo fallback).

**Keyword categorizer scoring algorithm:**
```javascript
score += kw.split(' ').length; // "speed breaker" scores 2, "road" scores 1
```
Multi-word matches are weighted higher than single-word matches, reducing false positives. Final confidence: `min(0.95, 0.5 + score * 0.1)`.

**Severity keyword cascading:** Loops through `critical → high → medium → low` and breaks on first match, ensuring the most severe applicable label wins.

### 2.6 Frontend Architecture

**Single-page application with hash routing:**
- `app.js` listens to `hashchange` events and dispatches to page-specific render functions.
- Each page (`home.js`, `report.js`, `tracker.js`, `map.js`, `issueDetail.js`, `dashboard.js`, `leaderboard.js`, `login.js`) is a standalone module that renders its HTML into `#main-content` via `innerHTML`.
- Global utilities (`utils.js`) provide: date formatting (IST locale), number abbreviation, category/status/severity/badge config objects, toast notifications, confirmation dialogs, geolocation wrapper, debounce, HTML escaping, and Leaflet marker icon factory.

**Auth state management (`auth.js`):**
- Singleton `Auth` object with observer pattern (`onChange(fn)` returns unsubscribe function).
- Dual storage: `localStorage('ch_token')` for the JWT, `localStorage('ch_user')` for the cached user object.
- `refreshUser()` calls `GET /api/auth/me` on page load; if the token is expired/invalid, automatically calls `logout()`.

**Report wizard (`report.js`):**
- 4-step wizard: Details → Media → Location → Review.
- Step 1: Debounced AI analysis triggers after 20+ chars in description field, auto-fills category dropdown.
- Step 2: Drag-and-drop + file input, max 5 files, FileReader preview.
- Step 3: Leaflet mini-map with draggable marker + "Use My Location" button (HTML5 Geolocation API).
- Step 4: Review summary, single `FormData` submission.

**Tracker page (`tracker.js`):**
- Split-panel layout: left side is a filtered/sorted card feed, right side is a synced Leaflet map.
- Card hover triggers `splitMap.panTo()` + `marker.openPopup()` — the map pans to the hovered issue's coordinates.

---

## 3. End-to-End Request Workflows

### 3.1 Issue Report Flow (Happy Path)

```
User fills 4-step wizard
       │
       ▼
Step 1: Title + Description typed
       │ (after 20+ chars, debounced 1s)
       ▼
POST /api/issues/analyze (FormData)
  → multer parses (but no file in analyze)
  → analyzeIssue(title, desc, null)
  → Gemini prompt: classify into 7 categories + severity + confidence
  → Response: { category: "pothole", confidence: 0.92, severity: "high", summary: "..." }
  → Frontend auto-fills category dropdown + shows AI suggestion box
       │
Step 2: User uploads photo(s) — stored in reportState.imageFiles[]
Step 3: User pins location on Leaflet map — lat/lng stored in reportState
Step 4: Review → Submit
       │
       ▼
POST /api/issues (FormData: title, description, category, severity, lat, lng, address, image)
  → requireAuth middleware: verify JWT → req.user = { id, name, email }
  → multer.single('image'): saves to public/uploads/issue-{ts}-{rand}.{ext}
  → analyzeIssue(title, description, null): re-runs AI classification
  → Issue.create({
       id: uuidv4(),
       category: user_override || ai_category,
       severity: user_override || ai_severity,
       ai_category, ai_confidence,
       image_url: /uploads/filename,
       reported_by: req.user.id,
       status: 'reported'
     })
  → User.updateOne($inc: { points: +10 })
  → Badge check: if issueCount === 1 → award 'first_responder'
  → Response 201: { issue, aiSuggestion }
       │
       ▼
Frontend: Utils.toast('success', '+10 pts')
  → window.location.hash = `#issue/${issue.id}`
  → renderIssueDetailPage(id)
```

**Data transformation at each layer:**
1. **Client:** `reportState` object → `FormData` (binary multipart)
2. **Multer:** Extracts file → saves to disk → `req.file.filename`
3. **Route handler:** `req.body` (text fields) + `req.file` (file metadata) → Mongoose document
4. **Response:** Mongoose document `.toObject()` + joined `reporter_name` → JSON

### 3.2 Government Escalation Flow (Screenshot Verification)

```
User clicks "Escalate to Government" on issue detail page
       │
       ▼
GET /api/issues/:id/gov-draft?authority=MCD
  → Issue.findOne({id})
  → generateGrievanceLetter(title, desc, category, address, lat, lng, upvotes, verifications, "MCD")
  → Gemini generates formal complaint letter with GPS coordinates, community consensus stats
  → Response: { authority, subject, body }
       │
       ▼
Frontend: populates modal with draft letter + "Copy to Clipboard" + "Open Portal" link
  → User files complaint on external portal, screenshots confirmation page
       │
       ▼
User fills Filing Form:
  - Authority name (pre-filled from draft)
  - Complaint ID / Ticket No.
  - Screenshot file (REQUIRED)
       │
       ▼
POST /api/issues/:id/gov-file (FormData: gov_authority, gov_complaint_id, screenshot)
  → requireAuth → JWT check
  → multer.single('screenshot') → saves to public/uploads/
  → Validate: authority + complaint_id + file all present
  → Issue.findOne({id}) — if not found, fs.unlinkSync(uploaded file), return 404
  → fs.readFileSync(req.file.path) → base64 encoding
  → fs.unlinkSync(req.file.path) ← IMMEDIATE CLEANUP (saves disk)
  → verifyScreenshotWithAI(base64, complaintId)
      → Gemini Vision prompt: "Does this screenshot show complaint ID '{id}' was successfully filed?"
      → Response: "YES" or "NO" (strict binary)
      → Returns true if response.includes('YES')
  → If NOT verified → 400 "AI Verification Failed"
  → If verified:
      → issue.gov_filed = 1, gov_authority, gov_complaint_id, gov_filed_at, gov_filed_by
      → issue.save()
      → User.updateOne($inc: { points: +15 })
      → Comment.create(system comment: "🏛️ Grievance officially filed with **MCD**...")
      → Badge check: if gov_files_count >= 2 → award 'civic_champion'
  → Response: updated issue document
```

### 3.3 Failure & Fallback Paths

| Failure Point | What Happens | Code Location |
|---|---|---|
| Gemini API key missing | `initGemini()` returns `false`, `model` stays `null`. All AI functions use keyword/template fallbacks. App is fully functional without AI. | `gemini.js:9-21` |
| Gemini API rate limited / network error | Caught in try/catch. `analyzeIssue` falls back to `keywordCategorize()`. `verifyScreenshotWithAI` returns `false` (strict — real verification fails safe). | `gemini.js:90-92, 326-328` |
| MongoDB connection fails | `seedDatabase()` catches error, logs it, returns early. Routes will fail with 500 on first DB query. | `database.js:92-94` |
| JWT expired/invalid | `requireAuth` returns 401. Frontend `Auth.refreshUser()` catches the error and calls `logout()`, clearing localStorage. | `auth.js:16-22, auth.js:71-74` |
| Duplicate upvote (race condition) | `UserUpvote.findOne()` checks first. Even if two requests slip through, the compound unique index on `(issue_id, user_id)` will throw a duplicate key error. The `$inc: -1` on the second toggle ensures the counter self-corrects. | `issues.js:401-424` |
| Duplicate verification | Returns HTTP 409 "You have already verified this issue". Compound unique index prevents DB-level duplicates. | `issues.js:430-434` |
| File upload on nonexistent issue | Uploaded file is cleaned up with `fs.unlinkSync(req.file.path)` before returning 404. Prevents orphaned files. | `issues.js:526-529` |
| Screenshot AI verification fails | Returns 400 to user with explicit message. File already cleaned up. No points awarded, no state changed. | `issues.js:541-543` |

---

## 4. Technical Challenges, Trade-offs & Edge Cases

### 4.1 Hardest Technical Bottlenecks

**1. Upvote Counter Race Condition (Atomicity Problem)**

*Root cause:* Upvoting involves a read-modify-write cycle: check if upvote exists → create/delete upvote record → increment/decrement counter. Two concurrent requests for the same user could both pass the `findOne` check before either writes.

*Fix implemented:* The compound unique index `{ issue_id: 1, user_id: 1 }` on `UserUpvote` acts as a database-level mutex. If two concurrent `create()` calls race, the second one throws a duplicate key error. The counter is maintained via `$inc` (atomic MongoDB operation), not read-then-write. Additionally, there's a floor guard: `Math.max(0, issue.upvotes)` prevents negative upvote counts, and if the counter ever goes negative, it's reset to 0 (`issues.js:416-418`).

**2. AI Response Parsing Instability**

*Root cause:* LLMs don't reliably produce valid JSON. Gemini sometimes wraps responses in markdown code blocks (`` ```json ... ``` ``), adds explanatory text, or produces malformed JSON.

*Fix implemented:* Every Gemini response goes through a regex extraction: `responseText.match(/\{[\s\S]*\}/)` — this grabs the first JSON object from anywhere in the response, ignoring surrounding markdown or text. After parsing, every field is validated against a whitelist (`validCategories`, `validSeverities`) with safe defaults, and `confidence` is clamped to `[0, 1]` via `Math.min(1, Math.max(0, ...))`. This triple-layer defense (regex extraction → JSON.parse → field validation) handles all observed Gemini output variations.

**3. Screenshot Verification Trust Model**

*Root cause:* Users upload screenshots claiming they filed a complaint. The system must verify this without access to the government portal's database or API.

*Fix implemented:* Gemini Vision multimodal inference. The screenshot is base64-encoded and sent with a strict prompt: *"Does the screenshot explicitly show complaint ID '{id}'?"* → binary YES/NO. The prompt is designed to minimize hallucination by demanding exact string matching. If Vision AI fails (network error, API down), the function returns `false` (fail-secure), not `true`. Uploaded files are deleted immediately after base64 encoding to prevent disk exhaustion attacks. The hardcoded `mimeType: 'image/png'` is a known limitation — it should detect mime type from the file extension.

**4. N+1 Query Problem in Leaderboard**

*Root cause:* The leaderboard endpoint (`users.js:8-38`) fetches the top 50 users, then for **each user** issues 4 separate queries (`Issue.countDocuments` × 2, `Verification.countDocuments`, `Badge.find`). That's 50 × 4 = 200 sequential queries.

*Current state:* This is a known performance bottleneck. At current scale (< 100 users), it's acceptable. At scale, this would be solved by pre-computing leaderboard stats into a materialized view or using MongoDB's `$lookup` aggregation pipeline to join in a single query.

### 4.2 Architectural Trade-offs

| Decision | What We Gained | What We Sacrificed |
|---|---|---|
| **Vanilla JS SPA (no framework)** | Zero build step, instant iteration, tiny bundle size (~150KB total JS), no dependency hell, easy to onboard new developers | No component reuse, manual DOM management, no virtual DOM diffing (full `innerHTML` re-renders), no TypeScript safety |
| **Monolith (single process)** | One deployment unit, shared in-process state, no network hops between services, trivial debugging | Horizontal scaling limited — cannot scale backend independently of static file serving. Single point of failure. |
| **Denormalized upvote/verification counters** | O(1) reads for issue cards (no joins or counts) | Potential for counter drift if the application crashes between `$inc` and the source-of-truth write. Self-correcting via the floor guard. |
| **UUID strings as primary keys** | Database-agnostic API, no sequential ID enumeration attacks | 36-byte strings vs 12-byte ObjectIds = ~3x storage overhead per key. No natural ordering. |
| **Disk-based multer (not memory)** | Can handle 50MB video uploads without OOM | Requires explicit cleanup (`fs.unlinkSync`). If the process crashes between upload and cleanup, orphaned files persist. |
| **Free-tier Gemini** | Zero cost | 15 RPM cap. Under load, AI features silently degrade to keyword fallback. No SLA guarantee. |

### 4.3 Edge Cases Handled

- **Upvote floor guard:** `Math.max(0, issue.upvotes)` and conditional reset to 0 prevents negative upvote display (`issues.js:415-418`).
- **Case-insensitive email:** `email.toLowerCase().trim()` on both signup and login prevents `User@Email.com` ≠ `user@email.com` duplicate accounts (`auth.js:23, 57`).
- **XSS prevention:** `Utils.escapeHtml()` wraps all user-generated content (titles, descriptions, names) before DOM insertion. Uses the `textContent → innerHTML` sanitization pattern (`utils.js:257-261`).
- **Self-only delete:** `issue.reported_by !== req.user.id` guard prevents users from deleting others' issues (`issues.js:594`).
- **Orphan cleanup on delete:** Deleting an issue cascades to remove all associated comments, upvotes, and verifications (`issues.js:598-601`).
- **Idempotent seeding:** `User.countDocuments() > 0` skips re-seeding on every server restart.
- **Leaflet map cleanup:** `app.js:11` — `window.mainMap.remove()` on every route change prevents memory leaks from orphaned Leaflet instances.

**Known Unhandled Edge Cases:**
- **Image MIME type detection:** `verifyScreenshotWithAI` hardcodes `mimeType: 'image/png'` regardless of actual upload format. JPEG screenshots will still work because Gemini is format-tolerant, but it's technically incorrect.
- **No CSRF protection:** The API uses JWT in `Authorization` headers (not cookies), which inherently prevents CSRF. However, the JWT is stored in `localStorage`, making it vulnerable to XSS-based token theft. `httpOnly` cookies would be more secure.
- **No rate limiting:** No middleware like `express-rate-limit`. A malicious actor could spam issue creation or drain the Gemini free-tier quota.
- **No input length validation:** Issue titles and descriptions have no max-length enforcement server-side.
- **Puppeteer still in package.json:** The `puppeteer` dependency remains in `package.json` even though `rpa.js` was deleted. Should be removed to reduce install size by ~400MB.

---

## 5. Interviewer Grilling Session (Q&A Bank)

### Behavioral & Project Walkthrough

---

**Q1: "Walk me through this project from scratch."**

> I built Community Hero to solve a real problem I observed in Delhi NCR — citizens report infrastructure issues (potholes, broken streetlights, water leaks) on social media where complaints disappear into the void. There's no structured tracking, no accountability, and no escalation path.
>
> The platform has three layers: **Report → Verify → Escalate**. Citizens report issues with photos and GPS coordinates. The community upvotes and independently verifies them — this crowdsourced validation prevents spam and prioritizes genuinely critical problems. Finally, the platform uses Gemini AI to auto-generate formal government grievance letters, and when users file these on official portals, they upload a screenshot that gets cross-verified by Gemini Vision to earn escalation points.
>
> The tech stack is deliberately simple: a vanilla JS SPA frontend with Leaflet maps and Chart.js, an Express.js backend, MongoDB Atlas for persistence, and Google Gemini 2.5 Flash for all AI features. The entire backend runs as a single process — no microservices, no message queues. This was intentional: for a civic tool targeting community groups, deployment simplicity and zero operational cost matter more than theoretical scalability.

---

**Q2: "What was the hardest bug or technical difficulty you faced?"**

> The hardest challenge was making the AI classification pipeline resilient. Early on, Gemini would intermittently return responses wrapped in markdown code blocks, or add explanatory preamble before the JSON. This caused `JSON.parse()` to throw, crashing the classification flow.
>
> I solved it with a three-layer defense: First, a regex (`/\{[\s\S]*\}/`) extracts the first JSON object from anywhere in the response. Second, after parsing, I validate every field against a whitelist of known categories and severities, substituting defaults for unknown values. Third, the entire Gemini call is wrapped in a try-catch that falls through to a local keyword-based categorizer — so even if the AI is completely down, users still get automatic categorization.
>
> Another tricky issue was the upvote race condition. Two simultaneous toggle requests from the same user could both pass the "does upvote exist?" check and both create an upvote record. I fixed this with a compound unique index `{issue_id, user_id}` in MongoDB — the database itself rejects the duplicate write, and the counter uses atomic `$inc` operations rather than read-modify-write.

---

**Q3: "If you had to rebuild this from scratch today, what would you do differently?"**

> Three things:
>
> 1. **TypeScript.** The codebase is ~3,500 lines of vanilla JS across 20+ files. At this size, the lack of type safety becomes a maintenance burden. Interface definitions for the Issue, User, and API response shapes would catch bugs at compile time.
>
> 2. **Framework for the frontend.** The vanilla JS SPA works, but every page re-renders its entire HTML via `innerHTML`. With React or Svelte, I'd get component reuse, efficient DOM diffing, and proper state management. The report wizard's 4-step state machine would be much cleaner as a React component with `useReducer`.
>
> 3. **Background job queue for AI calls.** Right now, AI classification happens synchronously in the request path. If Gemini takes 3 seconds to respond, the user waits 3 seconds. With a job queue (Bull/Redis or even a simple in-memory queue), I'd return 202 immediately and update the issue asynchronously when classification completes. This also naturally handles rate limiting against the 15 RPM free-tier cap.

---

**Q4: "How did you test and validate that this works reliably?"**

> Testing was done at three levels:
>
> 1. **Manual end-to-end flows:** I seeded the database with 18 realistic Delhi NCR issues spanning all 7 categories and 4 statuses, then manually exercised every user journey — report, upvote, verify, comment, escalate, delete.
>
> 2. **AI fallback validation:** I tested with `GEMINI_API_KEY` unset to verify every AI function gracefully degrades. The keyword categorizer was validated against all 18 seed issues to ensure it produces reasonable categories.
>
> 3. **Edge case probing:** I tested duplicate upvotes (rapid double-click), duplicate verifications (returns 409), deleting someone else's issue (returns 403), expired JWT (auto-logout), uploading a 50MB video, and providing an empty screenshot to the gov-file endpoint.
>
> What's missing: I don't have automated unit tests or integration tests. If I were to add them, I'd use Jest for unit testing the keyword categorizer and Supertest for API endpoint integration tests with an in-memory MongoDB (via `mongodb-memory-server`).

---

### Deep-Dive Implementation & "Why" Questions

---

**Q5: "Why MongoDB instead of PostgreSQL? Your Issue schema looks very relational."**

> You're right that the schema has relational characteristics — users have many issues, issues have many comments, etc. I initially built this with SQLite, then considered PostgreSQL, and ultimately chose MongoDB Atlas for three reasons:
>
> 1. **Operational simplicity:** MongoDB Atlas provides a fully managed cloud database with automatic backups, scaling, and monitoring. For a solo developer deploying a civic tool, eliminating database ops is critical.
>
> 2. **Schema flexibility:** The Issue document has optional fields (`gov_*` metadata, `ai_*` fields, `resolved_at`) that are only populated at certain lifecycle stages. In a document model, these are naturally absent until set. In a relational schema, they'd be nullable columns cluttering every query.
>
> 3. **Aggregation framework:** The dashboard's analytics (category distribution, severity breakdown, 30-day trend, top areas) map directly to MongoDB's aggregation pipeline — `$group`, `$match`, `$sort`, `$project`. This is more expressive than raw SQL for the kind of multi-dimensional analytics this app needs.
>
> The trade-off is that I lose referential integrity and JOINs. I compensate with application-level validation and compound unique indexes for idempotency constraints.

---

**Q6: "Your leaderboard has an N+1 query problem. How would you fix it?"**

> Yes, the current implementation does 4 queries per user × 50 users = 200 sequential database calls. At current scale it's fine (< 10ms per query on Atlas), but it won't hold.
>
> The fix is a single aggregation pipeline using `$lookup`:
> ```javascript
> User.aggregate([
>   { $sort: { points: -1 } },
>   { $limit: 50 },
>   { $lookup: { from: 'issues', localField: 'id', foreignField: 'reported_by', as: 'issues' } },
>   { $lookup: { from: 'verifications', localField: 'id', foreignField: 'user_id', as: 'verifications' } },
>   { $lookup: { from: 'badges', localField: 'id', foreignField: 'user_id', as: 'badges' } },
>   { $addFields: {
>       issues_reported: { $size: '$issues' },
>       issues_resolved: { $size: { $filter: { input: '$issues', cond: { $eq: ['$$this.status', 'resolved'] } } } },
>       verifications_count: { $size: '$verifications' }
>   }}
> ])
> ```
> This reduces 200 queries to 1. For further optimization at scale, I'd materialize a `leaderboard_stats` collection updated via change streams or a periodic cron job.

---

**Q7: "Why did you use hash-based routing instead of History API pushState?"**

> Hash-based routing (`#home`, `#issue/123`) was chosen because the backend is a monolith serving static files. With `pushState`, refreshing `/issue/123` would hit the Express server, which would need to return `index.html` for every possible frontend route — which I do have via the SPA fallback (`GET * → index.html`), so `pushState` would actually work.
>
> The real reason was simplicity: hash changes don't trigger HTTP requests at all, so there's zero server involvement in routing. The router is 48 lines of code. For a project where frontend build tooling is explicitly avoided, this minimalism was the right trade-off. If I were using a framework like React Router or SvelteKit, I'd absolutely use `pushState` for cleaner URLs.

---

**Q8: "Why do you store UUIDs as strings instead of using MongoDB's native ObjectId?"**

> Database portability. The API contract returns `id: "550e8400-e29b-41d4-..."` — if I ever migrate from MongoDB to PostgreSQL, DynamoDB, or even a different MongoDB cluster, the application code and all API consumers remain unchanged. ObjectIds are MongoDB-specific 12-byte identifiers that would leak database implementation details into the API.
>
> The cost is ~3x storage overhead per key (36 bytes vs 12 bytes) and the loss of natural timestamp ordering that ObjectIds provide. At our data volume (hundreds, not millions of documents), this is negligible.

---

**Q9: "Walk me through your auth security model. What are the vulnerabilities?"**

> The auth model is JWT-based with bcrypt password hashing. The token payload contains `{ id, name, email }` and expires in 7 days. It's stateless — no session store, no token blacklist.
>
> **Strengths:**
> - bcrypt with salt rounds 10 (each hash takes ~100ms, resistant to brute-force)
> - JWT in `Authorization: Bearer` header (inherently CSRF-resistant, unlike cookies)
> - `optionalAuth` middleware allows graceful degradation for anonymous users
>
> **Vulnerabilities:**
> 1. **XSS → token theft:** JWT is stored in `localStorage`, which is accessible to any JavaScript on the page. If an XSS vulnerability exists, an attacker can steal the token. Mitigation: all user content is escaped with `Utils.escapeHtml()`, but a missed case could be catastrophic. `httpOnly` cookies would eliminate this vector.
> 2. **No token revocation:** If a token is compromised, there's no way to invalidate it before the 7-day expiry. Fix: add a token blacklist in Redis, checked on every `requireAuth` call.
> 3. **JWT secret in `.env`:** The secret is a static string. If leaked, all tokens can be forged. Fix: use RS256 (asymmetric keys) instead of HS256.
> 4. **No rate limiting on login:** An attacker could brute-force passwords. Fix: `express-rate-limit` on `/api/auth/login`.

---

**Q10: "How does your AI fallback system work? What's the keyword scoring algorithm?"**

> Every AI function has the pattern: try Gemini, catch and fall through to a local implementation. The keyword categorizer in `keywordCategorize()` works like this:
>
> 1. Concatenate title + description, lowercase.
> 2. For each of 6 categories, iterate through its keyword list. Each keyword that appears in the text adds to that category's score. Multi-word keywords (like "speed breaker" or "pot hole") score higher: `score += keyword.split(' ').length`. So "speed breaker" scores 2 while "road" scores 1.
> 3. The category with the highest score wins. If no keywords match, it defaults to "other".
> 4. Confidence is calculated as `min(0.95, 0.5 + score * 0.1)`. A score of 0 → confidence 0.3. A score of 4 → confidence 0.9.
> 5. Severity uses a cascading priority: check for "critical" keywords first (danger, hazard, emergency), then "high", then "medium", then "low". First match wins.
>
> This ensures the app is fully functional even when deployed in environments without internet access or API keys.

---

**Q11: "Why is the screenshot verification approach better than the previous RPA/Puppeteer approach?"**

> The original architecture used Puppeteer to launch a headless Chrome browser, navigate to a government portal, enter the complaint ID, take a screenshot, and then use Gemini Vision to verify the result. This had four critical problems:
>
> 1. **Resource cost:** Puppeteer requires ~300MB RAM per browser instance. On a free/cheap VPS, this is prohibitive.
> 2. **Fragility:** Government portals change their HTML structure frequently. Any DOM change breaks the scraper.
> 3. **Anti-bot defenses:** CAPTCHAs, IP blocking, and OTP walls made automated verification unreliable.
> 4. **Latency:** Launching a browser, navigating, waiting for page load, and screenshotting takes 5-15 seconds per verification.
>
> The new approach pushes the burden to the user: they file the complaint manually on the portal, screenshot the confirmation page, and upload it. Gemini Vision analyzes the screenshot in ~1 second without any browser overhead. The server reads the file, base64-encodes it, sends it to Gemini, and immediately deletes the file — the entire flow uses ~5MB RAM and completes in 2 seconds.

---

### Scale & System Design Follow-ups

---

**Q12: "How would this system break if traffic increased 100x tomorrow?"**

> It would break in four places, in order of severity:
>
> 1. **Gemini API rate limit** (15 RPM free tier): With 100x traffic, we'd hit the cap in seconds. AI features would silently degrade to keyword fallback, which works but loses classification accuracy. Fix: upgrade to paid tier, add request queuing with exponential backoff, cache AI results for identical inputs.
>
> 2. **MongoDB N+1 queries:** The leaderboard (200 queries), issue list (1 query per issue for reporter name), and issue detail (5+ queries for comments, verifiers, user state) would saturate connection pool. Fix: `$lookup` aggregation, denormalize `reporter_name` into Issue documents, add Redis caching layer with 5-minute TTL.
>
> 3. **Single-process Express:** One Node.js process handles all requests, static file serving, and file uploads. CPU-bound operations (bcrypt hashing) would block the event loop. Fix: cluster mode (`pm2 -i max`), offload static files to Nginx/CDN, move bcrypt to a worker thread.
>
> 4. **Disk-based uploads:** 100x users uploading 50MB videos would fill disk. Fix: stream uploads directly to S3/GCS, use signed URLs for direct-to-bucket uploads bypassing the server entirely.

---

**Q13: "Where is the single point of failure right now?"**

> The Express server process. If it crashes, everything is down — API, static files, all of it. There's no health check endpoint, no process manager (pm2/systemd), and no load balancer.
>
> MongoDB Atlas is *not* a SPOF — it's a managed replica set with automatic failover. Gemini is also not a SPOF because every function has a local fallback.
>
> Fix: Add a health check endpoint (`GET /healthz` returning 200 if Mongoose connection is ready), run behind pm2 in cluster mode with auto-restart, and put Nginx or a cloud load balancer in front.

---

**Q14: "How would you add real-time updates (e.g., live upvote counts)?"**

> Three options in increasing complexity:
>
> 1. **Short polling** (simplest): Frontend polls `GET /api/issues/:id` every 10 seconds. Easy but wastes bandwidth and doesn't feel real-time.
>
> 2. **Server-Sent Events (SSE):** Add an `EventSource` endpoint. When an upvote occurs, broadcast to all connected clients viewing that issue. Unidirectional (server→client only), which is exactly what we need. No WebSocket library overhead.
>
> 3. **WebSocket (Socket.io):** Bidirectional, allows features like live comments, typing indicators. More complex, requires sticky sessions if load-balanced.
>
> I'd go with SSE for upvote counts — it's native to browsers (no library needed), works through proxies, and auto-reconnects.

---

**Q15: "How would you handle distributed transactions across your services?"**

> Currently there are no distributed transactions because it's a monolith with a single database. But the gov-file endpoint does have a multi-step process that resembles a saga: upload file → verify with AI → update issue → award points → create comment → check badge.
>
> If any step fails mid-way, we could have inconsistent state (e.g., points awarded but comment not created). Currently, the entire block is wrapped in a try-catch — if anything throws, the route returns 500 and the client can retry. But the operations already executed (like `issue.save()`) are not rolled back.
>
> To fix this properly, I'd use MongoDB multi-document transactions (supported since MongoDB 4.0):
> ```javascript
> const session = await mongoose.startSession();
> session.startTransaction();
> try {
>   await issue.save({ session });
>   await User.updateOne({...}, { session });
>   await Comment.create([{...}], { session });
>   await session.commitTransaction();
> } catch (e) {
>   await session.abortTransaction();
>   throw e;
> }
> ```

---

**Q16: "How would you implement rate limiting?"**

> I'd add `express-rate-limit` middleware with different tiers:
>
> ```javascript
> const rateLimit = require('express-rate-limit');
>
> // Global: 100 requests per minute per IP
> app.use(rateLimit({ windowMs: 60000, max: 100 }));
>
> // Auth endpoints: 5 attempts per 15 minutes (brute-force protection)
> app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60000, max: 5 }));
>
> // AI endpoints: 10 per minute (protect Gemini quota)
> app.use('/api/issues/analyze', rateLimit({ windowMs: 60000, max: 10 }));
> ```
>
> At scale, I'd move from in-memory rate limiting to Redis-backed sliding window counters, using `rate-limit-redis` as the store. This ensures rate limits are consistent across multiple server instances.

---

**Q17: "What would you do about the localStorage JWT vulnerability?"**

> Move to `httpOnly` + `Secure` + `SameSite=Strict` cookies. The token would no longer be accessible to JavaScript, eliminating the XSS → token theft vector entirely.
>
> The trade-off: I'd need CSRF protection (a `csrf-token` double-submit pattern) since the browser would auto-send the cookie. I'd also need to handle CORS more carefully — the cookie domain must match the API domain.
>
> Alternatively, I could keep the current approach but add Content Security Policy headers and a strict CSP meta tag to prevent inline script execution, reducing the XSS attack surface.

---

**Q18: "Your Issue schema stores lat/lng as simple Number fields. How would you support geo-queries at scale?"**

> MongoDB has native geospatial support. I'd change the schema to use a GeoJSON `Point`:
> ```javascript
> location: {
>   type: { type: String, enum: ['Point'], default: 'Point' },
>   coordinates: { type: [Number], required: true } // [lng, lat]
> }
> ```
> Then create a `2dsphere` index:
> ```javascript
> issueSchema.index({ location: '2dsphere' });
> ```
> This enables `$near`, `$geoWithin`, and `$geoIntersects` queries. For example, "find all issues within 2km of the user's location":
> ```javascript
> Issue.find({
>   location: {
>     $near: {
>       $geometry: { type: 'Point', coordinates: [lng, lat] },
>       $maxDistance: 2000
>     }
>   }
> })
> ```
> This would power features like "Issues near me" and radius-based notifications.

---

**Q19: "How would you add image moderation to prevent offensive uploads?"**

> Two approaches:
>
> 1. **Gemini-based moderation (zero additional cost):** Before saving the image, send it to Gemini with a safety prompt: *"Does this image contain explicit, violent, or offensive content? Answer YES or NO."* The Gemini API also has built-in `safetySettings` that can reject harmful content at the API level.
>
> 2. **Google Cloud Vision SafeSearch Detection (more reliable):** The Vision API has a dedicated SafeSearch feature that returns likelihood scores for `adult`, `violence`, `racy`, etc. I'd add this as a pre-save hook: if any score exceeds `LIKELY`, reject the upload with a 400.
>
> I'd go with option 1 since we're already paying for (or using the free tier of) Gemini. It keeps the dependency graph minimal.

---

**Q20: "Walk me through what happens when a user opens the Dashboard page."**

> 1. Browser hash changes to `#dashboard`. `app.js:router()` matches and calls `renderDashboardPage()`.
> 2. The function renders the full dashboard HTML skeleton with 4 stat cards (showing `--`), 4 empty canvas elements for charts, a predictions panel with a spinner, and an activity feed with a spinner.
> 3. It then calls `loadDashboardData()` and `loadPredictions()` concurrently (both are independent async calls).
>
> **`loadDashboardData():`**
> - Calls `GET /api/issues/stats`.
> - Server runs 7 MongoDB aggregation pipelines in sequence: total count, resolved count, user count, avg resolution time, by-category, by-status, by-severity, 30-day trend, top areas, recent activity (with reporter names joined).
> - Frontend receives the response and: animates stat card numbers with `Utils.animateCount()` (eased cubic animation via `requestAnimationFrame`), creates 4 Chart.js instances (doughnut for categories, bar for statuses, line for 30-day trend with 30 date labels gap-filled, horizontal bar for top areas), and populates the activity feed with clickable links to issue detail pages.
>
> **`loadPredictions():`**
> - Calls `GET /api/issues/predictions`.
> - Server aggregates category stats for the past 7 days, then calls `generatePredictions()` which sends the stats to Gemini with a prompt requesting 3-4 predictive insights with trend direction and confidence scores.
> - Frontend renders each prediction with a trend emoji (📈/📉/📊) and confidence percentage.

---

**Q21: "What design patterns are present in this codebase?"**

> 1. **Middleware Chain (Express):** `requireAuth → multer → route handler` — each middleware transforms the request and passes control via `next()`. This is the Chain of Responsibility pattern.
> 2. **Strategy Pattern (AI fallback):** `analyzeIssue` dynamically selects between Gemini (primary strategy) and keyword categorizer (fallback strategy) based on runtime configuration.
> 3. **Observer Pattern (Auth state):** `Auth.onChange(fn)` registers listeners; `Auth._notify()` broadcasts to all subscribers when auth state changes. The navbar re-renders itself via this mechanism.
> 4. **Singleton (Gemini model):** `genAI` and `model` are module-level variables initialized once by `initGemini()` and reused across all requests.
> 5. **Template Method (seed function):** `seedDatabase()` follows a fixed algorithm — connect → check if seeded → seed users → seed issues → seed badges — with the data details filled in.
> 6. **Facade (API client):** `api.js` exposes a clean interface (`API.createIssue()`, `API.upvoteIssue()`) hiding the `fetch`, header construction, error handling, and content-type logic behind a unified `_request()` method.

---

**Q22: "What monitoring and observability would you add for production?"**

> Currently there's zero observability — just `console.log` and `console.error`.
>
> I'd add:
> 1. **Structured logging:** Replace `console.error` with `pino` or `winston` with JSON output. Include request ID, user ID, latency, and status code on every request.
> 2. **Health check endpoint:** `GET /healthz` returning `{ status: 'ok', db: 'connected', gemini: true/false }`.
> 3. **APM:** Datadog or New Relic Node.js agent for request tracing, error tracking, and latency percentiles.
> 4. **Error tracking:** Sentry SDK for automatic exception capture with stack traces and request context.
> 5. **Custom metrics:** Track Gemini API latency, fallback rate (how often keyword categorizer is used), upvote/verification counts per hour, and p95 response times per endpoint.
> 6. **Alerting:** PagerDuty webhook on: error rate > 5%, p95 latency > 2s, MongoDB connection failures, Gemini API 429s.

---

## 6. Rapid-Fire Cheat Sheet

### Key Numbers
| Metric | Value |
|---|---|
| Total source files | 32 (20 frontend + 12 backend) |
| Total JS (backend) | ~1,900 lines |
| Total JS (frontend) | ~2,200 lines |
| Mongoose models | 6 (User, Issue, Comment, Verification, UserUpvote, Badge) |
| API endpoints | 14 REST endpoints |
| Gemini AI functions | 4 (analyze, predict, grievance letter, screenshot verify) |
| Seed data | 8 users, 18 issues, 12 badges |
| Issue categories | 7 (pothole, water, streetlight, waste, road, infrastructure, other) |
| Issue statuses | 4 (reported → verified → in_progress → resolved) |
| Severity levels | 4 (low, medium, high, critical) |
| Badges | 6 types (first_responder, eagle_eye, problem_solver, community_star, streak_master, civic_champion) |
| Upload limit | 50MB per file |
| JWT expiry | 7 days |
| bcrypt salt rounds | 10 |
| Gemini model | gemini-2.5-flash |
| Gemini rate limit | 15 RPM / 1,500 RPD (free tier) |

### Points Economy
| Action | Points |
|---|---|
| Report issue | +10 |
| Verify issue | +5 |
| Comment | +2 |
| Upvote | +1 |
| File with Govt | +15 |
| Issue resolved (reporter) | +20 |

### API Endpoint Cheat Sheet
```
Auth:    POST /api/auth/signup      POST /api/auth/login      GET /api/auth/me
Issues:  GET  /api/issues           GET  /api/issues/stats     GET  /api/issues/predictions
         GET  /api/issues/:id       POST /api/issues           POST /api/issues/analyze
         PATCH /api/issues/:id/status
         POST /api/issues/:id/upvote    POST /api/issues/:id/verify
         POST /api/issues/:id/comments  GET  /api/issues/:id/gov-draft
         POST /api/issues/:id/gov-file  DELETE /api/issues/:id
Users:   GET  /api/users/leaderboard    GET  /api/users/:id/stats
```

### Buzzwords & Patterns Demonstrated
- **Multimodal AI (Gemini Vision)** — text + image inference in one model
- **Graceful degradation** — AI fallback to keyword matching
- **Gamification engine** — points, badges, leaderboard
- **Crowdsourced verification** — community-validated issue reports
- **GeoJSON-ready architecture** — lat/lng stored for future 2dsphere indexing
- **Atomic counter updates** — MongoDB `$inc` with compound unique index idempotency
- **SPA monolith** — zero-build-step, single-process deployment
- **Multipart file upload pipeline** — multer → base64 → AI → cleanup
- **Aggregation pipeline analytics** — 7 MongoDB aggregations powering dashboard
- **Observer pattern auth state** — reactive UI updates on login/logout

# LinkMetrics — System Design Document

> **Who this document is for:** Anyone who opens this repo and wants to understand not just *what* was built, but *why* every decision was made. Written by the author, for engineers reviewing the codebase.

---

## Table of Contents

1. [What This Project Is](#1-what-this-project-is)
2. [High-Level Architecture](#2-high-level-architecture)
3. [The Two Traffic Paths](#3-the-two-traffic-paths)
4. [Database Design](#4-database-design)
5. [Authentication System](#5-authentication-system)
6. [URL Shortening & Slug Generation](#6-url-shortening--slug-generation)
7. [Redirect System](#7-redirect-system)
8. [Analytics Pipeline](#8-analytics-pipeline)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Deployment Architecture](#10-deployment-architecture)
11. [What Would Break at Scale — and How to Fix It](#11-what-would-break-at-scale--and-how-to-fix-it)
12. [Security Decisions](#12-security-decisions)
13. [What I'd Do Differently](#13-what-id-do-differently)
14. [Future Roadmap](#14-future-roadmap)

---

## 1. What This Project Is

LinkMetrics is a multi-tenant URL shortener SaaS. Users register, create workspaces, shorten long URLs into short slugs, share those links, and see analytics on who clicked — broken down by browser, device, country, and referrer.

**The core technical challenge** is that a URL shortener has two completely different performance requirements that live in the same codebase:

- **Redirects** must be instant (every millisecond of delay is felt by the end user)
- **Analytics** must be accurate (every click must be captured and queryable)

These two requirements conflict — writing analytics data takes time, but you can't make the user wait for it. The entire architecture is designed around resolving this conflict.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
└───────────────┬──────────────────────┬──────────────────┘
                │                      │
     Dashboard traffic             Redirect traffic
     (authenticated)                (public)
                │                      │
┌───────────────▼──────────┐  ┌────────▼─────────────────┐
│   React Frontend          │  │   Express API Server      │
│   Vercel (CDN)            │  │   Railway                 │
│                           │  │                           │
│  - TanStack Query cache   │  │  GET /:slug               │
│  - Zustand auth state     │  │  → DB lookup (indexed)    │
│  - react-hook-form + Zod  │  │  → 302 redirect           │
│  - Recharts analytics     │  │  → async click log        │
└───────────────┬──────────┘  └────────┬─────────────────┘
                │                      │
                └──────────┬───────────┘
                           │ Prisma ORM
              ┌────────────▼────────────┐
              │   PostgreSQL            │
              │   Supabase              │
              │                         │
              │  - Users                │
              │  - Workspaces           │
              │  - Links                │
              │  - ClickEvents          │
              └─────────────────────────┘
```

**Tech stack:**

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + TypeScript | Industry standard, strong typing |
| Styling | Tailwind CSS v4 | Utility-first, no CSS files to maintain |
| State | Zustand + persist | Minimal boilerplate, survives page refresh |
| Data fetching | TanStack Query | Caching, deduplication, auto-refetch |
| Backend | Express + TypeScript | Flexible, well-understood, monorepo-friendly |
| ORM | Prisma | Type-safe queries, migration management |
| Database | PostgreSQL (Supabase) | ACID compliance, powerful GROUP BY for analytics |
| Auth | JWT (jsonwebtoken) | Stateless — scales horizontally without shared session store |
| Deployment | Vercel + Railway | Best-in-class for frontend and Node.js respectively |

---

## 3. The Two Traffic Paths

This is the most important mental model for understanding this codebase.

### Path 1 — Redirect (latency-critical)

```
User clicks short link
        ↓
GET /:slug (Express catch-all route — registered LAST)
        ↓
LinkRepository.findBySlug() → Prisma SELECT with @@index([slug])
        ↓
Validity check: isActive? expiresAt?
        ↓
res.redirect(302, originalUrl)   ← USER IS GONE AT THIS POINT
        ↓ (setImmediate — runs after response is sent)
parseRequestMeta(ip, userAgent, referrer)
  → geoip.lookup() — local database, ~1ms
  → UAParser() — in-memory parsing, ~1ms
  → URL.hostname — string operation, <1ms
        ↓
LinkRepository.logClick() → Prisma INSERT INTO ClickEvent
```

**Key decision:** `setImmediate` queues the analytics write to run after the HTTP response is sent. The user's browser receives the redirect in ~20ms. The click is recorded ~5ms after that. The user never waits for analytics.

### Path 2 — Dashboard (data-critical)

```
User opens dashboard
        ↓
React → axios GET /api/links?workspaceId=xxx
        ↓ Authorization: Bearer <JWT>
requireAuth middleware → jwt.verify() → req.user = { userId, email }
        ↓
requireWorkspace → validates user is member of workspace
        ↓
LinkController.list() → LinkService.listLinks()
        ↓
LinkRepository.findByWorkspace() → Prisma SELECT with _count
        ↓
JSON response → TanStack Query cache → React re-renders
```

**Key decision:** Every query is scoped to a `workspaceId`. User A can never see User B's data, even if they guess the URL.

---

## 4. Database Design

### Schema overview

```
User ──< WorkspaceMember >── Workspace ──< Link ──< ClickEvent
```

### Why this structure?

**`WorkspaceMember` as a join table** (not a direct User→Workspace foreign key) allows one user to belong to multiple workspaces with different roles. This is the standard pattern for multi-tenant SaaS products like Slack, Notion, and Linear.

**`ClickEvent` as a raw event log** (not a counter) means you can answer any analytics question retroactively. A counter (`clicks: 47`) can only tell you the total. A raw event table can answer: clicks from Safari last Tuesday, clicks from India in December, unique countries this week.

### Index strategy

```prisma
model Link {
  @@index([slug])          // Critical: O(log n) redirect lookups
  @@index([workspaceId])   // Dashboard list queries
}

model ClickEvent {
  @@index([linkId, timestamp])  // Analytics date-range queries
}
```

**Without `@@index([slug])`:** every redirect does a full table scan — O(n). At 1 million links, that's ~1000ms per redirect. With the index: O(log n) — ~1ms. This single index is the most performance-critical line in the codebase.

**The composite `@@index([linkId, timestamp])`:** analytics queries always filter by `linkId` AND a date range. A composite index on both columns means the database uses a single index scan instead of two separate ones.

### Privacy decision — IP hashing

Raw IP addresses are personal data under GDPR. Instead of storing `203.0.113.42`, the system stores:

```
sha256("203.0.113.42" + JWT_SECRET) = "a3f8c2..."
```

This lets you count unique visitors (same IP = same hash) without storing recoverable personal data. The JWT_SECRET salt means the hash can't be reverse-looked-up even with a rainbow table.

---

## 5. Authentication System

### JWT over sessions — why?

Sessions require a shared session store (Redis or database) that every server instance must access. If you run 3 Express instances behind a load balancer, all 3 need to read from the same store.

JWTs are self-contained. The token `eyJhbGciOiJIUzI1NiJ9...` contains the user's `userId` and `email` inside it, signed with `JWT_SECRET`. Any server instance can verify it independently with just the secret. This means the backend scales horizontally without any coordination overhead.

### Token lifecycle

```
Register/Login
  → bcrypt.hash(password, 12) → stored in DB
  → jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' })
  → token returned to client

Client stores token in Zustand + localStorage (survives refresh)

Every subsequent request:
  → axios interceptor attaches: Authorization: Bearer <token>
  → requireAuth middleware: jwt.verify(token, JWT_SECRET)
  → if valid: req.user = decoded payload → next()
  → if expired/invalid: 401 → axios interceptor calls logout()
  → Zustand clears → localStorage cleared → redirect to /login
```

### Why bcrypt cost factor 12?

bcrypt is intentionally slow. Cost 12 takes ~300ms to hash one password. If an attacker steals the database and tries to brute-force passwords, each guess costs them 300ms. Brute-forcing 1 million passwords at 300ms each = ~3.5 days on a single machine. Cost 10 is faster but weaker. Cost 14 is safer but login feels sluggish. 12 is the industry standard balance.

### Security: same error for wrong email and wrong password

```typescript
// WRONG — leaks which emails are registered
if (!user) return res.status(404).json({ error: 'Email not found' })
if (!valid) return res.status(401).json({ error: 'Wrong password' })

// CORRECT — reveals nothing
if (!user || !valid) return res.status(401).json({ error: 'Invalid credentials' })
```

If you return different errors, an attacker can enumerate registered emails by trying thousands of addresses and seeing which ones say "wrong password" instead of "not found."

---

## 6. URL Shortening & Slug Generation

### How nanoid works

`nanoid(7)` picks 7 characters from a URL-safe alphabet (A-Za-z0-9_-) using a cryptographically secure random number generator. That's 64^7 = **4.4 trillion combinations**.

### Collision handling

```typescript
for (let i = 0; i < 5; i++) {
  const slug = nanoid(7)
  const existing = await LinkRepository.findBySlug(slug)
  if (!existing) return slug   // unique — use it
}
throw new Error('Could not generate unique slug')
```

At 1 million existing slugs, the probability of a single collision is 1 million / 4.4 trillion = **0.00002%**. The retry loop is defensive engineering — it will practically never trigger, but it means the system handles the case correctly if it does.

### Why not hash the original URL?

Hashing `https://google.com` always produces the same slug. This seems convenient, but it means:
- Two users shortening the same URL would get the same slug (privacy violation)
- Analytics from different users would be mixed together

Random generation avoids both problems.

### Custom slugs

If a user supplies a custom slug (e.g., `my-campaign`), the service validates format with Zod (`/^[a-zA-Z0-9-]{3,50}$/`) and checks uniqueness before saving. This skips the nanoid generation entirely.

---

## 7. Redirect System

### Why 302 instead of 301?

- **301 Permanent:** Browser caches the redirect forever. After the first click, the browser never contacts your server again — it redirects locally. Analytics stop working for repeat visitors.
- **302 Temporary:** Browser always asks your server. Every click goes through your system, so every click is tracked.

For a URL shortener where analytics is a core feature, 302 is the correct choice.

### The critical route ordering problem

`/:slug` is a catch-all route. If registered before `/api/*` routes, it intercepts every API call:

```typescript
// WRONG — /:slug swallows /api/auth/login
app.get('/:slug', RedirectController.redirect)
app.use('/api/auth', authRoutes)

// CORRECT — specific routes first, catch-all last
app.use('/api/auth', authRoutes)
app.use('/api/links', linkRoutes)
app.use('/api/workspaces', workspaceRoutes)
app.get('/:slug', RedirectController.redirect)  // catch-all LAST
app.use(errorHandler)                            // error handler LAST of all
```

---

## 8. Analytics Pipeline

### Data collection during redirect

```typescript
// In parseRequestMeta():

// 1. Country/city — local GeoIP database, no network call, ~1ms
const geo = geoip.lookup(ip)
// → { country: 'IN', city: 'Hyderabad' }

// 2. Device/browser/OS — User-Agent string parsing, in-memory, ~1ms
const ua = new UAParser(userAgent)
// → { browser: 'Chrome', os: 'macOS', device: 'desktop' }

// 3. Referrer — just the hostname (strips query params for privacy)
new URL(referrer).hostname
// → 'twitter.com' (not the full URL with tracking params)

// 4. IP — hashed, not stored raw
sha256(ip + JWT_SECRET)
// → 'a3f8c2...'
```

Everything runs in memory. No external API calls. Zero added latency to the redirect.

### Analytics queries — why SQL aggregation, not JavaScript

**Wrong approach:**
```typescript
const allClicks = await prisma.clickEvent.findMany({ where: { linkId } })
const byChromeCount = allClicks.filter(c => c.browser === 'Chrome').length
// Loads 10,000 rows into JS memory to count them
```

**Correct approach:**
```typescript
await prisma.clickEvent.groupBy({
  by: ['browser'],
  _count: { browser: true }
})
// SQL: SELECT browser, COUNT(*) FROM ClickEvent GROUP BY browser
// Returns 5 rows, not 10,000
```

The database is optimised for aggregation. It uses the index, runs the COUNT in storage, and returns only summary rows. At 1 million clicks, the difference is 10MB of memory and 3 seconds vs 5 rows and 30ms.

### Why Promise.all for analytics?

```typescript
// Sequential — 5 × 30ms = 150ms total
const total = await countClicks()
const byCountry = await groupByCountry()
const byDevice = await groupByDevice()
// ...

// Parallel — max(30ms, 30ms, 30ms) = 30ms total
const [total, byCountry, byDevice, byBrowser, byReferrer] =
  await Promise.all([countClicks(), groupByCountry(), groupByDevice(), ...])
```

All 5 queries are independent. There's no reason to wait for one before starting the next. `Promise.all` runs them in parallel for free — 5x faster with zero code complexity tradeoff.

---

## 9. Frontend Architecture

### Why Zustand over Redux?

Redux requires: actions, reducers, selectors, middleware, a store configuration file. For auth state (user + token + two functions), that's 100+ lines of boilerplate.

Zustand requires:

```typescript
const useAuthStore = create(persist((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}), { name: 'auth-storage' }))
```

12 lines. Same functionality. The `persist` middleware handles localStorage sync automatically.

### Why TanStack Query over useEffect + useState?

```typescript
// Without TanStack Query — manual, error-prone
const [links, setLinks] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

useEffect(() => {
  setLoading(true)
  fetch('/api/links')
    .then(r => r.json())
    .then(setLinks)
    .catch(setError)
    .finally(() => setLoading(false))
}, [workspaceId])  // refresh on workspaceId change? manual

// With TanStack Query
const { data: links, isLoading, error } = useQuery({
  queryKey: ['links', workspaceId],
  queryFn: () => api.get('/api/links').then(r => r.data),
  enabled: !!workspaceId,
})
```

TanStack Query also provides: automatic caching (same query = no re-fetch within 30s), background refetching, `invalidateQueries` after mutations, deduplication of concurrent requests, and loading/error states for free.

### Layered frontend data flow

```
Component
  → calls useLinks() hook (from lib/hooks.ts)
    → TanStack Query calls api.get('/api/links') (from lib/api.ts)
      → axios interceptor attaches JWT
        → Express API responds
          → TanStack Query caches response
            → Component renders with data
```

No component ever imports `axios` directly. No component knows the API URL. If the endpoint changes, you change one line in `lib/hooks.ts`.

---

## 10. Deployment Architecture

### Why three separate services?

| Service | Hosts | Why |
|---------|-------|-----|
| Vercel | React frontend | Global CDN, zero-config Vite deployment, auto-deploys on push |
| Railway | Express API | Simple Node.js hosting, env var management, GitHub integration |
| Supabase | PostgreSQL | Managed database, visual table explorer, free tier |

Each is best-in-class for its role. Separation also means they're independently replaceable — swapping Railway for AWS doesn't touch Vercel or Supabase.

### Monorepo structure

```
LinkMetrics/
├── apps/
│   ├── api/        ← Express backend (Railway deploys from here)
│   └── web/        ← React frontend (Vercel deploys from here)
└── prisma/         ← Schema and migrations (shared)
```

**Why monorepo:** One git history, one PR process, atomic commits across both apps. Shared TypeScript types are possible. The tradeoff is slightly more complex deployment configuration (both services need a `Root Directory` setting), but both Railway and Vercel handle this cleanly.

### CI/CD

Both services are connected to the GitHub repo and watch the `main` branch. Push to GitHub → Railway rebuilds the API → Vercel rebuilds the frontend. Zero manual deployment steps after initial setup.

---

## 11. What Would Break at Scale — and How to Fix It

### 10 users
Nothing breaks. Current architecture handles this comfortably.

### 1,000 users
- **Problem:** Every redirect hits the database. At 100 redirects/second, that's 100 simultaneous Prisma queries.
- **Fix:** Add Redis caching (Upstash). Slug → URL mapping is cached with 1-hour TTL. 95%+ of redirects become cache hits (~1ms instead of ~20ms). Invalidate cache on link update/delete.

```typescript
// Cache-aside pattern
const cached = await redis.get(`link:${slug}`)
if (cached) return res.redirect(302, cached)     // 1ms
const link = await prisma.link.findUnique(...)    // 20ms on miss
await redis.setex(`link:${slug}`, 3600, link.originalUrl)
```

### 100,000 users
- **Problem:** ClickEvent table grows to tens of millions of rows. Analytics GROUP BY queries take seconds.
- **Fix 1:** Move redirect to Vercel Edge Functions — runs at CDN nodes globally, not a single Railway server. Sub-10ms redirects worldwide.
- **Fix 2:** Pre-aggregate analytics into a `click_aggregates_daily` table. Increment counters on write instead of computing at read time.
- **Fix 3:** Horizontal scaling of the API — JWT means any instance can handle any request, no session coordination needed.

### 1,000,000 users
- **Problem:** setImmediate click logging loses events on server restart. Single database becomes write bottleneck.
- **Fix 1:** Replace setImmediate with a message queue (AWS SQS, RabbitMQ). Click events are durably queued before processing. Server restarts don't lose data.
- **Fix 2:** Partition ClickEvent table by month. Old partitions are archived, queries only scan the current month.
- **Fix 3:** Read replica for analytics queries — write to primary, read analytics from replica.

---

## 12. Security Decisions

| Decision | Why |
|----------|-----|
| Passwords hashed with bcrypt (cost 12) | Brute-forcing requires 300ms per guess — makes offline attacks impractical |
| JWTs signed with HS256 | Standard algorithm, well-audited, supported everywhere |
| IP addresses hashed (SHA-256 + salt) | GDPR compliance — can count unique visitors without storing personal data |
| Referrer stored as hostname only | Strips tracking params from referrer URLs — privacy protection |
| Same error for wrong email/password | Prevents email enumeration attacks |
| Helmet.js on all responses | Sets 11 security headers automatically (CSP, HSTS, X-Frame-Options, etc.) |
| CORS restricted to known origin | Only the Vercel frontend can make cross-origin requests to the API |
| Workspace middleware on all link routes | API-level tenant isolation — users can't access other workspaces even by guessing IDs |

### Current security gaps (honest assessment)

- **No URL safety check:** Any URL can be shortened, including phishing sites. Production fix: validate against Google Safe Browsing API before storing.
- **No rate limiting:** The `/shorten` endpoint can be called in a loop. Fix: `express-rate-limit` with Redis store, 10 requests/minute per IP.
- **JWT cannot be invalidated before expiry:** If a token is stolen, it works for up to 7 days. Fix: maintain a token blocklist in Redis, checked on every request.

---

## 13. What I'd Do Differently

**1. Add Redis from day one.** The caching layer should have been part of the MVP. Adding it later requires updating the redirect handler and adding cache invalidation in every place that modifies links.

**2. Use a message queue for click logging instead of setImmediate.** `setImmediate` is simple but lossy. A queue (even something lightweight like BullMQ with Redis) would give durability guarantees with similar simplicity.

**3. Start with URL safety validation.** Checking URLs against Google Safe Browsing API is straightforward and should have been in the MVP. Skipping it means the system can be abused to shorten malicious links.

**4. Add structured logging from the start.** `console.log` is fine for development but production debugging requires structured logs with request IDs, timestamps, and severity levels. Winston or Pino would have been a one-time setup cost.

---

## 14. Future Roadmap

### V2 — Performance (in progress)
- [ ] Redis cache-aside for redirects (Upstash)
- [ ] Vercel Edge Function for sub-10ms global redirects
- [ ] Rate limiting on shorten and redirect endpoints
- [ ] Supabase Row Level Security for database-level tenant isolation
- [ ] Link expiration and password-protected links

### V3 — AI Features
- [ ] AI UTM tag suggestions via LLM API (analyze URL → suggest campaign parameters)
- [ ] Natural language analytics summary ("Your link peaked on Tuesday, mostly from mobile users in India")
- [ ] URL safety check via Google Safe Browsing API
- [ ] CSV/JSON analytics export

### V4 — SaaS
- [ ] Stripe billing integration (free/pro/team tiers)
- [ ] Custom domains (bring your own domain)
- [ ] A/B testing for links (split traffic between two destinations)
- [ ] QR code generation for each link
- [ ] Slack/email notifications on click spikes
- [ ] Team activity audit logs

---

*Built by Sriya Desaraju · [GitHub](https://github.com/Sriyadesaraju/LinkMetrics) · [Live Demo](https://link-metrics-web.vercel.app/login)*
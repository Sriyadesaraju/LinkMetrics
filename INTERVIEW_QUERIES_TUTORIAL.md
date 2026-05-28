# Interview Queries Across Database Schemas: LinkMetrics Deep Dive

**Project:** LinkMetrics  
**Focus:** Understanding SaaS architecture through real database queries  
**Audience:** Beginners learning production database design  
**Date:** May 28, 2026

---

## Table of Contents

1. [Teaching Philosophy](#teaching-philosophy)
2. [CORS & Security Deep Dive](#cors--security-deep-dive)
3. [Database Schema Explained](#database-schema-explained)
4. [Interview Queries & Data Flows](#interview-queries--data-flows)
5. [Key Concepts Reference](#key-concepts-reference)

---

## Teaching Philosophy

This tutorial follows the **SaaS System Tutor Mode** — not just teaching code, but teaching how production systems think.

### Core Principles

- Explain **WHY** patterns exist, not just **WHAT** they do
- Show request/data flows visually
- Define jargon immediately when introduced
- Connect architecture → business logic → engineering tradeoffs
- Teach incrementally, not in information dumps

### For Learners New to Production SaaS

This tutorial assumes:
- You know basic SQL
- You can read code
- You DON'T have production database experience yet

We'll build intuition for:
- Multi-tenant database design
- Query optimization
- Authentication & authorization flows
- Pre-aggregation patterns
- Scalable architecture decisions

---

## CORS & Security Deep Dive

### Issue: Dead Config That Gives False Sense of Safety

#### The Problem

The original code had this pattern:

```ts
// Line 13-21: Validate CORS_ORIGIN exists
const required = ["DATABASE_URL", "JWT_SECRET", "CORS_ORIGIN"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}

// Line 30: But... never actually use it
app.use(cors()); // ← No options! Wildcard mode!
```

#### What Happens

**What a developer THINKS:**
```
.env has CORS_ORIGIN=https://myapp.com
  ↓
Boot check: "CORS_ORIGIN exists? ✓ Good."
  ↓
cors() middleware applies CORS_ORIGIN restriction
  ↓
Only myapp.com can talk to the API ✓
```

**What ACTUALLY happens:**
```
.env has CORS_ORIGIN=https://myapp.com
  ↓
Boot check: "CORS_ORIGIN exists? ✓" (just checks existence, never uses value)
  ↓
cors() with NO arguments → defaults to wildcard (*)
  ↓
ANY website on earth can talk to the API ✗
```

**The "False Sense of Safety":**
- A developer reads the boot validation
- Feels safe ("we're protecting CORS")
- But the validation is **theater** — it never wires the value
- The intention exists in code, but doesn't execute

#### The Fix

```ts
app.use(cors({ origin: process.env.CORS_ORIGIN }));
//                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                    NOW the value is actually used
```

When CORS_ORIGIN is passed, only requests from that origin get the `Access-Control-Allow-Origin` header.

---

### CORS Explained: Browser Protection, Not Server Protection

#### What is an "origin"?

An origin is the combination of: `protocol + domain + port`

```
https://myapp.com        ← one origin
https://evil.com         ← different origin (different domain)
http://myapp.com         ← different origin (different protocol)
https://myapp.com:8080   ← different origin (different port)
```

#### Why Browsers Have CORS

**Scenario: You're logged into your bank**

```
You open https://bank.com
  ↓
You stay logged in (cookies in browser)
  ↓
You accidentally open https://evil.com in another tab
  ↓
WITHOUT CORS: evil.com's JS could do this:

  fetch("https://bank.com/transfer?to=attacker&amount=5000")
    ↓
  Your browser sends the request WITH your bank cookies
    ↓
  Bank sees valid session, executes transfer ✗
```

This attack is called **CSRF** (Cross-Site Request Forgery).

**CORS was invented to prevent exactly this.**

#### How CORS Works

When your browser makes a cross-origin request (to a different domain), it asks permission:

```
Browser: "Hey API, am I allowed to read your response?"
           (origin check happens BEFORE JavaScript gets the data)
           
API: "Access-Control-Allow-Origin: *"
     ↓
Browser: "Yes, * means everyone is allowed"
     ↓
Browser hands the response to JavaScript

---

API: "Access-Control-Allow-Origin: https://myapp.com"
     ↓
Browser (on evil.com): "evil.com ≠ myapp.com. BLOCKED."
     ↓
Browser prevents JavaScript from reading the response
```

**Important:** The request STILL reaches your server. CORS only blocks JavaScript from reading the response. Curl, Postman, scripts — they ignore CORS entirely.

#### The evil.com Attack Flow

```
WITHOUT CORS FIX (origin: *):

  User visits evil.com
       ↓
  evil.com JS runs:  fetch("https://your-api.com/api/links")
       ↓
  Request hits your API
       ↓
  API responds:  Access-Control-Allow-Origin: *
       ↓
  Browser: "* means everyone is allowed"
       ↓
  Browser hands the API response data to evil.com's JavaScript
       ↓
  evil.com can now READ your API's data ✗


WITH CORS FIX (origin: https://myapp.com):

  User visits evil.com
       ↓
  evil.com JS runs:  fetch("https://your-api.com/api/links")
       ↓
  Request hits your API
       ↓
  API responds:  Access-Control-Allow-Origin: https://myapp.com
       ↓
  Browser: "evil.com ≠ myapp.com. Request from wrong origin."
       ↓
  Browser BLOCKS JavaScript from reading the response
       ↓
  evil.com gets nothing ✓
```

#### The Nuance: localStorage vs Cookies

**This app stores JWT tokens in localStorage** — a much safer choice than cookies.

```
Cookies (used by banks):
  - Browser automatically sends them with EVERY request
  - Even if evil.com triggers a request, your cookie goes along
  - This makes CSRF attacks devastating

localStorage (used by this app):
  - Scoped to an origin
  - evil.com's JavaScript CANNOT read myapp.com's localStorage
  - evil.com cannot steal your JWT
  - evil.com cannot make authenticated API calls as you
```

**So the blast radius of * CORS is smaller here:**

```
evil.com tries to attack:
  ↓
Can it read your JWT from localStorage? NO ← localStorage is origin-scoped
  ↓
Can it make authenticated API calls as you? NO ← it doesn't have your JWT
  ↓
Can it read PUBLIC/unauthenticated endpoints? YES ← if CORS is *
```

**Still worth fixing CORS:**
- Defense in depth (multiple layers of security)
- Prevents reading public API data from victim's browser
- Matches documented security intent
- One-line fix with zero downside

**But the reason it's not catastrophic** is because tokens live in localStorage, not cookies.

#### CORS Doesn't Protect the Server

```
curl ignores CORS completely:

  curl -X GET https://your-api.com/api/links
    ↓
  CORS headers don't apply (no browser enforcement)
    ↓
  Hacker can call your API from anywhere

CORS ONLY protects:
- Users opening your site in a browser
- From JavaScript weaponization
```

**CORS is user protection, not server protection.**

---

## Database Schema Explained

### What This App Does

LinkMetrics lets teams create short links (like bit.ly), track clicks, and see analytics. Multiple people can share a workspace.

### Table 1: User

The simplest table — represents a person who signed up.

```
┌─────────────────────────────────────────┐
│                  User                   │
├──────────────┬──────────────────────────┤
│ id           │ "clabcd1234"  (unique)   │
│ email        │ "alice@gmail.com"        │
│ passwordHash │ "$2b$10$xyz..."          │
│ createdAt    │ 2025-01-15 09:00:00      │
└──────────────┴──────────────────────────┘
```

**What is `cuid()`?**

Instead of auto-incrementing numbers (1, 2, 3...), this generates a random string like `"clxyz123abc"`.

Why? Numbers are guessable:
```
GET /users/1
GET /users/2
GET /users/3
```

Random IDs aren't:
```
GET /users/clxyz123abc  ← can't guess the next one
```

**What is `passwordHash`?**

Passwords are NEVER stored in plain text. The password goes through a one-way function (bcrypt) that produces a scrambled string:

```
Raw password:     "mysecret123"
      ↓ bcrypt(one-way)
Stored hash:      "$2b$10$xyz...abc"

Later, to verify:
  User enters:    "mysecret123"
  Compare hash:   bcrypt("mysecret123") == stored hash?
  Result:         Yes → password is correct
```

You can verify a password against the hash, but you CANNOT reverse the hash back to the password. This is crucial for security — even if your database is leaked, passwords are useless.

---

### Table 2: Workspace

A Workspace is like a "team" or "project." One user might own multiple workspaces.

```
┌─────────────────────────────────────────┐
│               Workspace                 │
├──────────────┬──────────────────────────┤
│ id           │ "clwks5678"              │
│ name         │ "My Marketing Team"      │
│ slug         │ "my-marketing-team"      │
│ createdAt    │ 2025-01-15 09:05:00      │
└──────────────┴──────────────────────────┘
```

**What is a `slug`?**

A slug is a URL-friendly version of text:

```
Input:  "My Marketing Team"
Output: "my-marketing-team"

Used in URLs like:  /workspaces/my-marketing-team
```

Slugs must be unique — you can't have two workspaces with the same slug.

---

### Table 3: WorkspaceMember — The Join Table

Users and Workspaces have a **many-to-many relationship:**
- One user can be in many workspaces
- One workspace can have many users

You can't store this relationship in either table alone. You need a **join table** (also called a **through table** or **bridge table**) that sits between them.

```
┌──────────────┐     ┌──────────────────────┐     ┌────────────────┐
│    User      │     │   WorkspaceMember     │     │   Workspace    │
├──────────────┤     ├──────────────────────┤     ├────────────────┤
│ id: "u1"     │──┐  │ userId:      "u1"    │  ┌──│ id: "w1"       │
│ email: alice │  └─►│ workspaceId: "w1"    │◄─┘  │ name: Team A   │
└──────────────┘     │ role:        ADMIN   │     └────────────────┘
                     ├──────────────────────┤
┌──────────────┐     │ userId:      "u2"    │     ┌────────────────┐
│    User      │     │ workspaceId: "w1"    │     │   Workspace    │
├──────────────┤  ┌─►│ role:        MEMBER  │     │ (same w1)      │
│ id: "u2"     │──┘  └──────────────────────┘     └────────────────┘
│ email: bob   │
└──────────────┘
```

Each row in WorkspaceMember records: "User X is a Y (ADMIN/MEMBER) of Workspace Z"

**What is `@@id([workspaceId, userId])`?**

Instead of a separate `id` column, the PRIMARY KEY is the **combination** of `workspaceId + userId`. This is called a **composite primary key**.

Benefits:
```
Prevents duplicates:
  Can't add alice to "Team A" twice
  
Natural semantics:
  The "identity" of a membership IS the (workspace, user) pair
  
Fast lookups:
  Want to check if alice is in Team A?
  Query: WHERE workspaceId = "w1" AND userId = "u1"
  The composite PK index handles this instantly
```

**What is `Role`?**

```ts
enum Role {
  ADMIN,    // can manage the workspace
  MEMBER    // can use it
}
```

This enum ensures only these two values can be stored. You can't accidentally insert `"SUPERUSER"` or typo `"ADMI"`.

---

### Table 4: Link

The core table — a shortened URL.

```
┌───────────────────────────────────────────────────────┐
│                        Link                            │
├──────────────────┬────────────────────────────────────┤
│ id               │ "cllnk9999"                        │
│ slug             │ "summer-sale"                      │ ← short URL part
│ originalUrl      │ "https://amazon.com/product/x"    │ ← where it redirects
│ workspaceId      │ "clwks5678"                        │ ← which workspace
│ userId           │ "clusr1234"                        │ ← who created it
│ isActive         │ true                               │ ← is link live?
│ expiresAt        │ null  or future date               │ ← optional expiry
│ createdAt        │ 2025-03-01 10:00:00                │
└──────────────────┴────────────────────────────────────┘
```

**How the redirect flow works:**

```
User visits:  https://linkmetrics.app/summer-sale
                                      ^^^^^^^^^^^
                                      this is the slug
       ↓
API looks up Link WHERE slug = "summer-sale"
       ↓
Checks: isActive = true? expiresAt not passed?
       ↓
Redirects to: https://amazon.com/product/x
```

**Why `@@index([workspaceId])`?**

When the dashboard loads, it fetches ALL links for a workspace:

```sql
SELECT * FROM Link WHERE workspaceId = ?
```

Without an index, the database scans every row. With an index, it jumps directly to the right rows.

```
Without index: scan all 10M links → slow (O(n))
With index:    jump to 50 links for this workspace → fast (O(log n))
```

---

### Table 5: ClickEvent

Every time someone clicks a short link, one row is written here.

```
┌────────────────────────────────────────────────┐
│                   ClickEvent                   │
├─────────────────┬──────────────────────────────┤
│ id              │ "clclk0001"                  │
│ linkId          │ "cllnk9999"  ← which link   │
│ timestamp       │ 2025-03-15 14:22:00          │
│ ipHash          │ "a3f9bc..."  ← hashed IP    │
│ country         │ "IN"                         │
│ city            │ "Mumbai"                     │
│ deviceType      │ "mobile"                     │
│ browser         │ "Chrome"                     │
│ os              │ "Android"                    │
│ referrer        │ "https://twitter.com"        │
└─────────────────┴──────────────────────────────┘
```

**Why `ipHash` and not the raw IP?**

Storing raw IP addresses is a privacy concern (GDPR regulations).

```
Raw IP:  203.0.113.42  (identifies person, privacy risk)
     ↓ one-way hash
Hash:    "a3f9bc..."   (can't reverse to IP, but same IP always produces same hash)

Benefit:  Count unique visitors (same hash = same person, probably)
Benefit:  No PII (personally identifiable information) stored
```

**Why `@@index([linkId, timestamp])`?**

When showing a chart of "clicks over time" for a link:

```sql
SELECT * FROM ClickEvent
WHERE linkId = "cllnk9999"
ORDER BY timestamp DESC
```

The compound index on `(linkId, timestamp)` makes this fast. It's like a book with sections (linkId) and page numbers within those sections (timestamp).

**Why `onDelete: Cascade`?**

If you delete a Link, what happens to its ClickEvents?

```
Option A: Cascade (current)
  Link deleted → all its ClickEvents automatically deleted
  Pro: Can't have orphaned rows
  Con: Data loss if you delete a link

Option B: Restrict
  Link deletion rejected if ClickEvents exist
  Pro: Prevents accidental data loss
  Con: Can't delete links easily

Option C: Set NULL
  Link deleted → ClickEvent.linkId becomes NULL
  Pro: Keep the data
  Con: Orphaned rows that don't belong to a link
```

For this app, Cascade makes sense — when a link is deleted, the analytics are no longer relevant.

---

### Table 6: ClickAggregateDaily

Here's a smart performance trick. If a link gets 100,000 clicks/day, a chart spanning 30 days means scanning 3,000,000 raw rows. That's slow.

Instead, a background job runs nightly and summarizes the day:

```
Raw ClickEvents (millions of rows)      ClickAggregateDaily (one row per day)
┌─────────────────────────┐             ┌────────────────────────────────────┐
│ click at 09:01, mobile  │             │ linkId: "cllnk9999"                │
│ click at 09:02, desktop │  ─nightly──►│ date:   2025-03-15                 │
│ click at 09:03, mobile  │    job      │ deviceType: "mobile"               │
│ ... 10,000 more rows    │             │ clicks: 7,234                      │
└─────────────────────────┘             └────────────────────────────────────┘
```

**What is `@@unique([linkId, date])`?**

```
Can only have ONE aggregate row per link per day

Attempt 1:  INSERT into ClickAggregateDaily(linkId=X, date=2025-03-15, ...)
            → SUCCESS

Attempt 2:  INSERT into ClickAggregateDaily(linkId=X, date=2025-03-15, ...)
            → REJECTED (unique constraint violated)
```

This prevents duplicate aggregations.

---

### Full Relationship Map

```
User ──────────────────────────────── creates ──► Link
  │                                                │
  │                                                │
  └──── WorkspaceMember ──── Workspace ────────────┘
            │                   │
          (role:                 └──── owns Link
         ADMIN/MEMBER)

Link ──────────────────────────────── has many ──► ClickEvent
  │                                                (raw click data)
  │
  └──────────────────────────────────────────────► ClickAggregateDaily
                                                   (summarized click data)
```

**Reading this:**
- A User can be in many Workspaces (through WorkspaceMember)
- A Workspace contains many Links
- A Link belongs to one Workspace AND one User (who created it)
- Each click creates one ClickEvent
- Nightly, ClickEvents get summarized into ClickAggregateDaily

---

## Interview Queries & Data Flows

### Mental Model Before We Start

Every query answers a question. The database's job is finding rows that answer the question as fast as possible.

```
Your Question  →  Tables to search  →  Connect them  →  Filter/Sort  →  Answer
```

---

### Query 1: The Redirect (Most Critical)

**Plain English:** "Someone visited `/summer-sale`. Where do I send them?"

**Code:** `LinkRepository.findBySlug(slug)`

```ts
prisma.link.findUnique({ where: { slug } })
```

**SQL Generated:**
```sql
SELECT * FROM "Link"
WHERE slug = 'summer-sale'
LIMIT 1;
```

**Data Flow:**

```
User visits:  https://app.com/summer-sale
                                ^^^^^^^^^^^
                                slug = "summer-sale"
       ↓
Database scans the Link table...

┌──────────────────────────────────────────────────────────┐
│                         Link table                        │
├────────────┬──────────────┬────────────────────────────── ┤
│ id         │ slug         │ originalUrl                   │
├────────────┼──────────────┼───────────────────────────────┤
│ cllnk0001  │ "black-fri"  │ https://amazon.com/deal1      │
│ cllnk0002  │ "summer-sale"│ https://amazon.com/product/x  │  ← FOUND!
│ cllnk0003  │ "newsletter" │ https://substack.com/xyz      │
└────────────┴──────────────┴───────────────────────────────┘
       ↓
Returns: { id, slug, originalUrl, isActive, expiresAt, ... }
       ↓
Controller checks: isActive=true? expiresAt not passed?
       ↓
HTTP 302 Redirect → https://amazon.com/product/x
```

**Why This Is Fast:**

`slug` has a `@unique` constraint in the schema. Unique constraints automatically create an index.

An index is like a dictionary lookup — the database doesn't scan every row, it jumps directly to the right one.

```
Without index:  scan ALL rows → O(n) → 1M links = 1M scans (slow)
With index:     binary search → O(log n) → 1M links = 20 scans (fast)
```

**Interview Concept:** Index-backed lookups, unique constraints, redirect mechanics.

---

### Query 2: Dashboard — All Links with Click Counts

**Plain English:** "Show me all active links in workspace X, and how many clicks each has."

**Code:** `LinkRepository.findByWorkspace(workspaceId)`

```ts
prisma.link.findMany({
  where: { workspaceId, isActive: true },
  orderBy: { createdAt: "desc" },
  include: {
    _count: { select: { clicks: true } },
  },
})
```

**SQL Generated:**
```sql
SELECT
  l.*,
  COUNT(ce.id) AS clicks
FROM "Link" l
LEFT JOIN "ClickEvent" ce ON ce."linkId" = l.id
WHERE l."workspaceId" = 'clwks5678'
  AND l."isActive" = true
GROUP BY l.id
ORDER BY l."createdAt" DESC;
```

**Data Flow Across Tables:**

```
Step 1: Find all active links for this workspace

  Link table
  ┌────────────┬───────────────┬──────────────────────┐
  │ id         │ workspaceId   │ isActive             │
  ├────────────┼───────────────┼──────────────────────┤
  │ cllnk0001  │ clwks5678     │ true     ← included  │
  │ cllnk0002  │ clwks5678     │ true     ← included  │
  │ cllnk0003  │ clwks9999     │ true     ← wrong ws  │
  │ cllnk0004  │ clwks5678     │ false    ← deleted   │
  └────────────┴───────────────┴──────────────────────┘

Step 2: For each matching link, count its clicks

  ClickEvent table
  ┌───────────────┬─────────────────────┐
  │ id            │ linkId              │
  ├───────────────┼─────────────────────┤
  │ clclk0001     │ cllnk0001           │  ┐
  │ clclk0002     │ cllnk0001           │  ├─ 3 clicks total
  │ clclk0003     │ cllnk0001           │  ┘
  │ clclk0004     │ cllnk0002           │  ← 1 click
  └───────────────┴─────────────────────┘

Step 3: JOIN (combine rows) and count

  Left table (Link)
        +
  Right table (ClickEvent via linkId)
        =
  Combined result:

  ┌────────────┬──────────────┬─────────────┐
  │ id         │ slug         │ click_count │
  ├────────────┼──────────────┼─────────────┤
  │ cllnk0001  │ summer-sale  │ 3           │
  │ cllnk0002  │ newsletter   │ 1           │
  └────────────┴──────────────┴─────────────┘
```

**Why `LEFT JOIN` not `INNER JOIN`?**

```
INNER JOIN: only links that have clicks
LEFT JOIN:  all links, even if they have zero clicks

This app wants zero-click links to show on the dashboard
→ use LEFT JOIN
```

**Why `@@index([workspaceId])` Matters:**

```
Without index:
  SELECT * FROM Link WHERE workspaceId = 'clwks5678'
  → scan ALL links in database
  → filter by workspaceId
  → slow

With index:
  → jump directly to all rows where workspaceId = 'clwks5678'
  → fast
```

**Interview Concept:** JOIN, GROUP BY, LEFT vs INNER JOIN, why indexes matter for WHERE clauses.

---

### Query 3: Authorization Check

**Plain English:** "Is user U allowed to access workspace W?"

**Code:** `WorkspaceRepository.findMembership(workspaceId, userId)`

```ts
prisma.workspaceMember.findUnique({
  where: { workspaceId_userId: { workspaceId, userId } },
})
```

**SQL Generated:**
```sql
SELECT * FROM "WorkspaceMember"
WHERE "workspaceId" = 'clwks5678'
  AND "userId" = 'clusr1234'
LIMIT 1;
```

**Data Flow:**

```
Incoming request: "Give me links for workspace clwks5678"
JWT token says: user = clusr1234
       ↓
BEFORE touching the Link table, check authorization:

  WorkspaceMember table
  ┌──────────────┬──────────────┬────────┐
  │ workspaceId  │ userId       │ role   │
  ├──────────────┼──────────────┼────────┤
  │ clwks5678    │ clusr1234    │ ADMIN  │  ← found → ALLOWED
  │ clwks5678    │ clusr9999    │ MEMBER │
  │ clwks0000    │ clusr1234    │ MEMBER │
  └──────────────┴──────────────┴────────┘

If row found: user is a member → continue with request
If row NOT found: 403 Forbidden → deny request
```

**Why the Composite PK Makes This Fast:**

The composite primary key `@@id([workspaceId, userId])` is automatically indexed.

Searching by two columns at once (`WHERE workspaceId = X AND userId = Y`) hits the index directly.

```
This lookup is O(log n) — extremely fast even with millions of memberships
```

**Why This Query Matters:**

This is called on almost every authenticated request. It's in a middleware:

```ts
app.use((req, res, next) => {
  const user = req.user;  // from JWT
  const workspace = req.query.workspaceId;
  
  const membership = findMembership(workspace, user);  // ← this query
  
  if (!membership) {
    return res.status(403).json({ error: "not authorized" });
  }
  
  next();  // allowed, continue
});
```

**Interview Concept:** Authorization vs Authentication, composite primary keys, multi-tenant access control, authorization as middleware.

---

### Query 4: User's Workspaces

**Plain English:** "What workspaces does user U belong to?"

**Code:** `WorkspaceRepository.findByUser(userId)`

```ts
prisma.workspace.findMany({
  where: {
    members: { some: { userId } },
  },
  include: {
    _count: { select: { links: true } },
  },
})
```

**SQL Generated:**
```sql
SELECT w.*, COUNT(l.id) AS link_count
FROM "Workspace" w
LEFT JOIN "Link" l ON l."workspaceId" = w.id
WHERE EXISTS (
  SELECT 1 FROM "WorkspaceMember" wm
  WHERE wm."workspaceId" = w.id
    AND wm."userId" = 'clusr1234'
)
GROUP BY w.id;
```

**Data Flow Across THREE Tables:**

```
User clusr1234 logs in → fetch their workspaces

Step 1: Find WorkspaceMember rows for this user

  WorkspaceMember
  ┌──────────────┬──────────────┬────────┐
  │ workspaceId  │ userId       │ role   │
  ├──────────────┼──────────────┼────────┤
  │ clwks5678    │ clusr1234    │ ADMIN  │  ← this user
  │ clwks1111    │ clusr1234    │ MEMBER │  ← this user
  │ clwks9999    │ clusr9999    │ ADMIN  │  ← different user, skip
  └──────────────┴──────────────┴────────┘

Step 2: Load the Workspace rows for those IDs

  Workspace
  ┌──────────────┬────────────────────┐
  │ id           │ name               │
  ├──────────────┼────────────────────┤
  │ clwks5678    │ "My Marketing Team"│  ← loaded
  │ clwks1111    │ "Client Project A" │  ← loaded
  └──────────────┴────────────────────┘

Step 3: Also count links per workspace

  Final response:
  [
    {
      id: "clwks5678",
      name: "My Marketing Team",
      linkCount: 12,
      role: "ADMIN"
    },
    {
      id: "clwks1111",
      name: "Client Project A",
      linkCount: 4,
      role: "MEMBER"
    }
  ]
```

**How the `members: { some: { userId } }` Part Works:**

This is a relational query operator (Prisma syntax):

```
"Give me workspaces WHERE there EXISTS at least one member with userId = X"

Breaking it down:
- members: check the members relationship
- some: at least one row matches
- { userId }: where userId equals this value
```

**Interview Concept:** Many-to-many relationships, join tables, EXISTS subqueries, multi-tenant data isolation.

---

### Query 5: Click Logging — Dual Write (Advanced)

**Plain English:** "Record a click on this link — both the raw event AND today's running total."

**Code:** `LinkRepository.logClick(data)`

```ts
await Promise.all([
  prisma.clickEvent.create({
    data: {
      linkId,
      ipHash,
      country,
      deviceType,
      browser,
      os,
      referrer,
    },
  }),

  prisma.clickAggregateDaily.upsert({
    where: {
      linkId_date: {
        linkId,
        date: today,
      },
    },
    update: { clicks: { increment: 1 } },
    create: {
      linkId,
      date: today,
      country,
      deviceType,
      browser,
      clicks: 1,
    },
  }),
])
```

**What "upsert" means:**
```
UPDATE if row exists
INSERT if it doesn't
```

**Data Flow:**

```
User clicks link "summer-sale" at 14:22 on 2025-03-15

Two writes happen IN PARALLEL:

Write 1: Raw event (always INSERT new row)
  ClickEvent table
  ┌──────────────┬─────────────────────┬───────────┬──────────────┐
  │ id           │ linkId              │ timestamp │ country      │
  ├──────────────┼─────────────────────┼───────────┼──────────────┤
  │ clclk0099    │ cllnk0001           │ 14:22:05  │ "IN"         │  ← new
  └──────────────┴─────────────────────┴───────────┴──────────────┘

Write 2: Daily aggregate (UPSERT — update or create)

  Does a row exist for linkId=cllnk0001, date=2025-03-15?

  YES (clicked before today):
    OLD:  clicks: 45
    NEW:  clicks: 46  ← increment by 1

  NO (first click of the day):
    INSERT new row: { linkId, date, clicks: 1 }

  ClickAggregateDaily
  ┌────────────────┬────────────────┬──────────────┐
  │ linkId         │ date           │ clicks       │
  ├────────────────┼────────────────┼──────────────┤
  │ cllnk0001      │ 2025-03-15     │ 46           │  ← updated
  │ cllnk0001      │ 2025-03-14     │ 201          │
  │ cllnk0001      │ 2025-03-13     │ 189          │
  └────────────────┴────────────────┴──────────────┘
```

**Why Two Tables?**

This is a classic "hot path vs cold path" split:

```
Raw ClickEvent:
  ✓ keeps every click with full detail (country, city, device, browser)
  ✓ used for: exporting data, debugging, exact counts
  ✗ grows very fast (millions of rows)
  ✗ GROUP BY queries on millions of rows = slow

ClickAggregateDaily:
  ✓ one row per link per day (grows slowly)
  ✓ used for: dashboard charts, breakdowns by country
  ✓ GROUP BY on 365 rows per link = instant
  ✗ loses per-click details (can't see individual clicks anymore)
```

This is called **pre-aggregation** — you trade storage for query speed.

**Why `Promise.all` (parallel execution)?**

```
Sequential:
  Write 1 finishes → Write 2 starts
  Total time = time of both writes

Parallel (Promise.all):
  Write 1 and Write 2 happen at the same time
  Total time = time of slowest write

Faster!
```

**Interview Concept:** UPSERT, parallel writes, pre-aggregation pattern, tradeoffs between raw data and aggregated data.

---

### Query 6: Analytics — Multi-Source Aggregation (Hardest)

**Plain English:** "For a link over a date range, give me:
- total clicks
- clicks by country (top 10)
- clicks by device
- clicks by browser
- a day-by-day chart"

**Code:** `LinkRepository.getAnalytics(linkId, from, to)`

```ts
const [totalClicks, aggregates, byDay] = await Promise.all([
  // Source 1: raw count
  prisma.clickEvent.count({
    where: { linkId, timestamp: { gte: from, lte: to } },
  }),

  // Source 2: pre-aggregated rows for breakdowns
  prisma.clickAggregateDaily.findMany({
    where: {
      linkId,
      date: { gte: from, lte: to },
    },
  }),

  // Source 3: raw SQL for day-by-day
  prisma.$queryRaw`
    SELECT
      DATE("timestamp")::text AS date,
      COUNT(*)::int AS count
    FROM "ClickEvent"
    WHERE "linkId" = ${linkId}
      AND "timestamp" >= ${from}
      AND "timestamp" <= ${to}
    GROUP BY DATE("timestamp")
    ORDER BY DATE("timestamp") ASC
  `,
])
```

**Three Parallel Queries, Each Hitting Different Data:**

```
                    ┌─────────────────────────────────────────┐
                    │         getAnalytics() call              │
                    └──────────┬──────────────┬────────────────┘
                               │              │              │
                    all 3 run in parallel (Promise.all)
                               │              │              │
              ┌────────────────┘   ┌──────────┘   ┌──────────┘
              ▼                    ▼               ▼
   ClickEvent table      ClickAggregateDaily     ClickEvent table
   COUNT(*)              all rows for range     GROUP BY date
              │                    │               │
              ▼                    ▼               ▼
   totalClicks: 1247     [{country:"IN", 45},   [{date:"2025-03-13", 189},
                         {country:"US", 30},    {date:"2025-03-14", 201},
                         {device:"mobile", 80}] {date:"2025-03-15", 46}]
```

**Then, JavaScript aggregates:**

```ts
// Combine rows from ClickAggregateDaily
const countryMap = new Map();
for (const row of aggregates) {
  if (row.country) {
    countryMap.set(
      row.country,
      (countryMap.get(row.country) ?? 0) + row.clicks
    );
  }
}

// Sort and slice top 10
const topCountries = Array.from(countryMap.entries())
  .sort((a, b) => b[1] - a[1])  // descending by count
  .slice(0, 10);

// Result:
// [{ name: "IN", count: 45 }, { name: "US", count: 30 }, ...]
```

**Why Use Two Different Data Sources?**

```
For total clicks → raw ClickEvent count
  Why? Source of truth, most accurate
  The aggregate could drift if there's a bug

For country/device/browser breakdowns → ClickAggregateDaily
  Why? Suppose 500,000 clicks over the range
  Option A: GROUP BY country on 500K rows → slow
  Option B: GROUP BY country on 365 aggregate rows → instant

For day-by-day chart → raw SQL on ClickEvent
  Why? The aggregate table isn't structured for "total per day"
  Raw query groups all clicks regardless of country/device into one number per day
```

**Interview Concept:** GROUP BY, date-based aggregation, parallel queries, when to use pre-aggregated data vs raw data, raw SQL escape hatches in ORMs.

---

### Full Query Map

Every incoming request travels this path:

```
HTTP Request
     ↓
auth.ts middleware
  → validates JWT (who is this user?)
     ↓
workspace.ts middleware
  → findMembership()     ← Query 3
     ↓ (user is authorized)
     ↓
Route Handler decides which query to run:
     │
     ├── GET /:slug
     │  → findBySlug()              ← Query 1 (redirect)
     │
     ├── GET /workspaces
     │  → findByUser()               ← Query 4
     │
     ├── GET /api/links
     │  → findByWorkspace()          ← Query 2
     │
     ├── POST /api/click
     │  → logClick()                 ← Query 5 (dual write)
     │
     └── GET /api/analytics
        → getAnalytics()             ← Query 6 (hardest)
```

---

## Key Concepts Reference

### Indexing

```
Purpose: Speed up lookups

Index on slug:
  Without: scan all rows → O(n)
  With:    binary search → O(log n)

Unique constraints automatically create indexes
Composite indexes on (colA, colB) speed up WHERE colA = X AND colB = Y
```

### JOIN Types

```
INNER JOIN:    only matching rows from both tables
LEFT JOIN:     all rows from left table + matching rows from right
RIGHT JOIN:    all rows from right table + matching rows from left
FULL OUTER:    all rows from both tables

Example:
  Link LEFT JOIN ClickEvent
  → all links, even if zero clicks
  → (instead of INNER JOIN which would only show links WITH clicks)
```

### GROUP BY

```
Purpose: Combine multiple rows into summary rows

Example:
  SELECT country, COUNT(*) FROM ClickEvent GROUP BY country
  
  Input (many rows):         Output (one per country):
  ┌────────────┐            ┌─────────┬───────┐
  │ country: IN│            │country  │ count │
  │ country: IN│            ├─────────┼───────┤
  │ country: IN│  GROUP BY  │ IN      │ 3     │
  │ country: US│  ──────→   │ US      │ 1     │
  │ country: US│            │ DE      │ 1     │
  │ country: DE│            └─────────┴───────┘
  └────────────┘
```

### UPSERT

```
Purpose: "Insert or update" — conditional logic in the database

Usage:
  WHERE { unique key }
  UPDATE if found
  CREATE if not found

Benefits:
  - Atomic (all-or-nothing)
  - No race conditions
  - Can increment a counter without reading first
```

### Composite Primary Key

```
Purpose: Identity is a combination of multiple columns

Example: WorkspaceMember
  @@id([workspaceId, userId])
  
  Means: you can't have the same (workspaceId, userId) pair twice
  This naturally prevents duplicate memberships
  
  Lookup is fast: WHERE workspaceId = X AND userId = Y
  (the composite PK is automatically indexed)
```

### Pre-Aggregation

```
Pattern: Summarize hot data nightly

Raw data:
  ClickEvent: every single click
  Grows very fast
  GROUP BY queries are slow

Pre-aggregated:
  ClickAggregateDaily: one row per link per day
  Grows slowly
  GROUP BY queries are instant

Tradeoff:
  ✓ Fast reads (dashboards)
  ✗ Slow writes (must write to both tables)
  ✗ Can't see individual clicks anymore
```

### Authorization vs Authentication

```
Authentication: "Are you who you claim?"
  "I am alice@gmail.com"
  → system verifies password/JWT
  → yes, I believe you

Authorization: "Are you allowed to do this?"
  "I want to access workspace X"
  → system checks: is alice a member of workspace X?
  → yes, you're a MEMBER (not ADMIN)
  → you're allowed (but maybe not allowed to DELETE)
```

### Multi-Tenancy

```
Definition: One database serves multiple independent customers

This app:
  One database
  Many workspaces (customers)
  WorkspaceMember table controls access
  
Every query filters by workspaceId:
  "Show me links for workspace X"
  (not "show me all links" — that would leak data to other customers)

Security:
  Authorization middleware on every request
  Checks: does this user belong to this workspace?
  If not: 403 Forbidden
```

---

## Summary

### What We Learned

1. **CORS** is browser protection, not server protection. It prevents JavaScript on evil.com from reading your API's public data from a victim's browser. Tokens in localStorage are safer than cookies, but CORS defense-in-depth is still important.

2. **Database schema** is a web of pointers (foreign keys) connecting tables. Each design choice (indexes, join tables, aggregates) solves a specific scaling problem.

3. **Queries** are different tools for different questions:
   - Fast redirect: indexed unique lookup
   - Dashboard: LEFT JOIN + GROUP BY
   - Authorization: composite PK lookup
   - Multi-workspace access: EXISTS subqueries
   - Click logging: dual writes with UPSERT
   - Analytics: multi-source parallel queries

4. **Indexes** are automatic for unique constraints but must be explicit for filtered queries. They're the most important performance lever.

5. **Pre-aggregation** trades storage + write complexity for read speed. Essential for analytics at scale.

### Interview Questions You Can Now Answer

| Interviewer asks | You now understand |
|---|---|
| "How do you efficiently look up a short URL?" | Unique index on slug |
| "Walk me through the dashboard query" | LEFT JOIN + GROUP BY, filtering by workspaceId |
| "How do you prevent one customer from seeing another's data?" | WorkspaceMember authorization table |
| "Why pre-aggregate click data?" | Fast dashboard reads vs slow database scans |
| "What's an UPSERT?" | Insert-or-update, atomic, used in logClick |
| "Why composite primary keys?" | Natural identity, automatic indexing, prevents duplicates |
| "Walk me through a multi-tenant system" | Workspaces, WorkspaceMember table, authorization middleware |

### Next Steps

- Study the actual repository code — read `link.controller.ts`, `link.service.ts` to see how these queries are called
- Understand the middleware chain — see how JWT auth + workspace auth is enforced
- Experiment — write a new query in Prisma and trace its SQL
- Think about scaling — what happens at 1M links? 100M clicks? When do new indexes matter?

---

**End of Tutorial**

Generated for LinkMetrics Learning Program  
Date: 2026-05-28  
Focus: Production SaaS Database Architecture for Beginners

# Data Fetching

## CRITICAL: Server Components Only

All data fetching in this app **must** be done via **Server Components**.

Do NOT fetch data via:
- Route handlers (`app/api/...`)
- Client components (`'use client'`)
- `useEffect` + `fetch`
- Any other mechanism

Server Components are the **only** approved pattern. They run on the server, have direct access to the database, and never expose credentials or raw queries to the client.

```tsx
// CORRECT — fetch in a Server Component
export default async function WorkoutsPage() {
  const workouts = await getWorkoutsForUser(userId)
  return <WorkoutList workouts={workouts} />
}
```

```tsx
// WRONG — never do this
useEffect(() => {
  fetch('/api/workouts').then(...)
}, [])
```

---

## Database Queries: `/data` Directory + Drizzle ORM

All database queries must live in helper functions inside the `/data` directory.

Rules:
- **No raw SQL** — use Drizzle ORM exclusively
- One file per domain area (e.g., `data/workouts.ts`, `data/exercises.ts`)
- Functions are called only from Server Components

```ts
// data/workouts.ts
import { db } from '@/db'
import { workouts } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getWorkoutsForUser(userId: string) {
  return db.select().from(workouts).where(eq(workouts.userId, userId))
}
```

---

## CRITICAL: Users Can Only Access Their Own Data

Every query **must** be scoped to the authenticated user's ID. A logged-in user must never be able to read or modify another user's data.

**Always**:
1. Retrieve the authenticated user's ID from the session inside the Server Component
2. Pass that ID into the `/data` helper function
3. Filter every query by that `userId`

```tsx
// app/dashboard/page.tsx
import { auth } from '@/lib/auth'
import { getWorkoutsForUser } from '@/data/workouts'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // userId is always sourced from the verified session — never from params or user input
  const workouts = await getWorkoutsForUser(session.user.id)
  return <WorkoutList workouts={workouts} />
}
```

**Never** accept a `userId` from URL params, query strings, or request bodies as the sole authorization mechanism. The `userId` used in queries must always come from the server-side session.

---

## Summary Checklist

| Rule | Required |
|------|----------|
| Fetch data in Server Components only | YES |
| Use `/data` helper functions for all DB access | YES |
| Use Drizzle ORM (no raw SQL) | YES |
| Scope every query to the authenticated `userId` | YES |
| Fetch data in client components or route handlers | NO |

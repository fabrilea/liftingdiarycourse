# Data Mutations

## CRITICAL: Server Actions Only

All data mutations in this app **must** be done via **Server Actions**.

Do NOT mutate data via:
- Route handlers (`app/api/...`)
- Direct database calls from components
- Client-side `fetch` or any other mechanism

Server Actions are the **only** approved pattern for mutations.

---

## Server Actions: `actions.ts` Colocation

Every Server Action must live in a file named `actions.ts` colocated with the route or feature it belongs to.

```
app/
  workouts/
    page.tsx
    actions.ts       ← mutations for this route
    new/
      page.tsx
      actions.ts     ← mutations for this nested route
```

Each `actions.ts` file must start with the `'use server'` directive.

```ts
// app/workouts/actions.ts
'use server'
```

---

## Typed Parameters — No FormData

All Server Action parameters **must** be explicitly typed. `FormData` is **not** permitted as a parameter type.

```ts
// CORRECT — typed parameters
export async function createWorkout(input: CreateWorkoutInput) { ... }

// WRONG — never use FormData
export async function createWorkout(formData: FormData) { ... }
```

---

## CRITICAL: Validate All Arguments with Zod

Every Server Action **must** validate its arguments using **Zod** before doing anything else. Never trust input from the client.

```ts
// app/workouts/actions.ts
'use server'

import { z } from 'zod'

const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().datetime(),
  notes: z.string().optional(),
})

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>

export async function createWorkout(input: CreateWorkoutInput) {
  const parsed = createWorkoutSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error('Invalid input')
  }

  // proceed with validated data
  await insertWorkout(parsed.data)
}
```

Define the Zod schema in the same file as the action. Derive the TypeScript type from the schema via `z.infer` — do not define both manually.

---

## Database Mutations: `/data` Directory + Drizzle ORM

All database write operations **must** live in helper functions inside the `src/data` directory. Server Actions call these helpers — they do not execute Drizzle calls directly.

Rules:
- **No raw SQL** — use Drizzle ORM exclusively
- One file per domain area (e.g., `data/workouts.ts`, `data/exercises.ts`)
- Mutation helpers are called only from Server Actions

```ts
// src/data/workouts.ts
import { db } from '@/db'
import { workouts } from '@/db/schema'

export async function insertWorkout(data: {
  userId: string
  name: string
  date: string
  notes?: string
}) {
  return db.insert(workouts).values(data)
}

export async function deleteWorkout(workoutId: string) {
  return db.delete(workouts).where(eq(workouts.id, workoutId))
}
```

```ts
// app/workouts/actions.ts
'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { insertWorkout } from '@/data/workouts'
import { redirect } from 'next/navigation'

const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().datetime(),
  notes: z.string().optional(),
})

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>

export async function createWorkout(input: CreateWorkoutInput) {
  const parsed = createWorkoutSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error('Invalid input')
  }

  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await insertWorkout({ ...parsed.data, userId: session.user.id })
  redirect('/workouts')
}
```

---

## CRITICAL: Users Can Only Mutate Their Own Data

Every mutation **must** be scoped to the authenticated user. Never accept a `userId` from the client as the sole authorization mechanism.

**Always**:
1. Retrieve the authenticated user's ID from the session inside the Server Action
2. Use that ID when calling the `/data` helper — never the one from client input
3. When updating or deleting, verify the record belongs to the authenticated user before mutating

```ts
// CORRECT — userId always sourced from the session
const session = await auth()
if (!session?.user?.id) throw new Error('Unauthorized')
await deleteWorkout(workoutId, session.user.id)

// WRONG — never use a userId from client input for authorization
await deleteWorkout(workoutId, input.userId)
```

---

## CRITICAL: No `redirect()` Inside Server Actions

Never call `redirect()` from Next.js inside a Server Action. Instead, return a value from the action and perform the redirect client-side after the call resolves.

```ts
// WRONG — do not redirect inside a Server Action
export async function createWorkout(input: CreateWorkoutInput) {
  // ...
  await insertWorkout({ ...parsed.data, userId })
  redirect('/dashboard') // ← never do this
}
```

```ts
// CORRECT — return a result, redirect on the client
export async function createWorkout(input: CreateWorkoutInput) {
  // ...
  await insertWorkout({ ...parsed.data, userId })
  return { redirectTo: '/dashboard' }
}
```

```tsx
// Client Component — handle the redirect after the action resolves
startTransition(async () => {
  const result = await createWorkout(input)
  if (result?.error) {
    setError(result.error)
    return
  }
  if (result?.redirectTo) {
    router.push(result.redirectTo)
  }
})
```

---

## Summary Checklist

| Rule | Required |
|------|----------|
| Mutations via Server Actions only | YES |
| Redirect client-side after action resolves | YES |
| Call `redirect()` inside a Server Action | NO |
| `actions.ts` colocated with the route | YES |
| All parameters explicitly typed | YES |
| `FormData` as a parameter type | NO |
| Validate all arguments with Zod | YES |
| DB writes via `/data` helper functions | YES |
| Use Drizzle ORM (no raw SQL) | YES |
| Scope every mutation to the authenticated `userId` | YES |
| Accept `userId` from client input for authorization | NO |

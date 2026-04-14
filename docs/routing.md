# Routing Coding Standards

## Route Structure

All application routes live under `/dashboard`. The root `/` page is public (marketing/landing page).

```
/                         → public (landing page)
/sign-in                  → public (Clerk sign-in)
/sign-up                  → public (Clerk sign-up)
/dashboard                → protected
/dashboard/workout/new    → protected
/dashboard/workout/[workoutId] → protected
```

---

## Route Protection

### Middleware

All `/dashboard` routes are protected via Next.js middleware using Clerk's `clerkMiddleware`. The middleware file lives at `middleware.ts` in the project root.

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

- Do NOT use `authMiddleware` — it is deprecated.
- Public routes (`/sign-in`, `/sign-up`) must be explicitly whitelisted in `createRouteMatcher`.
- All other routes, including all `/dashboard/**` routes, are protected by default.

### Page-Level Protection (Defense in Depth)

In addition to middleware, every protected Server Component page must also call `auth()` and redirect unauthenticated users. Do not rely on middleware alone.

```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // render protected content
}
```

---

## Dynamic Route Parameters

In Next.js 16, `params` is a `Promise`. Always `await params` before accessing route segments.

```tsx
// src/app/dashboard/workout/[workoutId]/page.tsx
export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>
}) {
  const { workoutId } = await params
  // ...
}
```

---

## New Routes Checklist

When adding a new route under `/dashboard`:

| Step | Requirement |
|------|-------------|
| Place the file under `src/app/dashboard/` | YES |
| Add page-level `auth()` guard with redirect | YES |
| Ensure the route is NOT added to `isPublicRoute` in middleware | YES |
| Use `await params` for any dynamic segments | YES |
| Keep layouts and pages as Server Components unless interactivity is required | YES |

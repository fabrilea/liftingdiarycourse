# Auth Coding Standards

## Authentication Provider

**This app uses [Clerk](https://clerk.com) for all authentication.**

- Do NOT implement custom auth, JWT handling, session management, or password logic.
- Do NOT use NextAuth, Auth.js, Lucia, or any other auth library.
- All auth concerns — sign-in, sign-up, session, user identity — are handled exclusively through Clerk.

---

## Getting the Current User

### In Server Components and Server Actions

Use Clerk's `auth()` helper from `@clerk/nextjs/server`:

```tsx
import { auth } from '@clerk/nextjs/server'

export default async function Page() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // userId is the Clerk user ID — use it to scope all DB queries
}
```

### In Client Components

Use the `useAuth` or `useUser` hooks from `@clerk/nextjs`:

```tsx
'use client'
import { useAuth } from '@clerk/nextjs'

export function SomeClientComponent() {
  const { userId, isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return null
  if (!isSignedIn) return null

  // render authenticated content
}
```

---

## Route Protection

### Middleware

All route protection is configured in `middleware.ts` at the project root using Clerk's `clerkMiddleware`:

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
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
```

- Do NOT use `authMiddleware` — it is deprecated.
- Public routes (sign-in, sign-up) must be explicitly whitelisted.
- All other routes are protected by default.

### Redirecting Unauthenticated Users in Server Components

Always redirect unauthenticated users server-side — do not rely solely on middleware for page-level auth:

```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  // ...
}
```

---

## UI Components

Use Clerk's pre-built components for auth UI. Do NOT build custom sign-in/sign-up forms.

```tsx
import { SignIn, SignUp, UserButton, SignedIn, SignedOut } from '@clerk/nextjs'

// Sign-in page
<SignIn />

// Sign-up page
<SignUp />

// User avatar / account button (shows when signed in)
<SignedIn>
  <UserButton />
</SignedIn>

// Content for unauthenticated users
<SignedOut>
  <a href="/sign-in">Sign in</a>
</SignedOut>
```

---

## User ID Rules

- The `userId` used in all database queries **must always** come from `auth()` on the server — never from URL params, query strings, cookies, or client-supplied values.
- See `docs/data-fetching.md` for how `userId` must be passed into `/data` helper functions.

---

## Summary Checklist

| Rule | Required |
|------|----------|
| Use Clerk for all authentication | YES |
| Use `auth()` from `@clerk/nextjs/server` in Server Components | YES |
| Use `useAuth` / `useUser` hooks in Client Components | YES |
| Protect routes via `clerkMiddleware` in `middleware.ts` | YES |
| Use Clerk's pre-built UI components (`SignIn`, `SignUp`, `UserButton`) | YES |
| Source `userId` exclusively from `auth()` on the server | YES |
| Use any other auth library or custom auth logic | NO |
| Accept `userId` from client-supplied input for authorization | NO |

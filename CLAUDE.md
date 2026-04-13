# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (Turbopack, default)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

> `next build` does NOT run the linter automatically in Next.js 16. Run lint separately.

## Stack

- **Next.js 16.2.3** with App Router (`src/app/`)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- Import alias: `@/*` → `src/*`

## Key architecture notes

This project uses the **App Router** (not Pages Router). All routes live under `src/app/`.

**Server vs Client Components**: Layouts and pages are Server Components by default. Add `'use client'` only to components that need interactivity (`useState`, `useEffect`, browser APIs, event handlers). Keep the boundary as deep in the tree as possible.

**Environment variables**: Only `NEXT_PUBLIC_` prefixed vars are included in the client bundle. Use `server-only` package to guard server-side modules.

**Bundler**: Turbopack is the default (`next dev`). Use `next dev --webpack` to fall back to Webpack.

**Params in dynamic routes**: In Next.js 16, `params` is a `Promise` — always `await params` before accessing route parameters:
```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

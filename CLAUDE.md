# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Next.js on http://localhost:3000)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (uses Biome, not ESLint)
- **Format:** `npm run format` (Biome with 2-space indent)
- **Generate DB migrations:** `npm run gen:migrations`
- **Apply DB migrations:** `npm run apply:migrations`

## Architecture

This is a Next.js 16 app (App Router) with a dark-themed UI called "DevVault" — a notes/learning platform with tag-based organization.

- **`src/app/`** — Next.js App Router pages and layouts. Uses React Server Components by default.
  - `(auth)/` — Login and register pages (Client Components)
  - `(main)/notes/` — Notes CRUD pages and server actions
  - `api/auth/[...nextauth]/` — Auth.js route handler
- **`src/components/ui/`** — shadcn/ui components (new-york style, Lucide icons). Add new ones via `npx shadcn add <component>`.
- **`src/components/ui/custom/`** — App-specific components (header, notes-list, tag-filter, note-form, search-input, delete-note-button).
- **`src/components/providers.tsx`** — SessionProvider wrapper for next-auth client hooks.
- **`src/lib/auth.ts`** — NextAuth (Auth.js v5) config with GitHub OAuth + Credentials providers, DrizzleAdapter, JWT sessions.
- **`src/lib/queries.ts`** — Data fetching helpers (getUserNotes, getNoteById, getNoteTags) with auth checks.
- **`src/lib/utils.ts`** — `cn()` helper (clsx + tailwind-merge).
- **`src/index.ts`** — Drizzle ORM database client (Neon serverless PostgreSQL). Named export `db`.
- **`src/db/schema/auth.ts`** — Auth.js tables (users, accounts, sessions, verificationTokens). Users table has optional `password` column for credentials auth.
- **`src/db/schema/notes.ts`** — Notes, tags (per-user, unique on name+userId), noteTags junction table with Drizzle relations.
- **`src/middleware.ts`** — Protects `/notes/new` and `*/edit` routes; redirects auth pages for logged-in users.
- **`drizzle/`** — Generated migration output directory.

## Key Tech Decisions

- **Auth:** Auth.js v5 (next-auth@beta) with JWT session strategy. Both GitHub OAuth and email/password credentials. Drizzle adapter stores users in Neon DB.
- **Database:** Neon serverless PostgreSQL via `@neondatabase/serverless` + Drizzle ORM. Requires `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` env vars. GitHub OAuth needs `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
- **Mutations:** Next.js Server Actions for all CRUD operations (no API routes for app logic).
- **Markdown:** Notes support markdown content via `react-markdown` + `remark-gfm`. The NoteForm has edit/preview toggle.
- **Linting/Formatting:** Biome (not ESLint/Prettier). Config in `biome.json`. Has React and Next.js domain rules enabled. Organizes imports automatically.
- **Styling:** Tailwind CSS v4 (via PostCSS plugin), dark mode via `.dark` class on `<html>`. Theme variables in `src/app/globals.css`.
- **UI Components:** shadcn/ui (new-york style). Config in `components.json`. Import path alias: `@/components/ui`.
- **Path alias:** `@/*` maps to `./src/*`.

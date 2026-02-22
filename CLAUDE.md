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

Next.js 16 App Router project called "DevVault" — a dark-themed notes/learning platform with tag-based organization. Uses React Server Components by default, Client Components only for interactivity.

- **Path alias:** `@/*` maps to `./src/*`
- **Plans:** Implementation plans are saved in the `plans/` directory

## Key Tech Decisions

- **Auth:** Auth.js v5 (next-auth@beta) with JWT session strategy. GitHub OAuth + email/password credentials. Drizzle adapter stores users in Neon DB.
- **Database:** Neon serverless PostgreSQL via `@neondatabase/serverless` + Drizzle ORM.
- **Mutations:** Next.js Server Actions (no API routes for app logic).
- **Markdown:** `react-markdown` + `remark-gfm` with edit/preview toggle.
- **Linting:** Biome (not ESLint/Prettier). Auto-organizes imports. Config in `biome.json`.
- **Styling:** Tailwind CSS v4, dark mode via `.dark` class. shadcn/ui (new-york style, Lucide icons).

---

## Agent Domain Routing

Use this table to pick the right agent for a task. For cross-domain tasks, work from lowest layer up: **Auth → Server/DB → UI**.

| Task involves... | Agent |
|---|---|
| Login, register, OAuth, session, JWT, password, middleware, auth callbacks | **Auth** |
| DB schema, migrations, Drizzle queries, server actions, CRUD, data fetching, revalidation | **Server/DB** |
| React components, pages, layouts, styling, Tailwind, shadcn/ui, markdown rendering | **UI** |

---

## Agent: Auth

### Scope
Authentication, authorization, session management, and route protection.

### Owned Files
- `src/lib/auth.ts` — NextAuth config (GitHub OAuth + Credentials, DrizzleAdapter, JWT callbacks)
- `src/proxy.ts` — Route protection (`/notes/new`, `*/edit` require auth; auth pages redirect logged-in users)
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js HTTP handlers (GET/POST)
- `src/types/next-auth.d.ts` — Session type augmentation (`session.user.id`)
- `src/db/schema/auth.ts` — Auth tables: users, accounts, sessions, verificationTokens *(shared with Server/DB)*
- `src/app/(auth)/login/page.tsx` — Login page *(shared with UI for styling)*
- `src/app/(auth)/register/page.tsx` — Register page *(shared with UI for styling)*
- `src/app/(auth)/register/actions.ts` — Register server action (bcryptjs hash, user insert)
- `src/components/providers.tsx` — SessionProvider wrapper

### Key Patterns
- **JWT session strategy** — required for Credentials provider. `jwt` callback attaches `user.id` to token; `session` callback exposes as `session.user.id`.
- **Password hashing** — `bcryptjs` with cost factor 12. Never store plaintext.
- **Session access** — `import { auth } from "@/lib/auth"` then `const session = await auth()`. Always returns `session.user.id: string` when authenticated.
- **Custom pages** — `pages.signIn` set to `/login` in NextAuth config.
- **Env vars** — `AUTH_SECRET`, `AUTH_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

### Common Tasks
- Add new OAuth provider: add to `providers[]` in `src/lib/auth.ts`, add env vars, add button to login page
- Change protected routes: edit conditions in `src/proxy.ts`
- Modify session data: update `jwt`/`session` callbacks in `src/lib/auth.ts` + `src/types/next-auth.d.ts`
- Modify registration: edit `src/app/(auth)/register/actions.ts`

### Exports to Other Domains
- `auth()`, `signIn`, `signOut` from `@/lib/auth`
- `SessionProvider` via `src/components/providers.tsx`

---

## Agent: Server/DB

### Scope
Database schema, ORM configuration, data access layer, server actions for mutations, and migration management.

### Owned Files
- `src/index.ts` — Drizzle client (`export const db`), Neon serverless PostgreSQL
- `src/db/schema/notes.ts` — notes, tags, noteTags tables with Drizzle relations
- `src/db/schema/auth.ts` — auth tables *(shared with Auth — Auth owns schema design, Server/DB owns migrations)*
- `src/db/schema/index.ts` — barrel re-export of all schema modules
- `src/lib/queries.ts` — `getUserNotes(tagFilter?, searchQuery?)`, `getNoteById(noteId)`, `getNoteTags(noteId)`
- `src/app/(main)/notes/actions.ts` — `createNote`, `updateNote`, `deleteNote`
- `src/app/(main)/notes/tag-actions.ts` — `createTag`, `deleteTag`, `getUserTags`
- `drizzle.config.ts` — Drizzle Kit config (schema dir, migration output, PostgreSQL dialect)
- `drizzle/` — generated migration SQL files

### Key Patterns
- **Auth guard** — every function starts with `const session = await auth(); if (!session?.user?.id) ...`
- **Ownership scoping** — all queries filter `eq(table.userId, session.user.id)`. Never return other users' data.
- **Server action signature** — `(prevState: { error?: string } | undefined, formData: FormData)` for `useActionState` compatibility. Use `.bind(null, id)` to curry entity IDs.
- **After mutations** — `revalidatePath("/notes")` then `redirect()`.
- **Tag uniqueness** — `onConflictDoNothing()` on insert; unique index on `(name, userId)`.
- **Junction table updates** — delete all existing `noteTags` for note, then re-insert.
- **Schema conventions** — `text("id")` with `crypto.randomUUID()` for auth tables; `uuid("id").defaultRandom()` for app tables; timestamps `{ mode: "date" }`.
- **Migrations** — `npm run gen:migrations` then `npm run apply:migrations`. Review generated SQL before applying.

### Common Tasks
- Add table: create in `src/db/schema/`, add relations, export from barrel, generate + apply migration
- Add column: edit schema file, generate + apply migration
- Add query: add to `src/lib/queries.ts` with auth guard + ownership scope
- Add mutation: add server action to relevant `actions.ts` with auth guard, ownership check, revalidation, redirect

### Exports to Other Domains
- `db` from `@/index`
- Query functions from `@/lib/queries.ts`
- Server actions from `actions.ts` and `tag-actions.ts`

---

## Agent: UI

### Scope
All React components, pages, layouts, styling, and client-side interactivity.

### Owned Files
- `src/app/layout.tsx` — root layout (Server Component: calls `auth()`, wraps with Providers, renders Header)
- `src/app/page.tsx` — landing page (redirects to `/notes` if authenticated)
- `src/app/globals.css` — Tailwind v4 theme variables (oklch colors, dark/light mode, border radius)
- `src/app/(main)/notes/page.tsx` — notes dashboard
- `src/app/(main)/notes/new/page.tsx` — create note
- `src/app/(main)/notes/[id]/page.tsx` — view note
- `src/app/(main)/notes/[id]/edit/page.tsx` — edit note
- `src/app/(main)/notes/[id]/note-content.tsx` — markdown renderer (Client Component)
- `src/components/ui/custom/header.tsx` — app header with nav, search, user dropdown, sign-out
- `src/components/ui/custom/notes-list.tsx` — notes card grid
- `src/components/ui/custom/note-form.tsx` — create/edit form with markdown preview (Client Component)
- `src/components/ui/custom/tag-filter.tsx` — tag filtering badges (Client Component)
- `src/components/ui/custom/delete-note-button.tsx` — delete with confirmation (Client Component)
- `src/components/ui/custom/search-input.tsx` — search input (Client Component)
- `src/components/ui/` — shadcn/ui primitives (button, card, badge, input, label, textarea, avatar, dropdown-menu, separator)
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `components.json` — shadcn/ui config (new-york style, Lucide icons, `@/` aliases)

### Key Patterns
- **Server Components by default** — add `"use client"` only for hooks (useState, useRouter, useActionState) or browser APIs.
- **Dark theme** — `<html className="dark">`, body `bg-slate-950 text-slate-100`, cards `bg-slate-900/50 border-white/10`, primary buttons `bg-blue-600 hover:bg-blue-500 text-white`, outline `border-white/10 text-slate-300 hover:bg-white/5`.
- **shadcn/ui** — add via `npx shadcn add <name>`, import from `@/components/ui/<name>`. Never edit shadcn files directly.
- **Custom components** — go in `src/components/ui/custom/`. Import shadcn primitives from `@/components/ui/`.
- **Forms** — `useActionState(action, undefined)` with `state?.error` display and `pending` loading state.
- **Markdown** — `ReactMarkdown` with `remarkGfm`, wrapped in `prose prose-invert prose-sm max-w-none`.
- **Icons** — Lucide React. Common: Cpu, Plus, ArrowLeft, Pencil, Trash2, FileText, Edit, Eye, Search, X.
- **Container layout** — `container mx-auto px-4 py-8 max-w-5xl` (dashboard), `max-w-3xl` (forms/detail).
- **Page data flow** — Server Component calls `auth()` → query functions → render with data as props.
- **Next.js 16** — `searchParams` and `params` are Promises, must `await` them.

### Common Tasks
- Add page: create in appropriate route group, follow auth check pattern, use container layout
- Add custom component: create in `src/components/ui/custom/`, decide server vs client
- Add shadcn component: `npx shadcn add <name>`, import from `@/components/ui/<name>`
- Change theme: edit CSS variables in `src/app/globals.css` (both `:root` and `.dark` blocks)

### Depends On
- **Auth:** `auth()` for session checks in pages; `signOut` for header; `SessionProvider` from providers
- **Server/DB:** query functions from `@/lib/queries.ts` for data; server actions from `actions.ts` for forms

---

## Shared Conventions

- **Path alias:** `@/*` → `./src/*`. Always use this in imports.
- **Linting/Formatting:** Biome. Run `npm run lint` and `npm run format`. Config in `biome.json`. Auto-organizes imports.
- **TypeScript:** strict mode. No `any` types.
- **Error handling in server actions:** return `{ error: string }` for validation errors; throw for auth/access failures.
- **Env vars:** never commit `.env`. Required: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
- **Plans:** save implementation plans in `plans/` directory as `.md` files.

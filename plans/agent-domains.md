# DevVault — Domain Agent Structure

This document defines three specialized agent domains for the DevVault project. Each agent owns a set of files and follows specific patterns. Use this as a reference when delegating tasks.

---

## Agent Domain Routing

| Task involves... | Delegate to |
|---|---|
| Login, register, OAuth, session, JWT, password, middleware, auth callbacks | **Auth** |
| DB schema, migrations, Drizzle queries, server actions, CRUD, data fetching, revalidation | **Server/DB** |
| React components, pages, layouts, styling, Tailwind, shadcn/ui, markdown rendering | **UI** |

For cross-domain tasks, work from lowest layer up: **Auth → Server/DB → UI**.

---

## Agent: Auth

### Scope
Authentication, authorization, session management, and route protection.

### Owned Files
- `src/lib/auth.ts` — NextAuth config (GitHub OAuth + Credentials, DrizzleAdapter, JWT callbacks)
- `src/middleware.ts` — Route protection (`/notes/new`, `*/edit` require auth; auth pages redirect logged-in users)
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js HTTP handlers
- `src/types/next-auth.d.ts` — Session type augmentation (`session.user.id`)
- `src/db/schema/auth.ts` — Auth tables: users, accounts, sessions, verificationTokens *(shared with Server/DB)*
- `src/app/(auth)/login/page.tsx` — Login page *(shared with UI for styling)*
- `src/app/(auth)/register/page.tsx` — Register page *(shared with UI for styling)*
- `src/app/(auth)/register/actions.ts` — Register server action
- `src/components/providers.tsx` — SessionProvider wrapper

### Key Patterns
- **JWT session strategy** — required for Credentials provider. `jwt` callback adds `user.id` to token; `session` callback exposes it as `session.user.id`
- **Password hashing** — `bcryptjs` with cost factor 12. Never store plaintext.
- **Session access** — `import { auth } from "@/lib/auth"` then `const session = await auth()`
- **Custom pages** — `pages.signIn` set to `/login` in NextAuth config
- **Env vars** — `AUTH_SECRET`, `AUTH_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

### Common Tasks
- Add new OAuth provider: add to `providers[]` in `src/lib/auth.ts`, add env vars, add button to login page
- Change protected routes: edit conditions in `src/middleware.ts`
- Modify session data: update `jwt`/`session` callbacks + `next-auth.d.ts`

### Exports to Other Domains
- `auth()`, `signIn`, `signOut` from `@/lib/auth`
- `SessionProvider` via `src/components/providers.tsx`

---

## Agent: Server/DB

### Scope
Database schema, ORM configuration, data access, server actions, and migrations.

### Owned Files
- `src/index.ts` — Drizzle client (`export const db`), Neon serverless PostgreSQL
- `src/db/schema/notes.ts` — notes, tags, noteTags tables with Drizzle relations
- `src/db/schema/auth.ts` — auth tables *(shared with Auth — Auth owns design, Server/DB owns migrations)*
- `src/db/schema/index.ts` — barrel export
- `src/lib/queries.ts` — `getUserNotes(tagFilter?, searchQuery?)`, `getNoteById(noteId)`, `getNoteTags(noteId)`
- `src/app/(main)/notes/actions.ts` — `createNote`, `updateNote`, `deleteNote`
- `src/app/(main)/notes/tag-actions.ts` — `createTag`, `deleteTag`, `getUserTags`
- `drizzle.config.ts` — Drizzle Kit config
- `drizzle/` — generated migrations

### Key Patterns
- **Auth guard** — every function starts with `const session = await auth()` and checks `session?.user?.id`
- **Ownership scoping** — all queries use `eq(table.userId, session.user.id)`. Never return other users' data.
- **Server action signature** — `(prevState: { error?: string } | undefined, formData: FormData)` for `useActionState` compatibility
- **After mutations** — `revalidatePath("/notes")` then `redirect()`
- **Tag uniqueness** — `onConflictDoNothing()` on insert; unique index on `(name, userId)`
- **Junction table updates** — delete all existing `noteTags` for note, then re-insert new ones
- **Schema conventions** — `text("id")` with `crypto.randomUUID()` for auth tables; `uuid("id").defaultRandom()` for app tables; timestamps `{ mode: "date" }`
- **Migration commands** — `npm run gen:migrations` then `npm run apply:migrations`

### Common Tasks
- Add new table: create in `src/db/schema/`, add relations, export from barrel, generate + apply migration
- Add column: edit schema file, generate + apply migration
- Add query: add to `src/lib/queries.ts` with auth guard + ownership scope
- Add mutation: add server action to `actions.ts` with auth guard, ownership check, revalidation

### Exports to Other Domains
- `db` from `@/index`
- Query functions from `@/lib/queries.ts`
- Server actions from `actions.ts` and `tag-actions.ts`

---

## Agent: UI

### Scope
React components, pages, layouts, styling, and client-side interactivity.

### Owned Files
- `src/app/layout.tsx` — root layout (Server Component, auth session, Providers wrapper)
- `src/app/page.tsx` — landing page
- `src/app/globals.css` — Tailwind v4 theme variables (oklch colors, dark/light)
- `src/app/(main)/notes/page.tsx` — notes dashboard
- `src/app/(main)/notes/new/page.tsx` — create note
- `src/app/(main)/notes/[id]/page.tsx` — view note
- `src/app/(main)/notes/[id]/edit/page.tsx` — edit note
- `src/app/(main)/notes/[id]/note-content.tsx` — markdown renderer
- `src/components/ui/custom/` — header, notes-list, note-form, tag-filter, delete-note-button, search-input
- `src/components/ui/` — shadcn/ui primitives (button, card, badge, input, label, textarea, etc.)
- `src/lib/utils.ts` — `cn()` helper
- `components.json` — shadcn/ui config (new-york style, Lucide icons)

### Key Patterns
- **Server Components by default** — add `"use client"` only for hooks/browser APIs
- **Dark theme** — `<html className="dark">`, body `bg-slate-950 text-slate-100`, cards `bg-slate-900/50 border-white/10`, primary buttons `bg-blue-600 hover:bg-blue-500`
- **shadcn/ui** — add via `npx shadcn add <name>`, import from `@/components/ui/<name>`, never edit shadcn files directly
- **Forms** — `useActionState(action, undefined)` with `state?.error` display and `pending` loading state
- **Markdown** — `ReactMarkdown` with `remarkGfm`, wrapped in `prose prose-invert prose-sm max-w-none`
- **Icons** — Lucide React. Common: Cpu, Plus, ArrowLeft, Pencil, Trash2, FileText, Edit, Eye, Search, X
- **Container layout** — `container mx-auto px-4 py-8 max-w-5xl` (dashboard), `max-w-3xl` (forms/detail)
- **Page data flow** — Server Component calls `auth()` → query functions → render with data props
- **Next.js 16** — `searchParams` and `params` are Promises, must `await` them

### Common Tasks
- Add page: create in route group, follow auth check pattern, use container layout
- Add component: create in `src/components/ui/custom/`, decide server vs client
- Add shadcn component: `npx shadcn add <name>`
- Change theme: edit CSS variables in `src/app/globals.css` (`:root` and `.dark`)

### Depends On
- Auth: `auth()` for session checks in pages, `signOut` in header
- Server/DB: query functions for data, server actions for forms

---

## Shared Conventions

- **Path alias:** `@/*` → `./src/*`
- **Linting:** Biome (not ESLint). `npm run lint` / `npm run format`. Auto-organizes imports.
- **TypeScript:** strict mode, no `any`
- **Error handling:** return `{ error: string }` for validation errors; throw for auth/access failures
- **Env vars:** never commit `.env`. Required: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

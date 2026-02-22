# DevVault — Notes & Learning Platform Implementation Plan

## Context

The project is a fresh Next.js 16 app ("DevVault") with Drizzle ORM + Neon PostgreSQL configured but no schemas, no auth, and no business logic. The user wants to save interview questions and learning notes, organize them by tags, and require login to create/manage notes. Auth will use NextAuth (Auth.js v5) with both GitHub OAuth and email/password. Note content will support markdown with preview.

---

## Phase 1: Dependencies & Auth Setup

### 1.1 Install packages

```bash
npm install next-auth@beta @auth/drizzle-adapter bcryptjs react-markdown remark-gfm
npm install -D @types/bcryptjs
```

### 1.2 Database schema — Auth tables

**Create `src/db/schema/auth.ts`**

- `users` table (id, name, email, emailVerified, image, password)
- `accounts` table (OAuth accounts, composite PK on provider+providerAccountId)
- `sessions` table (sessionToken PK, userId, expires)
- `verificationTokens` table (identifier, token, expires)
- Follows Auth.js Drizzle adapter spec exactly; `password` column added for credentials provider

### 1.3 Database schema — Notes & Tags

**Create `src/db/schema/notes.ts`**

- `notes` table (id uuid, title, content, userId FK, createdAt, updatedAt)
- `tags` table (id uuid, name, userId FK, createdAt) with unique index on (name, userId)
- `noteTags` junction table (noteId, tagId) with composite PK
- Drizzle relations defined for relational queries

**Create `src/db/schema/index.ts`** — barrel export

### 1.4 Update DB client

**Modify `src/index.ts`**

- Pass schema to `drizzle()` for relational query support
- Change to named export `export const db`

### 1.5 Generate & apply migrations

```bash
npm run gen:migrations
npm run apply:migrations
```

### 1.6 Auth.js configuration

**Create `src/lib/auth.ts`**

- `NextAuth()` with `DrizzleAdapter(db)`
- JWT session strategy (required for credentials provider)
- GitHub provider (uses `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`)
- Credentials provider (email/password with bcrypt)
- JWT/session callbacks to include `user.id` in session
- Custom sign-in page: `/login`

**Create `src/app/api/auth/[...nextauth]/route.ts`** — export GET/POST handlers

**Create `src/types/next-auth.d.ts`** — augment Session type with `user.id`

### 1.7 Middleware for route protection

**Create `src/middleware.ts`**

- Protect `/notes/new` and `/notes/edit/*` — redirect to `/login` if unauthenticated
- Redirect `/login` and `/register` to `/notes` if already authenticated

### 1.8 Environment variables

**Update `.env`** — add `AUTH_SECRET`, `AUTH_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

---

## Phase 2: Server Actions & Data Queries

### 2.1 Auth actions

**Create `src/app/(auth)/register/actions.ts`**

- `registerUser` — validate fields, check existing email, hash password, insert user, redirect to login

### 2.2 Notes CRUD actions

**Create `src/app/(main)/notes/actions.ts`**

- `createNote` — auth check, insert note, insert noteTags, revalidate, redirect
- `updateNote` — auth + ownership check, update note, replace tags, revalidate
- `deleteNote` — auth + ownership check, delete note, revalidate, redirect

### 2.3 Tag actions

**Create `src/app/(main)/notes/tag-actions.ts`**

- `createTag` — insert with onConflictDoNothing, return tag
- `deleteTag` — auth + ownership check, delete tag
- `getUserTags` — return all tags for current user

### 2.4 Data fetching helpers

**Create `src/lib/queries.ts`**

- `getUserNotes(tagFilter?, searchQuery?)` — fetch user's notes, optional tag join filter, optional `ilike` search on title/content
- `getNoteById(noteId)` — fetch single note with its tags, ownership check
- `getNoteTags(noteId)` — fetch tags for a specific note

---

## Phase 3: UI — Auth Pages

### 3.1 Session provider

**Create `src/components/providers.tsx`** — Client Component wrapping `SessionProvider` from `next-auth/react`

### 3.2 Add shadcn/ui components

```bash
npx shadcn add card badge textarea label separator
```

### 3.3 Login page

**Create `src/app/(auth)/login/page.tsx`** (Client Component)

- Card with "Sign in with GitHub" button
- Separator
- Email/password form using `signIn("credentials", ...)`
- Error display, link to register page
- Dark theme styling (slate-900 card, blue-600 buttons)

### 3.4 Register page

**Create `src/app/(auth)/register/page.tsx`** (Client Component)

- Card with name, email, password fields
- Calls `registerUser` server action
- Link to login page

---

## Phase 4: UI — Notes Pages & Components

### 4.1 Update root layout

**Modify `src/app/layout.tsx`**

- Call `auth()` to get session
- Pass `isLoggedIn` and `user` to Header
- Wrap children with `<Providers>`
- Update metadata title/description

### 4.2 Update Header

**Modify `src/components/ui/custom/header.tsx`**

- Accept `user` prop, use actual name/avatar
- Wire "My Notes" → `<Link href="/notes">`
- Wire "New Note" → `<Link href="/notes/new">`
- Wire "Login" → `<Link href="/login">`
- Wire "Log out" → server action calling `signOut()`
- Wire search input to navigate `/notes?q=...`

### 4.3 Custom components

**Create `src/components/ui/custom/notes-list.tsx`** — grid of note cards (title, content preview, tags as badges, date)

**Create `src/components/ui/custom/tag-filter.tsx`** (Client Component) — horizontal tag badges that update URL `?tag=<id>`, "All" option to clear

**Create `src/components/ui/custom/note-form.tsx`** (Client Component) — title input, markdown textarea with live preview (react-markdown + remark-gfm), tag multi-select toggles, inline "create tag" input

**Create `src/components/ui/custom/delete-note-button.tsx`** (Client Component) — confirmation before calling `deleteNote` action

### 4.4 Notes dashboard

**Create `src/app/(main)/notes/page.tsx`** (Server Component)

- Auth check, redirect if not logged in
- Read `searchParams` for `?tag` and `?q` filters
- Fetch notes via `getUserNotes()`, tags via `getUserTags()`
- Render TagFilter + NotesList

### 4.5 Create note page

**Create `src/app/(main)/notes/new/page.tsx`** — auth check, fetch user tags, render NoteForm with `createNote` action

### 4.6 View note page

**Create `src/app/(main)/notes/[id]/page.tsx`** — auth check, fetch note by id, render title, tags as badges, content as rendered markdown, edit/delete buttons

### 4.7 Edit note page

**Create `src/app/(main)/notes/[id]/edit/page.tsx`** — auth check, fetch note, render NoteForm pre-filled with `updateNote` action

### 4.8 Update home page

**Modify `src/app/page.tsx`** — replace default Next.js template with DevVault landing page (hero, CTA to login/register or redirect to /notes if logged in)

---

## Route Structure

```
src/app/
├── layout.tsx                        ← modify (auth session, providers)
├── page.tsx                          ← modify (landing page)
├── (auth)/
│   ├── login/page.tsx                ← new
│   └── register/
│       ├── page.tsx                  ← new
│       └── actions.ts               ← new
├── (main)/notes/
│   ├── page.tsx                      ← new (dashboard)
│   ├── actions.ts                    ← new (CRUD)
│   ├── tag-actions.ts               ← new
│   ├── new/page.tsx                  ← new
│   └── [id]/
│       ├── page.tsx                  ← new (view)
│       └── edit/page.tsx             ← new
└── api/auth/[...nextauth]/route.ts   ← new
```

---

## Files Summary

**New files (22):**
| File | Type |
|------|------|
| `src/db/schema/auth.ts` | Auth DB schema |
| `src/db/schema/notes.ts` | Notes/Tags DB schema |
| `src/db/schema/index.ts` | Barrel export |
| `src/lib/auth.ts` | NextAuth config |
| `src/lib/queries.ts` | Data fetching helpers |
| `src/types/next-auth.d.ts` | Type augmentation |
| `src/middleware.ts` | Route protection |
| `src/components/providers.tsx` | SessionProvider wrapper |
| `src/components/ui/custom/notes-list.tsx` | Notes card grid |
| `src/components/ui/custom/tag-filter.tsx` | Tag filter bar |
| `src/components/ui/custom/note-form.tsx` | Create/edit form |
| `src/components/ui/custom/delete-note-button.tsx` | Delete button |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth API handler |
| `src/app/(auth)/login/page.tsx` | Login page |
| `src/app/(auth)/register/page.tsx` | Register page |
| `src/app/(auth)/register/actions.ts` | Register action |
| `src/app/(main)/notes/page.tsx` | Notes dashboard |
| `src/app/(main)/notes/actions.ts` | Notes CRUD actions |
| `src/app/(main)/notes/tag-actions.ts` | Tag actions |
| `src/app/(main)/notes/new/page.tsx` | Create note page |
| `src/app/(main)/notes/[id]/page.tsx` | View note page |
| `src/app/(main)/notes/[id]/edit/page.tsx` | Edit note page |

**Modified files (4):**
| File | Changes |
|------|---------|
| `src/index.ts` | Add schema to drizzle(), named export |
| `src/app/layout.tsx` | Auth session, Providers wrapper, metadata |
| `src/components/ui/custom/header.tsx` | Wire nav links, user prop, sign-out |
| `src/app/page.tsx` | DevVault landing page |

---

## Verification

1. **Auth flow:** Register with email/password → redirect to login → sign in → lands on `/notes`. Sign in with GitHub → callback → lands on `/notes`.
2. **Notes CRUD:** Create a note with title, markdown content, and tags → appears on dashboard. Edit note → changes reflected. Delete note → removed.
3. **Tag filtering:** Create multiple tags, assign to notes, click tag filter → only matching notes shown. Click "All" → shows all notes.
4. **Search:** Type in header search → navigates to `/notes?q=term` → filtered results.
5. **Route protection:** Visit `/notes/new` while logged out → redirected to `/login`. Visit `/login` while logged in → redirected to `/notes`.
6. **Build:** `npm run build` succeeds without errors.
7. **Lint:** `npm run lint` passes.

# Plan: Public Notes Access + Right-Side Tag Sidebar

**Date:** 2026-02-22
**Status:** Draft

---

## Goals

1. **Public browsing** — notes visible without login; create/edit/delete require auth
2. **Right-side tag sidebar** — move tag filter from horizontal top strip to vertical right panel
3. **Both note types in tag filter** — filtering by a tag shows both `note` and `interview` type notes
4. **Batch tag loading** — fix N+1 query loop in notes page

---

## Current State

| File | Problem |
|---|---|
| `notes/page.tsx` | Line 17: hard redirects to `/login` if not authenticated |
| `notes/[id]/page.tsx` | Line 17: hard redirects to `/login` if not authenticated |
| `queries.ts` | `getNoteById` requires auth; no public all-types query |
| `tag-filter.tsx` | Horizontal `flex-wrap` layout at the top of the page |
| `notes/page.tsx` | N+1 loop: calls `getNoteTags(id)` per note instead of batch |

**Proxy (`proxy.ts`) is already correct** — only protects `/notes/new` and `*/edit`, not `/notes` or `/notes/[id]`. No changes needed there.

---

## Files to Change (4 files, no schema/migrations)

### 1. `src/lib/queries.ts`

Add two new exported functions:

#### `getAllPublicNotes(tagId?, searchQuery?)`
- Returns notes of **both types** (`note` + `interview`) from all users
- No auth requirement
- If `tagId` provided: inner-join through `noteTags`/`tags` to filter
- If `searchQuery` provided: case-insensitive `ilike` on title + content
- Returns: `{ id, title, content, type, userId, createdAt, updatedAt }`
- Ordered by `updatedAt DESC`

#### `getPublicNoteById(noteId)`
- Returns a single note without auth check (no userId filter)
- Includes `userId` in the return so the view page can check ownership
- Joins `noteTags`/`tags` to return `tags: { id, name }[]`
- Returns `null` if not found

---

### 2. `src/app/(main)/notes/page.tsx`

**Auth behavior change:**
- Remove `redirect("/login")` (line 17)
- Detect session: `const session = await auth()`
- If authenticated → `getUserNotes(params.tag, params.q)` + `getUserTags()` (existing behavior)
- If not authenticated → `getAllPublicNotes(params.tag, params.q)` + `getPublicTags()`

**Batch tag loading fix:**
- Replace N+1 `for...of` loop using `getNoteTags(note.id)` with a single call to `getNoteTagsForNotes(noteIds)`

**Layout change — two-column with right sidebar:**

```
┌─────────────────────────────┬────────────────┐
│  Header row (title + btn)   │                │
├─────────────────────────────┤                │
│                             │  Tags Sidebar  │
│       Notes Grid            │  ──────────    │
│   (flex-1, 2-3 col grid)    │  All           │
│                             │  javascript    │
│                             │  react         │
│                             │  typescript    │
└─────────────────────────────┴────────────────┘
```

- Outer wrapper: `flex gap-6` inside the container
- Left: `<div className="flex-1 min-w-0">` → header row + `<NotesList />`
- Right: `<div className="w-56 flex-shrink-0 hidden md:block">` → `<TagFilter />`
- `max-w-6xl` (up from `max-w-5xl`) to accommodate sidebar
- "New Note" button: only render if `session?.user`
- Page title: `"My Notes"` when authenticated, `"Notes"` when public

---

### 3. `src/app/(main)/notes/[id]/page.tsx`

**Auth behavior change:**
- Remove `redirect("/login")` (line 17)
- Use `getPublicNoteById(id)` instead of `getNoteById(id)`
- Derive ownership: `const isOwner = session?.user?.id === note.userId`
- Render Edit + Delete buttons **only if** `isOwner === true`

No change to proxy — `/notes/[id]/edit` is already protected by middleware.

---

### 4. `src/components/ui/custom/tag-filter.tsx`

**Layout change — vertical sidebar:**
- Remove `flex flex-wrap gap-2 mb-6` container
- New container: `flex flex-col gap-1` with a section heading
- Add heading: `"Filter by Tag"` (small, uppercase, muted)
- Each tag button: full-width, left-aligned
- Badge: `w-full justify-start` so it fills the sidebar width
- Active/inactive styles remain the same (blue highlight)

Rough structure:
```tsx
<div className="flex flex-col gap-1">
  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
    Filter by Tag
  </p>
  <button ... className="w-full text-left">
    <Badge ... className="w-full justify-start ...">All</Badge>
  </button>
  {tags.map(tag => (
    <button key={tag.id} ... className="w-full text-left">
      <Badge ... className="w-full justify-start ...">
        {tag.name}
      </Badge>
    </button>
  ))}
</div>
```

---

## Implementation Order

1. `src/lib/queries.ts` — add `getAllPublicNotes` + `getPublicNoteById`
2. `src/components/ui/custom/tag-filter.tsx` — vertical sidebar layout
3. `src/app/(main)/notes/page.tsx` — public access + sidebar wiring + batch tags
4. `src/app/(main)/notes/[id]/page.tsx` — public access + owner-only controls

---

## Non-Goals (out of scope)

- No schema changes or DB migrations
- No changes to create/edit pages (already protected by proxy)
- No pagination (keep existing behavior)
- No mobile tag sidebar (hidden on `< md`, can be added later)

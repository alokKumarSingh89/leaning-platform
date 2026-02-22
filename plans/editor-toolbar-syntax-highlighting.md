# Plan: Enhanced Markdown Editor with Toolbar + Syntax Highlighting

## Context
The current note editor uses a plain `<Textarea>` with no formatting assistance and a basic `ReactMarkdown` preview with no syntax highlighting for code blocks. The user wants:
1. A **formatting toolbar** (bold, italic, headings, code, link, lists) that inserts markdown at the cursor
2. **Syntax-highlighted code blocks** in preview mode (language-aware)
3. A **taller editor** (currently `rows={12}`, increase to `rows={20}` + `min-h-[400px]`)

---

## Approach

Keep the existing **edit/preview toggle flow** — no WYSIWYG or Monaco replacement. The toolbar is pure markdown-insertion via DOM `selectionStart`/`selectionEnd`. Syntax highlighting uses `react-syntax-highlighter` (Prism build, `oneDark` theme) as a `components.code` override in `ReactMarkdown`.

A **new shared component `MarkdownContent`** eliminates the current duplication of `ReactMarkdown` + `remarkGfm` between `note-form.tsx` and `note-content.tsx`.

---

## Packages Installed

```bash
npm install react-syntax-highlighter
npm install -D @types/react-syntax-highlighter
```

**Why `react-syntax-highlighter` over alternatives:**
- `rehype-highlight` requires a separate highlight.js CSS file — fights with existing Tailwind prose overrides
- `shiki` requires async rendering — incompatible with client components without significant complexity
- `react-syntax-highlighter` is self-contained, JS-only theming, works perfectly as a ReactMarkdown `components.code` override, no extra CSS needed

---

## Files Changed

| File | Action |
|---|---|
| `package.json` | Added `react-syntax-highlighter` dep + `@types/react-syntax-highlighter` devDep |
| `src/components/ui/custom/markdown-content.tsx` | **Created** — shared renderer with syntax highlighting |
| `src/app/(main)/notes/[id]/note-content.tsx` | Simplified to delegate to `MarkdownContent` |
| `src/components/ui/custom/note-form.tsx` | Added toolbar, `useRef`, cursor restoration, taller textarea, swapped inline preview to `MarkdownContent` |

---

## 1. New file: `markdown-content.tsx`

`"use client"` (react-syntax-highlighter needs browser). Owns all `ReactMarkdown` + `remarkGfm` + syntax highlighter logic.

Key decisions:
- `Prism` build (not `Highlight`) — smaller + better language support
- `oneDark` theme — dark, matches `bg-slate-950` naturally, no extra CSS
- `PreTag="div"` — avoids double-`<pre>` nesting with ReactMarkdown's own pre renderer
- `background: "transparent"` on inner highlighter — outer `prose-pre:bg-slate-900` provides the container background
- Inline code (no language) falls back to styled `<code>` with `text-blue-300 bg-slate-800`
- Detect inline vs block: check for `language-X` class (fenced blocks always have it)

---

## 2. `note-content.tsx` — simplified

Removed `ReactMarkdown`/`remarkGfm` imports. Now a thin wrapper:
```tsx
export function NoteContent({ content }: { content: string }) {
  return <MarkdownContent content={content || "*No content*"} />;
}
```

---

## 3. `note-form.tsx` — main changes

### Toolbar
- Two small helper components (not exported): `ToolbarButton` and `ToolbarSeparator`
- Sits between the Label row and the Textarea, visually joined with `rounded-t-none` on Textarea + `rounded-t-md border-b-0` on toolbar
- Buttons: **B**, _I_, H1, H2, H3, inline code (Code2 icon), code block (Code icon), Link (Link2 icon), UL (List icon), OL (ListOrdered icon), HR (Minus icon)
- All `type="button"` — critical to prevent form submission

### Cursor insertion logic
Pure function `applyFormat(text, selStart, selEnd, format)` — defined outside the component:
- **Inline wrap** (bold, italic, inline code): wraps selection or inserts placeholder, places cursor inside markers when no selection
- **Block prefix** (h1, h2, h3, ul, ol): inserts prefix at start of current line
- **Block insert** (code block): inserts ` ```language\ncode\n``` `, cursor selects "language" word so user can type it
- **Link**: produces `[text](url)`, cursor placed on `url`
- **HR**: inserts `\n---\n`

### Cursor restoration after state update
React loses DOM selection when `value` prop changes. Fixed with `useRef` + `pendingCursor` state + `useEffect` pattern.

### Taller editor
`rows={20}` + `min-h-[400px]` on `<Textarea>` (up from `rows={12}`).

### Preview
Replaced inline `ReactMarkdown` with `<MarkdownContent content={...} />` in the preview pane.

---

## Status: Implemented ✓

Build passes, lint clean (only pre-existing `noNonNullAssertion` warnings in `drizzle.config.ts` and `src/index.ts`).

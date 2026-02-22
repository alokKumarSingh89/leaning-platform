"use client";

import {
  Code,
  Code2,
  Edit,
  Eye,
  Link2,
  List,
  ListOrdered,
  Minus,
  Plus,
  X,
} from "lucide-react";
import type React from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { createTag } from "@/app/(main)/notes/tag-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/ui/custom/markdown-content";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ── Toolbar helpers ──────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-white/10 hover:text-slate-100 transition-colors"
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="mx-1 h-4 w-px bg-white/10" aria-hidden="true" />;
}

// ── Format logic ─────────────────────────────────────────────────────────────

type FormatType =
  | "bold"
  | "italic"
  | "inlineCode"
  | "codeBlock"
  | "h1"
  | "h2"
  | "h3"
  | "link"
  | "ul"
  | "ol"
  | "hr";

function applyFormat(
  text: string,
  selStart: number,
  selEnd: number,
  format: FormatType,
): { newContent: string; cursorStart: number; cursorEnd: number } {
  const selected = text.slice(selStart, selEnd);
  const before = text.slice(0, selStart);
  const after = text.slice(selEnd);

  switch (format) {
    case "bold": {
      const inner = selected || "bold text";
      const wrapped = `**${inner}**`;
      const newContent = before + wrapped + after;
      const start = selStart + 2;
      return {
        newContent,
        cursorStart: start,
        cursorEnd: start + inner.length,
      };
    }
    case "italic": {
      const inner = selected || "italic text";
      const wrapped = `_${inner}_`;
      const newContent = before + wrapped + after;
      const start = selStart + 1;
      return {
        newContent,
        cursorStart: start,
        cursorEnd: start + inner.length,
      };
    }
    case "inlineCode": {
      const inner = selected || "code";
      const wrapped = `\`${inner}\``;
      const newContent = before + wrapped + after;
      const start = selStart + 1;
      return {
        newContent,
        cursorStart: start,
        cursorEnd: start + inner.length,
      };
    }
    case "codeBlock": {
      const nl = before.endsWith("\n") || before === "" ? "" : "\n";
      const inner = selected || "// code here";
      const block = `${nl}\`\`\`language\n${inner}\n\`\`\`\n`;
      const newContent = before + block + after;
      // Select "language" so user can type the language immediately
      const langStart = selStart + nl.length + 3;
      return { newContent, cursorStart: langStart, cursorEnd: langStart + 8 };
    }
    case "h1": {
      const lineStart = before.lastIndexOf("\n") + 1;
      const prefix = "# ";
      const newContent =
        text.slice(0, lineStart) + prefix + text.slice(lineStart);
      return {
        newContent,
        cursorStart: selStart + prefix.length,
        cursorEnd: selEnd + prefix.length,
      };
    }
    case "h2": {
      const lineStart = before.lastIndexOf("\n") + 1;
      const prefix = "## ";
      const newContent =
        text.slice(0, lineStart) + prefix + text.slice(lineStart);
      return {
        newContent,
        cursorStart: selStart + prefix.length,
        cursorEnd: selEnd + prefix.length,
      };
    }
    case "h3": {
      const lineStart = before.lastIndexOf("\n") + 1;
      const prefix = "### ";
      const newContent =
        text.slice(0, lineStart) + prefix + text.slice(lineStart);
      return {
        newContent,
        cursorStart: selStart + prefix.length,
        cursorEnd: selEnd + prefix.length,
      };
    }
    case "link": {
      const label = selected || "link text";
      const insertion = `[${label}](url)`;
      const newContent = before + insertion + after;
      // Place cursor on "url"
      const urlStart = selStart + 1 + label.length + 2;
      return { newContent, cursorStart: urlStart, cursorEnd: urlStart + 3 };
    }
    case "ul": {
      const lineStart = before.lastIndexOf("\n") + 1;
      const prefix = "- ";
      const newContent =
        text.slice(0, lineStart) + prefix + text.slice(lineStart);
      return {
        newContent,
        cursorStart: selStart + prefix.length,
        cursorEnd: selEnd + prefix.length,
      };
    }
    case "ol": {
      const lineStart = before.lastIndexOf("\n") + 1;
      const prefix = "1. ";
      const newContent =
        text.slice(0, lineStart) + prefix + text.slice(lineStart);
      return {
        newContent,
        cursorStart: selStart + prefix.length,
        cursorEnd: selEnd + prefix.length,
      };
    }
    case "hr": {
      const nl = before.endsWith("\n") || before === "" ? "" : "\n";
      const insertion = `${nl}---\n`;
      const newContent = before + insertion + after;
      const pos = selStart + nl.length + 4;
      return { newContent, cursorStart: pos, cursorEnd: pos };
    }
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Tag {
  id: string;
  name: string;
}

interface NoteData {
  title: string;
  content: string;
  type?: "note" | "interview";
  tags: Tag[];
}

// ── Component ────────────────────────────────────────────────────────────────

export function NoteForm({
  tags,
  initialData,
  action,
}: {
  tags: Tag[];
  initialData?: NoteData;
  action: (
    prevState: { error?: string } | undefined,
    formData: FormData,
  ) => Promise<{ error?: string } | undefined>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    new Set(initialData?.tags.map((t) => t.id) || []),
  );
  const [availableTags, setAvailableTags] = useState<Tag[]>(tags);
  const [newTagName, setNewTagName] = useState("");
  const [content, setContent] = useState(initialData?.content || "");
  const [showPreview, setShowPreview] = useState(false);
  const [noteType, setNoteType] = useState<"note" | "interview">(
    initialData?.type || "note",
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pendingCursor, setPendingCursor] = useState<{
    start: number;
    end: number;
  } | null>(null);

  useEffect(() => {
    if (pendingCursor && textareaRef.current) {
      textareaRef.current.setSelectionRange(
        pendingCursor.start,
        pendingCursor.end,
      );
      textareaRef.current.focus();
      setPendingCursor(null);
    }
  }, [pendingCursor]);

  function handleFormat(format: FormatType) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const result = applyFormat(content, selectionStart, selectionEnd, format);
    setContent(result.newContent);
    setPendingCursor({ start: result.cursorStart, end: result.cursorEnd });
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    const result = await createTag(newTagName.trim());
    if (result.tag) {
      const tag = result.tag;
      setAvailableTags((prev) => [...prev, tag]);
      setSelectedTagIds((prev) => new Set([...prev, tag.id]));
    }
    setNewTagName("");
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-slate-300">
          Title
        </Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={initialData?.title}
          placeholder="Note title"
          className="bg-white/5 backdrop-blur-sm border-white/10 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 text-slate-100 text-lg"
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content" className="text-slate-300">
            Content
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <Edit className="mr-1 h-3 w-3" /> Edit
              </>
            ) : (
              <>
                <Eye className="mr-1 h-3 w-3" /> Preview
              </>
            )}
          </Button>
        </div>

        {showPreview ? (
          <div className="min-h-[400px] rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <MarkdownContent content={content || "*No content*"} />
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 rounded-t-md border border-b-0 border-white/10 bg-white/5 backdrop-blur-sm">
              <ToolbarButton onClick={() => handleFormat("bold")} title="Bold">
                <span className="font-bold text-xs">B</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => handleFormat("italic")}
                title="Italic"
              >
                <span className="italic text-xs">I</span>
              </ToolbarButton>
              <ToolbarSeparator />
              <ToolbarButton
                onClick={() => handleFormat("h1")}
                title="Heading 1"
              >
                <span className="text-xs font-bold">H1</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => handleFormat("h2")}
                title="Heading 2"
              >
                <span className="text-xs font-bold">H2</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => handleFormat("h3")}
                title="Heading 3"
              >
                <span className="text-xs font-bold">H3</span>
              </ToolbarButton>
              <ToolbarSeparator />
              <ToolbarButton
                onClick={() => handleFormat("inlineCode")}
                title="Inline Code"
              >
                <Code2 className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => handleFormat("codeBlock")}
                title="Code Block"
              >
                <Code className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarSeparator />
              <ToolbarButton
                onClick={() => handleFormat("link")}
                title="Insert Link"
              >
                <Link2 className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarSeparator />
              <ToolbarButton
                onClick={() => handleFormat("ul")}
                title="Unordered List"
              >
                <List className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => handleFormat("ol")}
                title="Ordered List"
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarSeparator />
              <ToolbarButton
                onClick={() => handleFormat("hr")}
                title="Horizontal Rule"
              >
                <Minus className="h-3.5 w-3.5" />
              </ToolbarButton>
            </div>

            {/* Textarea — joined to toolbar, taller */}
            <Textarea
              ref={textareaRef}
              id="content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes in markdown..."
              rows={20}
              className="rounded-t-none bg-white/5 border-white/10 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 text-slate-100 font-mono text-sm min-h-[400px]"
            />
          </div>
        )}

        {showPreview && <input type="hidden" name="content" value={content} />}
      </div>

      {/* Type selector */}
      <div className="space-y-2">
        <Label className="text-slate-300">Type</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setNoteType("note")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              noteType === "note"
                ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25"
                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 backdrop-blur-sm"
            }`}
          >
            Note
          </button>
          <button
            type="button"
            onClick={() => setNoteType("interview")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              noteType === "interview"
                ? "bg-emerald-700 text-white border-emerald-600 shadow-md shadow-emerald-500/25"
                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 backdrop-blur-sm"
            }`}
          >
            Interview Question
          </button>
        </div>
        <input type="hidden" name="type" value={noteType} />
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <Label className="text-slate-300">Tags</Label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
            >
              <Badge
                variant={selectedTagIds.has(tag.id) ? "default" : "secondary"}
                className={
                  selectedTagIds.has(tag.id)
                    ? "bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-500/30"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 border-white/10"
                }
              >
                {tag.name}
                {selectedTagIds.has(tag.id) && <X className="ml-1 h-3 w-3" />}
              </Badge>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name"
            className="bg-white/5 backdrop-blur-sm border-white/10 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 text-slate-100 max-w-[200px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateTag();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCreateTag}
            className="border-white/10 text-slate-300 bg-white/5 hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedTagIds.size > 0 &&
        Array.from(selectedTagIds).map((id) => (
          <input key={id} type="hidden" name="tagIds" value={id} />
        ))}

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <Button
        type="submit"
        disabled={pending}
        className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 glow-blue hover:glow-blue-strong transition-all"
      >
        {pending ? "Saving..." : initialData ? "Update Note" : "Create Note"}
      </Button>
    </form>
  );
}

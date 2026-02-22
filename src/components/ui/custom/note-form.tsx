"use client";

import {
  ChevronDown,
  ChevronUp,
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
  disabled,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-white/10 hover:text-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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

// ── Section/FollowUp types ────────────────────────────────────────────────────

type SectionState = { id: string; heading: string; body: string };
type FollowUpState = { id: string; question: string; answer: string };

// ── Content parse/serialize ───────────────────────────────────────────────────

function parseNoteContent(
  raw: string,
  type: string,
): {
  sections: SectionState[];
  mainAnswer: string;
  followUps: FollowUpState[];
} {
  try {
    const parsed = JSON.parse(raw);
    if (type !== "interview" && Array.isArray(parsed)) {
      return {
        sections: parsed.map((s) => ({
          id: crypto.randomUUID(),
          heading: s.heading ?? "",
          body: s.body ?? "",
        })),
        mainAnswer: "",
        followUps: [],
      };
    }
    if (type === "interview" && parsed?.answer !== undefined) {
      return {
        sections: [{ id: crypto.randomUUID(), heading: "", body: "" }],
        mainAnswer: parsed.answer ?? "",
        followUps: (parsed.followUps ?? []).map(
          (f: { question: string; answer: string }) => ({
            id: crypto.randomUUID(),
            question: f.question ?? "",
            answer: f.answer ?? "",
          }),
        ),
      };
    }
  } catch {
    /* not JSON */
  }
  if (type === "interview") {
    return {
      sections: [{ id: crypto.randomUUID(), heading: "", body: "" }],
      mainAnswer: raw,
      followUps: [],
    };
  }
  return {
    sections: [{ id: crypto.randomUUID(), heading: "", body: raw }],
    mainAnswer: "",
    followUps: [],
  };
}

function serializeContent(
  type: string,
  sections: SectionState[],
  mainAnswer: string,
  followUps: FollowUpState[],
): string {
  if (type === "interview") {
    return JSON.stringify({
      answer: mainAnswer,
      followUps: followUps.map(({ question, answer }) => ({
        question,
        answer,
      })),
    });
  }
  return JSON.stringify(
    sections.map(({ heading, body }) => ({ heading, body })),
  );
}

// ── MarkdownEditor sub-component ─────────────────────────────────────────────

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  editorId?: string;
}

function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write in markdown...",
  rows = 12,
  editorId,
}: MarkdownEditorProps) {
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
    const result = applyFormat(value, selectionStart, selectionEnd, format);
    onChange(result.newContent);
    setPendingCursor({ start: result.cursorStart, end: result.cursorEnd });
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 rounded-t-md border border-b-0 border-white/10 bg-white/5 backdrop-blur-sm">
        <ToolbarButton onClick={() => handleFormat("bold")} title="Bold">
          <span className="font-bold text-xs">B</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => handleFormat("italic")} title="Italic">
          <span className="italic text-xs">I</span>
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton onClick={() => handleFormat("h1")} title="Heading 1">
          <span className="text-xs font-bold">H1</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => handleFormat("h2")} title="Heading 2">
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => handleFormat("h3")} title="Heading 3">
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
        <ToolbarButton onClick={() => handleFormat("link")} title="Insert Link">
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton
          onClick={() => handleFormat("ul")}
          title="Unordered List"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleFormat("ol")} title="Ordered List">
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
      <Textarea
        ref={textareaRef}
        id={editorId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="rounded-t-none bg-white/5 border-white/10 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 text-slate-100 font-mono text-sm min-h-[200px]"
      />
    </div>
  );
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
  const [showPreview, setShowPreview] = useState(false);
  const [noteType, setNoteType] = useState<"note" | "interview">(
    initialData?.type || "note",
  );

  const initialType = initialData?.type ?? "note";
  const _parsed = parseNoteContent(initialData?.content ?? "", initialType);

  const [sections, setSections] = useState<SectionState[]>(
    initialType !== "interview"
      ? _parsed.sections
      : [{ id: crypto.randomUUID(), heading: "", body: "" }],
  );
  const [mainAnswer, setMainAnswer] = useState(
    initialType === "interview" ? _parsed.mainAnswer : "",
  );
  const [followUps, setFollowUps] = useState<FollowUpState[]>(
    initialType === "interview" ? _parsed.followUps : [],
  );

  // ── Section CRUD ────────────────────────────────────────────────────────────

  function addSection() {
    setSections((prev) => [
      ...prev,
      { id: crypto.randomUUID(), heading: "", body: "" },
    ]);
  }

  function removeSection(id: string) {
    setSections((prev) =>
      prev.length > 1 ? prev.filter((s) => s.id !== id) : prev,
    );
  }

  function moveSectionUp(id: string) {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveSectionDown(id: string) {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function updateSectionHeading(id: string, val: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, heading: val } : s)),
    );
  }

  function updateSectionBody(id: string, val: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, body: val } : s)),
    );
  }

  // ── Follow-up CRUD ──────────────────────────────────────────────────────────

  function addFollowUp() {
    setFollowUps((prev) => [
      ...prev,
      { id: crypto.randomUUID(), question: "", answer: "" },
    ]);
  }

  function removeFollowUp(id: string) {
    setFollowUps((prev) => prev.filter((f) => f.id !== id));
  }

  function moveFollowUpUp(id: string) {
    setFollowUps((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveFollowUpDown(id: string) {
    setFollowUps((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function updateFollowUpQuestion(id: string, val: string) {
    setFollowUps((prev) =>
      prev.map((f) => (f.id === id ? { ...f, question: val } : f)),
    );
  }

  function updateFollowUpAnswer(id: string, val: string) {
    setFollowUps((prev) =>
      prev.map((f) => (f.id === id ? { ...f, answer: val } : f)),
    );
  }

  // ── Tag helpers ─────────────────────────────────────────────────────────────

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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden serialized content — always present, syncs on every render */}
      <input
        type="hidden"
        name="content"
        value={serializeContent(noteType, sections, mainAnswer, followUps)}
      />

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
          <Label className="text-slate-300">Content</Label>
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
          /* ── Preview mode ─────────────────────────────────────────────────── */
          <div className="min-h-[400px] rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            {noteType !== "interview" ? (
              <div className="space-y-8">
                {sections.map((s, i) => (
                  <div key={s.id}>
                    {s.heading && (
                      <h2 className="text-xl font-semibold text-slate-100 mb-3">
                        {s.heading}
                      </h2>
                    )}
                    <MarkdownContent content={s.body || "*No content*"} />
                    {i < sections.length - 1 && (
                      <hr className="border-white/10 mt-6" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <MarkdownContent content={mainAnswer || "*No answer yet*"} />
                {followUps.length > 0 && (
                  <div className="mt-6 space-y-4 pl-4 border-l-2 border-emerald-500/30">
                    {followUps.map((fu, i) => (
                      <div key={fu.id}>
                        <p className="font-semibold text-slate-200 mb-2">
                          Q{i + 1}: {fu.question}
                        </p>
                        <MarkdownContent
                          content={fu.answer || "*No answer yet*"}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : noteType !== "interview" ? (
          /* ── Edit mode — note sections ────────────────────────────────────── */
          <div className="space-y-4">
            {sections.map((section, i) => (
              <div
                key={section.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-400">
                    Section {i + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <ToolbarButton
                      onClick={() => moveSectionUp(section.id)}
                      title="Move up"
                      disabled={i === 0}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() => moveSectionDown(section.id)}
                      title="Move down"
                      disabled={i === sections.length - 1}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() => removeSection(section.id)}
                      title="Remove section"
                      disabled={sections.length === 1}
                    >
                      <X className="h-3.5 w-3.5" />
                    </ToolbarButton>
                  </div>
                </div>
                <Input
                  value={section.heading}
                  onChange={(e) =>
                    updateSectionHeading(section.id, e.target.value)
                  }
                  placeholder="Section heading (optional)"
                  className="bg-white/5 border-white/10 text-slate-100 text-sm"
                />
                <MarkdownEditor
                  value={section.body}
                  onChange={(val) => updateSectionBody(section.id, val)}
                  placeholder="Write your notes in markdown..."
                  rows={12}
                  editorId={`section-body-${section.id}`}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addSection}
              className="w-full py-2 rounded-xl border border-dashed border-white/10 text-sm text-slate-400 hover:text-slate-100 hover:border-white/20 transition-colors"
            >
              <Plus className="inline h-3.5 w-3.5 mr-1" /> Add Section
            </button>
          </div>
        ) : (
          /* ── Edit mode — interview ────────────────────────────────────────── */
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Main Answer</Label>
              <MarkdownEditor
                value={mainAnswer}
                onChange={setMainAnswer}
                placeholder="Write your main answer in markdown..."
                rows={12}
              />
            </div>
            {followUps.length > 0 && (
              <div className="space-y-4 pl-4 border-l-2 border-emerald-500/30">
                {followUps.map((fu, i) => (
                  <div
                    key={fu.id}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-emerald-400">
                        Follow-up {i + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <ToolbarButton
                          onClick={() => moveFollowUpUp(fu.id)}
                          title="Move up"
                          disabled={i === 0}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                          onClick={() => moveFollowUpDown(fu.id)}
                          title="Move down"
                          disabled={i === followUps.length - 1}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                          onClick={() => removeFollowUp(fu.id)}
                          title="Remove"
                        >
                          <X className="h-3.5 w-3.5" />
                        </ToolbarButton>
                      </div>
                    </div>
                    <Input
                      value={fu.question}
                      onChange={(e) =>
                        updateFollowUpQuestion(fu.id, e.target.value)
                      }
                      placeholder="Follow-up question"
                      className="bg-white/5 border-white/10 text-slate-100 text-sm"
                    />
                    <MarkdownEditor
                      value={fu.answer}
                      onChange={(val) => updateFollowUpAnswer(fu.id, val)}
                      placeholder="Answer in markdown..."
                      rows={8}
                      editorId={`followup-answer-${fu.id}`}
                    />
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={addFollowUp}
              className="w-full py-2 rounded-xl border border-dashed border-emerald-500/20 text-sm text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors"
            >
              <Plus className="inline h-3.5 w-3.5 mr-1" /> Add Follow-up
              Question
            </button>
          </div>
        )}
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

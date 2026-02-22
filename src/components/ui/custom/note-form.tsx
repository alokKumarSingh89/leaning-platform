"use client";

import { Edit, Eye, Plus, X } from "lucide-react";
import { useActionState, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createTag } from "@/app/(main)/notes/tag-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Tag {
  id: string;
  name: string;
}

interface NoteData {
  title: string;
  content: string;
  tags: Tag[];
}

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
          className="bg-slate-900/50 border-white/10 text-slate-100 text-lg"
        />
      </div>

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
          <div className="min-h-[200px] rounded-md border border-white/10 bg-slate-900/50 p-4 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || "*No content*"}
            </ReactMarkdown>
          </div>
        ) : (
          <Textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your notes in markdown..."
            rows={12}
            className="bg-slate-900/50 border-white/10 text-slate-100 font-mono text-sm"
          />
        )}

        {showPreview && <input type="hidden" name="content" value={content} />}
      </div>

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
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 border-white/5"
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
            className="bg-slate-900/50 border-white/10 text-slate-100 max-w-[200px]"
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
            className="border-white/10 text-slate-300 hover:bg-white/5"
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
        className="bg-blue-600 hover:bg-blue-500 text-white"
      >
        {pending ? "Saving..." : initialData ? "Update Note" : "Create Note"}
      </Button>
    </form>
  );
}

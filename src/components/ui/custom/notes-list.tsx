import { FileText } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function extractTextFromContent(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((s) => [s.heading ?? "", s.body ?? ""].filter(Boolean).join(" "))
        .join(" ");
    }
    if (parsed?.answer) {
      const fuText = (parsed.followUps ?? [])
        .map((f: { question?: string; answer?: string }) =>
          [f.question, f.answer].filter(Boolean).join(" "),
        )
        .join(" ");
      return [parsed.answer, fuText].filter(Boolean).join(" ");
    }
  } catch {
    /* not JSON */
  }
  return raw;
}

function stripMarkdown(raw: string): string {
  const text = extractTextFromContent(raw);
  return text
    .replace(/```[\s\S]*?```/g, "") // fenced code blocks
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/!\[.*?\]\(.*?\)/g, "") // images
    .replace(/\[(.+?)\]\(.*?\)/g, "$1") // links
    .replace(/^[-*+]\s+/gm, "") // unordered list markers
    .replace(/^\d+\.\s+/gm, "") // ordered list markers
    .replace(/^>\s+/gm, "") // blockquotes
    .replace(/[-]{3,}/g, "") // horizontal rules
    .replace(/\n+/g, " ") // collapse newlines
    .trim();
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export function NotesList({
  notes,
  noteTags,
}: {
  notes: Note[];
  noteTags: Record<string, { id: string; name: string }[]>;
}) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-white/5 bg-white/[0.02]">
        <FileText className="h-12 w-12 text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-300">No notes yet</h3>
        <p className="text-sm text-slate-500 mt-1">
          Create your first note to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => {
        const tags = noteTags[note.id] || [];
        return (
          <Link key={note.id} href={`/notes/${note.id}`}>
            <Card className="h-full glass-card hover:bg-white/[0.07] hover:border-blue-500/20 transition-all duration-200 cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-100 line-clamp-1">
                  {note.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-slate-400 line-clamp-3">
                  {note.content ? stripMarkdown(note.content) : "No content"}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2">
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  {note.updatedAt.toLocaleDateString()}
                </p>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

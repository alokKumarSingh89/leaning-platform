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
                  {note.content || "No content"}
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

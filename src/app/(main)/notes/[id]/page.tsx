import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteNoteButton } from "@/components/ui/custom/delete-note-button";
import { auth } from "@/lib/auth";
import { getNoteById } from "@/lib/queries";
import { NoteContent } from "./note-content";

interface NotePageProps {
  params: Promise<{ id: string }>;
}

export default async function NotePage({ params }: NotePageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const note = await getNoteById(id);
  if (!note) notFound();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Link
          href="/notes"
          className="text-sm text-slate-400 hover:text-slate-200 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Back to notes
        </Link>
      </div>

      <div className="flex items-start justify-between mb-4">
        <h1 className="text-3xl font-bold text-slate-100">{note.title}</h1>
        <div className="flex gap-2 flex-shrink-0 ml-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-white/10 text-slate-300 hover:bg-white/5"
          >
            <Link href={`/notes/${id}/edit`}>
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Link>
          </Button>
          <DeleteNoteButton noteId={id} />
        </div>
      </div>

      {note.tags.length > 0 && (
        <div className="flex gap-2 mb-6">
          {note.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="bg-blue-600/10 text-blue-400 border-blue-500/20"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 mb-6">
        Updated {note.updatedAt.toLocaleDateString()}
      </p>

      <div className="rounded-lg border border-white/5 bg-slate-900/30 p-6">
        <NoteContent content={note.content} />
      </div>
    </div>
  );
}

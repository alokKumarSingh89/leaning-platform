import { ArrowLeft, FileText, MessageSquare, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteNoteButton } from "@/components/ui/custom/delete-note-button";
import { auth } from "@/lib/auth";
import { getPublicNoteById } from "@/lib/queries";
import { NoteContent } from "./note-content";

interface NotePageProps {
  params: Promise<{ id: string }>;
}

export default async function NotePage({ params }: NotePageProps) {
  const session = await auth();
  const { id } = await params;

  const note = await getPublicNoteById(id);
  if (!note) notFound();

  const isOwner = session?.user?.id === note.userId;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Link
          href="/notes"
          className="text-sm text-slate-400 hover:text-slate-100 transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Back to notes
        </Link>
      </div>

      {note.type === "interview" ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-4">
          <MessageSquare className="h-3 w-3" /> Interview Question
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 mb-4">
          <FileText className="h-3 w-3" /> Note
        </span>
      )}

      <div className="flex items-start justify-between mb-4">
        <h1 className="text-3xl font-bold text-slate-100">{note.title}</h1>
        {isOwner && (
          <div className="flex gap-2 flex-shrink-0 ml-4">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-white/10 text-slate-300 bg-white/5 backdrop-blur-sm hover:bg-white/10"
            >
              <Link href={`/notes/${id}/edit`}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Link>
            </Button>
            <DeleteNoteButton noteId={id} />
          </div>
        )}
      </div>

      {note.tags.length > 0 && (
        <div className="flex gap-2 mb-6">
          {note.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="bg-blue-500/10 text-blue-300 border border-blue-500/20"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 mb-6">
        Updated {note.updatedAt.toLocaleDateString()}
      </p>

      <div className="rounded-xl backdrop-blur-sm p-6">
        <NoteContent content={note.content} type={note.type} />
      </div>
    </div>
  );
}

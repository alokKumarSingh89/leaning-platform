import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NoteForm } from "@/components/ui/custom/note-form";
import { auth } from "@/lib/auth";
import { getNoteById } from "@/lib/queries";
import { updateNote } from "../../actions";
import { getUserTags } from "../../tag-actions";

interface EditNotePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditNotePage({ params }: EditNotePageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const note = await getNoteById(id);
  if (!note) notFound();

  const tags = await getUserTags();

  const boundUpdateNote = updateNote.bind(null, id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/notes/${id}`}
          className="text-sm text-slate-400 hover:text-slate-200 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Back to note
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-100 mb-8">Edit Note</h1>
      <NoteForm
        tags={tags}
        initialData={{
          ...note,
          type: (note.type as "note" | "interview") ?? "note",
        }}
        action={boundUpdateNote}
      />
    </div>
  );
}

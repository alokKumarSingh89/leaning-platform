import { redirect } from "next/navigation";
import { NoteForm } from "@/components/ui/custom/note-form";
import { auth } from "@/lib/auth";
import { createNote } from "../actions";
import { getUserTags } from "../tag-actions";

export default async function NewNotePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tags = await getUserTags();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-slate-100 mb-8">
        Create New Note
      </h1>
      <NoteForm tags={tags} action={createNote} />
    </div>
  );
}

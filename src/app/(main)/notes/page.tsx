import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NotesList } from "@/components/ui/custom/notes-list";
import { TagFilter } from "@/components/ui/custom/tag-filter";
import { auth } from "@/lib/auth";
import { getNoteTags, getUserNotes } from "@/lib/queries";
import { getUserTags } from "./tag-actions";

interface NotesPageProps {
  searchParams: Promise<{ tag?: string; q?: string }>;
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const notes = await getUserNotes(params.tag, params.q);
  const allTags = await getUserTags();

  const noteTags: Record<string, { id: string; name: string }[]> = {};
  for (const note of notes) {
    noteTags[note.id] = await getNoteTags(note.id);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
          My Notes
        </h1>
        <Button
          asChild
          className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 glow-blue hover:glow-blue-strong transition-all"
        >
          <Link href="/notes/new">
            <Plus className="mr-2 h-4 w-4" /> New Note
          </Link>
        </Button>
      </div>

      <TagFilter tags={allTags} activeTagId={params.tag} />

      <NotesList notes={notes} noteTags={noteTags} />
    </div>
  );
}

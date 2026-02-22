import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NotesList } from "@/components/ui/custom/notes-list";
import { TagFilter } from "@/components/ui/custom/tag-filter";
import { auth } from "@/lib/auth";
import {
  getAllPublicNotes,
  getNoteTagsForNotes,
  getPublicTags,
  getUserNotes,
} from "@/lib/queries";
import { getUserTags } from "./tag-actions";

interface NotesPageProps {
  searchParams: Promise<{ tag?: string; q?: string }>;
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const session = await auth();
  const params = await searchParams;

  const notes = session?.user
    ? await getUserNotes(params.tag, params.q)
    : await getAllPublicNotes(params.tag, params.q);

  const allTags = session?.user ? await getUserTags() : await getPublicTags();

  const noteIds = notes.map((n) => n.id);
  const noteTags = await getNoteTagsForNotes(noteIds);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
          {session?.user ? "My Notes" : "Notes"}
        </h1>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <NotesList notes={notes} noteTags={noteTags} />
        </div>

        <div className="w-52 shrink-0 hidden md:block">
          <TagFilter tags={allTags} activeTagId={params.tag} />
        </div>
      </div>
    </div>
  );
}

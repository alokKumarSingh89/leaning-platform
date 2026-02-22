import { ArrowRight, BookOpen, Cpu, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HomeTagFilter } from "@/components/ui/custom/home-tag-filter";
import { auth } from "@/lib/auth";
import {
  getNoteTagsForNotes,
  getPublicNotes,
  getPublicTags,
} from "@/lib/queries";

interface HomePageProps {
  searchParams: Promise<{ tag?: string }>;
}

function EmptySection({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-white/5 bg-slate-900/30">
      <p className="text-sm text-slate-500">No {label} yet</p>
    </div>
  );
}

function NoteCard({
  note,
  tags,
}: {
  note: { id: string; title: string; content: string; updatedAt: Date };
  tags: { id: string; name: string }[];
}) {
  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="h-full bg-slate-900/50 border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer">
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
                  className="bg-blue-600/10 text-blue-400 border-blue-500/20 text-xs"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-600">
            {note.updatedAt.toLocaleDateString()}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default async function Home({ searchParams }: HomePageProps) {
  const session = await auth();
  const params = await searchParams;

  const [publicNotes, publicInterviews, allTags] = await Promise.all([
    getPublicNotes("note", params.tag),
    getPublicNotes("interview", params.tag),
    getPublicTags(),
  ]);

  const allNoteIds = [
    ...publicNotes.map((n) => n.id),
    ...publicInterviews.map((n) => n.id),
  ];
  const noteTagsMap = await getNoteTagsForNotes(allNoteIds);

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
          <Cpu className="h-7 w-7 text-blue-400" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-100 mb-3">
          Dev<span className="text-blue-500">Vault</span>
        </h1>
        <p className="text-lg text-slate-400 mb-6 max-w-xl mx-auto leading-relaxed">
          Personal knowledge base for interview prep and developer notes.
        </p>
        <div className="flex gap-3 justify-center">
          {session?.user ? (
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 px-6"
            >
              <Link href="/notes">
                My Notes <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 px-6"
              >
                <Link href="/register">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white px-6"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tag filter */}
      <Suspense>
        <HomeTagFilter tags={allTags} activeTagId={params.tag} />
      </Suspense>

      {/* Notes section */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-400" />
          Notes
          <span className="text-sm font-normal text-slate-500">
            (top {publicNotes.length})
          </span>
        </h2>
        {publicNotes.length === 0 ? (
          <EmptySection label="notes" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                tags={noteTagsMap[note.id] || []}
              />
            ))}
          </div>
        )}
      </section>

      {/* Interview Questions section */}
      <section>
        <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-400" />
          Interview Questions
          <span className="text-sm font-normal text-slate-500">
            (top {publicInterviews.length})
          </span>
        </h2>
        {publicInterviews.length === 0 ? (
          <EmptySection label="interview questions" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicInterviews.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                tags={noteTagsMap[note.id] || []}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { and, desc, eq, ilike, or } from "drizzle-orm";
import { notes, noteTags, tags } from "@/db/schema/notes";
import { db } from "@/index";
import { auth } from "@/lib/auth";

export async function getUserNotes(tagFilter?: string, searchQuery?: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  if (tagFilter) {
    const results = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .innerJoin(noteTags, eq(notes.id, noteTags.noteId))
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(and(eq(notes.userId, session.user.id), eq(tags.id, tagFilter)))
      .orderBy(desc(notes.updatedAt));

    return results;
  }

  if (searchQuery) {
    const pattern = `%${searchQuery}%`;
    const results = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .where(
        and(
          eq(notes.userId, session.user.id),
          or(ilike(notes.title, pattern), ilike(notes.content, pattern)),
        ),
      )
      .orderBy(desc(notes.updatedAt));

    return results;
  }

  return db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(eq(notes.userId, session.user.id))
    .orderBy(desc(notes.updatedAt));
}

export async function getNoteById(noteId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)))
    .limit(1);

  if (!note) return null;

  const noteTags_ = await db
    .select({ id: tags.id, name: tags.name })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(eq(noteTags.noteId, noteId));

  return { ...note, tags: noteTags_ };
}

export async function getNoteTags(noteId: string) {
  return db
    .select({ id: tags.id, name: tags.name })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(eq(noteTags.noteId, noteId));
}

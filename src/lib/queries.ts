import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
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
        type: notes.type,
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
        type: notes.type,
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
      type: notes.type,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(eq(notes.userId, session.user.id))
    .orderBy(desc(notes.updatedAt));
}

export async function getPublicNotes(
  type: "note" | "interview",
  tagId?: string,
) {
  if (tagId) {
    return db
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
      .where(and(eq(notes.type, type), eq(tags.id, tagId)))
      .orderBy(desc(notes.updatedAt))
      .limit(10);
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
    .where(eq(notes.type, type))
    .orderBy(desc(notes.updatedAt))
    .limit(10);
}

export async function getPublicTags() {
  return db
    .selectDistinct({ id: tags.id, name: tags.name })
    .from(tags)
    .innerJoin(noteTags, eq(tags.id, noteTags.tagId))
    .orderBy(tags.name);
}

export async function getNoteTagsForNotes(noteIds: string[]) {
  if (noteIds.length === 0)
    return {} as Record<string, { id: string; name: string }[]>;

  const rows = await db
    .select({ noteId: noteTags.noteId, id: tags.id, name: tags.name })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(inArray(noteTags.noteId, noteIds));

  return rows.reduce(
    (acc, row) => {
      if (!acc[row.noteId]) acc[row.noteId] = [];
      acc[row.noteId].push({ id: row.id, name: row.name });
      return acc;
    },
    {} as Record<string, { id: string; name: string }[]>,
  );
}

export async function getNoteById(noteId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [note] = await db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      type: notes.type,
      userId: notes.userId,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
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

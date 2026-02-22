"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notes, noteTags } from "@/db/schema/notes";
import { db } from "@/index";
import { auth } from "@/lib/auth";

export async function createNote(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const type = (formData.get("type") as string) || "note";
  const tagIds = formData.getAll("tagIds") as string[];

  if (!title?.trim()) {
    return { error: "Title is required" };
  }

  const noteType =
    type === "interview" ? "interview" : ("note" as "note" | "interview");

  const [note] = await db
    .insert(notes)
    .values({
      title: title.trim(),
      content: content || "",
      type: noteType,
      userId: session.user.id,
    })
    .returning();

  if (tagIds.length > 0) {
    await db
      .insert(noteTags)
      .values(tagIds.map((tagId) => ({ noteId: note.id, tagId })));
  }

  revalidatePath("/notes");
  redirect(`/notes/${note.id}`);
}

export async function updateNote(
  noteId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const type = (formData.get("type") as string) || "note";
  const tagIds = formData.getAll("tagIds") as string[];

  if (!title?.trim()) {
    return { error: "Title is required" };
  }

  const noteType =
    type === "interview" ? "interview" : ("note" as "note" | "interview");

  const [existing] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)))
    .limit(1);

  if (!existing) throw new Error("Note not found");

  await db
    .update(notes)
    .set({ title: title.trim(), content, type: noteType, updatedAt: new Date() })
    .where(eq(notes.id, noteId));

  await db.delete(noteTags).where(eq(noteTags.noteId, noteId));
  if (tagIds.length > 0) {
    await db
      .insert(noteTags)
      .values(tagIds.map((tagId) => ({ noteId, tagId })));
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}`);
  redirect(`/notes/${noteId}`);
}

export async function deleteNote(noteId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)));

  revalidatePath("/notes");
  redirect("/notes");
}

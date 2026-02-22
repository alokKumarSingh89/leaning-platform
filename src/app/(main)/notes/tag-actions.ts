"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { tags } from "@/db/schema/notes";
import { db } from "@/index";
import { auth } from "@/lib/auth";

export async function createTag(name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!name?.trim()) return { error: "Tag name is required" };

  const [tag] = await db
    .insert(tags)
    .values({ name: name.trim().toLowerCase(), userId: session.user.id })
    .onConflictDoNothing()
    .returning();

  revalidatePath("/notes");
  return { tag };
}

export async function deleteTag(tagId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, session.user.id)));

  revalidatePath("/notes");
}

export async function getUserTags() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db
    .select()
    .from(tags)
    .where(eq(tags.userId, session.user.id))
    .orderBy(tags.name);
}

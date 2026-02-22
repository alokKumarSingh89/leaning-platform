"use client";

import { MarkdownContent } from "@/components/ui/custom/markdown-content";

export function NoteContent({ content }: { content: string }) {
  return <MarkdownContent content={content || "*No content*"} />;
}

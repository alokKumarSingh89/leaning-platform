"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function NoteContent({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-a:text-blue-400 prose-code:text-blue-300 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/10">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content || "*No content*"}
      </ReactMarkdown>
    </div>
  );
}

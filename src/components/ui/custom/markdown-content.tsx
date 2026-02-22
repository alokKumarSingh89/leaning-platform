"use client";

import type { Element } from "hast";
import type React from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type CodeProps = React.ComponentPropsWithoutRef<"code"> & {
  node?: Element;
};

function CodeRenderer({ className, children, ...props }: CodeProps) {
  const match = /language-(\w+)/.exec(className ?? "");
  const codeString = String(children).replace(/\n$/, "");
  const isBlock = Boolean(match) || codeString.includes("\n");

  if (isBlock && match) {
    return (
      <SyntaxHighlighter
        style={oneDark}
        language={match[1]}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: "0.375rem",
          background: "transparent",
          padding: "0",
        }}
        codeTagProps={{
          style: { fontFamily: "ui-monospace, monospace" },
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    );
  }

  return (
    <code
      className={cn(
        "rounded bg-blue-500/10 border border-blue-500/10 px-1 py-0.5 text-sm text-blue-300 font-mono",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}

const markdownComponents: Components = {
  code: CodeRenderer as Components["code"],
};

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-100 prose-code:text-blue-300 prose-pre:bg-white/5 prose-pre:backdrop-blur-sm prose-pre:border prose-pre:border-white/10 prose-pre:p-4 prose-li:text-slate-300 prose-hr:border-white/10">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

"use client";

import { MarkdownContent } from "@/components/ui/custom/markdown-content";

type NoteSection = { heading: string; body: string };
type InterviewContent = {
  answer: string;
  followUps: { question: string; answer: string }[];
};
type ParsedContent =
  | { kind: "note"; data: NoteSection[] }
  | { kind: "interview"; data: InterviewContent }
  | { kind: "plain"; data: string };

function parseContent(raw: string, type?: string): ParsedContent {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { kind: "note", data: parsed as NoteSection[] };
    }
    if (parsed?.answer !== undefined && type === "interview") {
      return { kind: "interview", data: parsed as InterviewContent };
    }
  } catch {
    /* not JSON */
  }
  return { kind: "plain", data: raw };
}

export function NoteContent({
  content,
  type,
}: {
  content: string;
  type?: string;
}) {
  const parsed = parseContent(content, type);

  if (parsed.kind === "plain") {
    return <MarkdownContent content={parsed.data || "*No content*"} />;
  }

  if (parsed.kind === "note") {
    return (
      <div className="space-y-8">
        {parsed.data.map((section, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: sections have no stable id in stored data
          <div key={i}>
            {section.heading && (
              <h2 className="text-xl font-semibold text-slate-100 mb-3">
                {section.heading}
              </h2>
            )}
            <MarkdownContent content={section.body || "*No content*"} />
            {i < parsed.data.length - 1 && (
              <hr className="border-white/10 mt-6" />
            )}
          </div>
        ))}
      </div>
    );
  }

  // kind === "interview"
  const { answer, followUps } = parsed.data;
  return (
    <div className="space-y-6">
      <MarkdownContent content={answer || "*No answer yet*"} />
      {followUps.length > 0 && (
        <div className="mt-6 space-y-4 pl-4 border-l-2 border-emerald-500/30">
          {followUps.map((fu, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: follow-ups have no stable id in stored data
            <div key={i}>
              <p className="font-semibold text-slate-200 mb-2">
                Q{i + 1}: {fu.question}
              </p>
              <MarkdownContent content={fu.answer || "*No answer yet*"} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

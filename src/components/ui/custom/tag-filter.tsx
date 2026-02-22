"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Tag {
  id: string;
  name: string;
}

export function TagFilter({
  tags,
  activeTagId,
}: {
  tags: Tag[];
  activeTagId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleTagClick(tagId?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tagId) {
      params.set("tag", tagId);
    } else {
      params.delete("tag");
    }
    params.delete("q");
    router.push(`/notes?${params.toString()}`);
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
        Filter by Tag
      </p>
      <button
        type="button"
        className="w-full text-left"
        onClick={() => handleTagClick()}
      >
        <Badge
          variant={!activeTagId ? "default" : "secondary"}
          className={
            !activeTagId
              ? "w-full justify-start bg-blue-600 text-white hover:bg-blue-500 border border-blue-500 shadow-sm shadow-blue-500/30 cursor-pointer"
              : "w-full justify-start bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 cursor-pointer"
          }
        >
          All
        </Badge>
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          className="w-full text-left"
          onClick={() => handleTagClick(tag.id)}
        >
          <Badge
            variant={activeTagId === tag.id ? "default" : "secondary"}
            className={
              activeTagId === tag.id
                ? "w-full justify-start bg-blue-600 text-white hover:bg-blue-500 border border-blue-500 shadow-sm shadow-blue-500/30 cursor-pointer"
                : "w-full justify-start bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 cursor-pointer"
            }
          >
            {tag.name}
          </Badge>
        </button>
      ))}
    </div>
  );
}

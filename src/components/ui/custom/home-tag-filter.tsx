"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Tag {
  id: string;
  name: string;
}

export function HomeTagFilter({
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
    router.push(`/?${params.toString()}`);
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button type="button" onClick={() => handleTagClick()}>
        <Badge
          variant={!activeTagId ? "default" : "secondary"}
          className={
            !activeTagId
              ? "bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700 border-white/5 cursor-pointer"
          }
        >
          All
        </Badge>
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => handleTagClick(tag.id)}
        >
          <Badge
            variant={activeTagId === tag.id ? "default" : "secondary"}
            className={
              activeTagId === tag.id
                ? "bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 border-white/5 cursor-pointer"
            }
          >
            {tag.name}
          </Badge>
        </button>
      ))}
    </div>
  );
}

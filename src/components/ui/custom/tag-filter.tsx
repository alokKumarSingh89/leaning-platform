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
    <div className="flex flex-wrap gap-2 mb-6">
      <button type="button" onClick={() => handleTagClick()}>
        <Badge
          variant={!activeTagId ? "default" : "secondary"}
          className={
            !activeTagId
              ? "bg-blue-600 text-white hover:bg-blue-500 border border-blue-500 shadow-sm shadow-blue-500/30 cursor-pointer"
              : "bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 cursor-pointer"
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
                ? "bg-blue-600 text-white hover:bg-blue-500 border border-blue-500 shadow-sm shadow-blue-500/30 cursor-pointer"
                : "bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 cursor-pointer"
            }
          >
            {tag.name}
          </Badge>
        </button>
      ))}
    </div>
  );
}

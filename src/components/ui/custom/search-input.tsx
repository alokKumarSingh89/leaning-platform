"use client";

import { Command, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function SearchInput() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/notes?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/notes");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search notes..."
        className="pl-9 bg-slate-900/50 border-white/5 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 text-slate-300"
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-500">
        <Command className="h-2.5 w-2.5" /> K
      </kbd>
    </form>
  );
}

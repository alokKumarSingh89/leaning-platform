"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteNote } from "@/app/(main)/notes/actions";
import { Button } from "@/components/ui/button";

export function DeleteNoteButton({ noteId }: { noteId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteNote(noteId)}
        >
          Confirm Delete
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
          className="border-white/10 text-slate-300 bg-white/5 hover:bg-white/10"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setConfirming(true)}
      className="border-white/10 text-red-400 hover:bg-red-400/10 hover:border-red-400/20 hover:text-red-300 bg-white/5"
    >
      <Trash2 className="mr-1 h-4 w-4" />
      Delete
    </Button>
  );
}

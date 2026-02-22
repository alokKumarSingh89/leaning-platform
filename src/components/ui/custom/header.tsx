import { Cpu, Plus } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth";
import { SearchInput } from "./search-input";

interface HeaderUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function Header({
  isLoggedIn = false,
  user,
}: {
  isLoggedIn?: boolean;
  user?: HeaderUser;
}) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "DV";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 group-hover:border-blue-500/50 transition-all glow-blue group-hover:glow-blue-strong">
            <Cpu className="h-5 w-5 text-blue-400" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-100">
            Dev<span className="text-blue-500">Vault</span>
          </span>
        </Link>

        {isLoggedIn && (
          <div className="hidden md:flex relative w-full max-w-sm items-center">
            <SearchInput />
          </div>
        )}

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-white/5 hidden sm:flex"
              >
                <Link href="/notes">My Notes</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              >
                <Link href="/notes/new">
                  <Plus className="mr-2 h-4 w-4" /> New Note
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full border border-white/10 p-0 bg-white/5 hover:border-white/20 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.image || ""} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-slate-950/90 backdrop-blur-xl border-white/10 text-slate-300"
                  align="end"
                >
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium text-slate-100">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    asChild
                    className="hover:bg-white/5 cursor-pointer"
                  >
                    <Link href="/notes">My Notes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem className="p-0">
                    <form
                      action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/" });
                      }}
                      className="w-full"
                    >
                      <button
                        type="submit"
                        className="w-full text-left px-2 py-1.5 text-red-400 hover:bg-red-400/10 cursor-pointer rounded-sm"
                      >
                        Log out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              asChild
              variant="outline"
              className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            >
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

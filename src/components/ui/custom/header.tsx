import Link from "next/link";
import { Search, Plus, Cpu, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header({ isLoggedIn = false }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo Section */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 group-hover:border-blue-500/50 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Cpu className="h-5 w-5 text-blue-400" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-100">
            Dev<span className="text-blue-500">Vault</span>
          </span>
        </Link>

        {/* Center: Global Search (Command Palette Style) */}
        <div className="hidden md:flex relative w-full max-w-sm items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search notes..."
            className="pl-9 bg-slate-900/50 border-white/5 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 text-slate-300"
          />
          <kbd className="absolute right-3 inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-500">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-white/5 hidden sm:flex"
              >
                My Notes
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              >
                <Plus className="mr-2 h-4 w-4" /> New Note
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full border border-white/10 p-0"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>DV</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-slate-900 border-white/10 text-slate-300"
                  align="end"
                >
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem className="hover:bg-white/5 cursor-pointer">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-white/5 cursor-pointer">
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem className="text-red-400 hover:bg-red-400/10 cursor-pointer">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              variant="outline"
              className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

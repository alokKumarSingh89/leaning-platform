import { ArrowRight, Cpu } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/notes");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
          <Cpu className="h-8 w-8 text-blue-400" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-slate-100 mb-4">
          Dev<span className="text-blue-500">Vault</span>
        </h1>
        <p className="text-xl text-slate-400 mb-8 leading-relaxed">
          Your personal knowledge base for interview prep and learning notes.
          Organize everything with tags and find it when you need it.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 px-6"
          >
            <Link href="/register">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white px-6"
          >
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

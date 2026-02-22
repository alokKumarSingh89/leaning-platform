"use client";

import { Cpu } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "./actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerUser, undefined);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl"
      />
      <Card className="w-full max-w-md bg-white/5 backdrop-blur-md border-white/10 shadow-2xl shadow-black/30 relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 glow-blue">
            <Cpu className="h-6 w-6 text-blue-400" />
          </div>
          <CardTitle className="text-2xl text-slate-100">
            Create an account
          </CardTitle>
          <CardDescription className="text-slate-400">
            Start saving your notes and interview prep
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                required
                className="bg-white/5 border-white/10 backdrop-blur-sm focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 text-slate-100"
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="bg-white/5 border-white/10 backdrop-blur-sm focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 text-slate-100"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="bg-white/5 border-white/10 backdrop-blur-sm focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 text-slate-100"
              />
              <p className="text-xs text-slate-500">Minimum 6 characters</p>
            </div>
            {state?.error && (
              <p className="text-sm text-red-400">{state.error}</p>
            )}
            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
            >
              {pending ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

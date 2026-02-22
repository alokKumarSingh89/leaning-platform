import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import Header from "@/components/ui/custom/header";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "DevVault - Developer Notes & Interview Prep",
  description:
    "Save interview questions and learning notes. Organize with tags.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        <Providers>
          <Header isLoggedIn={!!session?.user} user={session?.user} />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}

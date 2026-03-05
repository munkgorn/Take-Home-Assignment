"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Meeting Scheduler</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/profile"
              className="hidden sm:inline text-sm text-muted-foreground truncate max-w-[200px] hover:text-foreground transition-colors"
            >
              {session?.user?.name || session?.user?.email}
            </Link>
            <Separator orientation="vertical" className="hidden sm:block h-6" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

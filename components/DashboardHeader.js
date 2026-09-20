"use client";

import { useRouter } from "next/navigation";

export default function DashboardHeader({ title, user, links = [] }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="border-b border-char-900/10 bg-linen/95 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-display text-xl text-char-900">{title}</span>
          <nav className="hidden sm:flex items-center gap-4">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-char-700/70 hover:text-char-900">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-char-700/60">{user.name}</span>
          <button
            onClick={signOut}
            className="focus-ring text-sm font-medium text-char-900 border border-char-900/20 rounded-full px-4 py-1.5 hover:border-char-900/50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

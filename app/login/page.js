"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const ROLE_HOME = { admin: "/admin", manager: "/manager", staff: "/staff" };
const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@rms.local", password: "Admin123!" },
  { role: "Manager", email: "manager@rms.local", password: "Manager123!" },
  { role: "Staff", email: "staff@rms.local", password: "Staff123!" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't sign in.");
        setSubmitting(false);
        return;
      }
      router.push(ROLE_HOME[data.user.role] || "/");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl text-char-900">Staff sign in</h1>
          <p className="text-char-700/70 mt-1">
            For Admin, Manager, and Staff accounts.
          </p>

          <div className="mt-6 rounded-xl border border-char-900/10 bg-char-900/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-char-700/70">
              Demo accounts
            </p>
            <div className="mt-3 space-y-2 text-sm text-char-700/80">
              {DEMO_ACCOUNTS.map((demo) => (
                <div
                  key={demo.role}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 border border-char-900/10"
                >
                  <div>
                    <div className="font-medium text-char-900">{demo.role}</div>
                    <div>{demo.email}</div>
                  </div>
                  <span className="font-medium text-char-700/70">
                    {demo.password}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-char-700/70 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus-ring w-full rounded-lg border border-char-900/20 px-4 py-3 bg-white text-char-900"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-char-700/70 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring w-full rounded-lg border border-char-900/20 px-4 py-3 bg-white text-char-900"
              />
            </div>

            {error && <p className="text-brick-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="focus-ring w-full rounded-full bg-char-900 text-linen py-3 font-medium hover:bg-char-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <Link
            href="/menu"
            className="focus-ring block mt-6 text-center text-sm text-char-700/60 hover:text-char-900"
          >
            I&apos;m a customer — take me to the menu
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}

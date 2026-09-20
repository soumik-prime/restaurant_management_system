"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Wraps a dashboard page: confirms the visitor is signed in with an allowed
// role before rendering `children`, otherwise bounces to /login. Actual data
// access is still enforced server-side by each API route — this just avoids
// flashing a staff screen at a logged-out visitor.
export default function RoleGate({ roles, children }) {
  const router = useRouter();
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user || !roles.includes(data.user.role)) {
          router.replace("/login");
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.replace("/login"));
  }, [roles, router]);

  if (user === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-char-700/60">Loading…</p>
      </main>
    );
  }

  return children(user);
}

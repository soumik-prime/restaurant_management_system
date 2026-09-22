import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "../../../lib/db";
import { requireRole } from "../../../lib/auth";

// FR-11: Admin creates/edits/deactivates Manager and Staff accounts.
export async function GET() {
  const user = await requireRole(["admin"]);
  if (!user) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const users = await query(
    "SELECT id, name, email, role, is_active, created_at FROM users WHERE role IN ('manager','staff') ORDER BY created_at DESC"
  );
  return NextResponse.json({ users });
}

export async function POST(request) {
  const admin = await requireRole(["admin"]);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const { name, email, password, role } = body;
  if (!name || !name.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!email || !email.trim())
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (!password || password.length < 6)
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  if (!["manager", "staff"].includes(role)) {
    return NextResponse.json({ error: "Role must be manager or staff." }, { status: 400 });
  }

  const [existing] = await query("SELECT id FROM users WHERE email = ?", [email.trim()]);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await query(
    "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)",
    [name.trim(), email.trim(), hash, role]
  );

  const [created] = await query(
    "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?",
    [result.insertId]
  );
  return NextResponse.json({ user: created }, { status: 201 });
}

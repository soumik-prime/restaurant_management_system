import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "../../../../lib/db";
import { requireRole } from "../../../../lib/auth";

export async function PUT(request, { params }) {
  const admin = await requireRole(["admin"]);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { id } = await params;
  const [existing] = await query("SELECT * FROM users WHERE id = ? AND role IN ('manager','staff')", [id]);
  if (!existing) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const name = body.name !== undefined ? String(body.name).trim() : existing.name;
  const is_active = body.is_active !== undefined ? (body.is_active ? 1 : 0) : existing.is_active;
  const role = body.role !== undefined ? body.role : existing.role;

  if (!["manager", "staff"].includes(role)) {
    return NextResponse.json({ error: "Role must be manager or staff." }, { status: 400 });
  }
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  if (body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    const hash = await bcrypt.hash(body.password, 10);
    await query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, id]);
  }

  await query("UPDATE users SET name = ?, is_active = ?, role = ? WHERE id = ?", [
    name,
    is_active,
    role,
    id,
  ]);

  const [updated] = await query(
    "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?",
    [id]
  );
  return NextResponse.json({ user: updated });
}

export async function DELETE(request, { params }) {
  const admin = await requireRole(["admin"]);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { id } = await params;
  const [existing] = await query("SELECT id FROM users WHERE id = ? AND role IN ('manager','staff')", [id]);
  if (!existing) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  // Deactivate rather than hard-delete, to preserve any history tied to this account.
  await query("UPDATE users SET is_active = 0 WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}

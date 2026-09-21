import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import { requireRole } from "../../../../lib/auth";

// FR-10: edit an item, or mark it available/unavailable.
export async function PUT(request, { params }) {
  const user = await requireRole(["admin", "manager"]);
  if (!user) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { id } = await params;
  const [existing] = await query("SELECT * FROM menu_items WHERE id = ?", [id]);
  if (!existing) return NextResponse.json({ error: "Menu item not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const name = body.name !== undefined ? String(body.name).trim() : existing.name;
  const description =
    body.description !== undefined ? String(body.description).trim() : existing.description;
  const category = body.category !== undefined ? String(body.category).trim() : existing.category;
  const price = body.price !== undefined ? Number(body.price) : existing.price;
  const image_url =
    body.image_url !== undefined
      ? String(body.image_url).trim() || null
      : existing.image_url;
  const is_veg = body.is_veg !== undefined ? (body.is_veg ? 1 : 0) : existing.is_veg;
  const is_featured =
    body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : existing.is_featured;
  const is_available =
    body.is_available !== undefined ? (body.is_available ? 1 : 0) : existing.is_available;

  if (!name) return NextResponse.json({ error: "Item name is required." }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Price must be a positive number." }, { status: 400 });
  }

  await query(
    `UPDATE menu_items
     SET name = ?, description = ?, category = ?, price = ?, image_url = ?, is_veg = ?, is_featured = ?, is_available = ?
     WHERE id = ?`,
    [name, description, category, price, image_url, is_veg, is_featured, is_available, id]
  );

  const [updated] = await query("SELECT * FROM menu_items WHERE id = ?", [id]);
  return NextResponse.json({ item: updated });
}

export async function DELETE(request, { params }) {
  const user = await requireRole(["admin", "manager"]);
  if (!user) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { id } = await params;
  const [existing] = await query("SELECT id FROM menu_items WHERE id = ?", [id]);
  if (!existing) return NextResponse.json({ error: "Menu item not found." }, { status: 404 });

  await query("DELETE FROM menu_items WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}

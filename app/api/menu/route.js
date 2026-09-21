import { NextResponse } from "next/server";
import { query } from "../../../lib/db";
import { requireRole } from "../../../lib/auth";

// Always read the live menu from the database — never cache it at build time.
export const dynamic = "force-dynamic";

// FR-01: View Available Menu (public). Staff-side callers can pass
// ?all=1 to see unavailable items too, for menu management.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wantAll = searchParams.get("all") === "1";

  let items;
  if (wantAll) {
    const user = await requireRole(["admin", "manager"]);
    if (!user) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    items = await query("SELECT * FROM menu_items ORDER BY category, name");
  } else {
    items = await query(
      "SELECT id, name, description, price, category, image_url, is_veg, is_featured FROM menu_items WHERE is_available = 1 ORDER BY category, name"
    );
  }

  return NextResponse.json({ items });
}

// FR-10: Manage Menu — add a new item (Manager or Admin).
export async function POST(request) {
  const user = await requireRole(["admin", "manager"]);
  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const {
    name,
    description = "",
    price,
    category,
    image_url = null,
    is_veg = true,
    is_featured = false,
    is_available = true,
  } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Item name is required." }, { status: 400 });
  }
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return NextResponse.json({ error: "Price must be a positive number." }, { status: 400 });
  }
  if (!category || !category.trim()) {
    return NextResponse.json({ error: "Category is required." }, { status: 400 });
  }
  const cleanImageUrl = image_url && String(image_url).trim() ? String(image_url).trim() : null;

  const result = await query(
    `INSERT INTO menu_items
       (name, description, price, category, image_url, is_veg, is_featured, is_available)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name.trim(),
      description.trim(),
      numericPrice,
      category.trim(),
      cleanImageUrl,
      is_veg ? 1 : 0,
      is_featured ? 1 : 0,
      is_available ? 1 : 0,
    ]
  );

  const [item] = await query("SELECT * FROM menu_items WHERE id = ?", [result.insertId]);
  return NextResponse.json({ item }, { status: 201 });
}

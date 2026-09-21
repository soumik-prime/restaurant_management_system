import { NextResponse } from "next/server";
import crypto from "crypto";
import { query, transaction } from "../../../lib/db";
import { requireRole } from "../../../lib/auth";

function generateTrackingToken() {
  return crypto.randomBytes(24).toString("hex");
}

// FR-02, FR-03, FR-04, FR-05: place a dine-in order against a table number,
// with either online or pay-on-completion payment. No login required —
// customers are identified by table number + a private tracking token.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const { table_number, payment_method, items } = body;

  if (!table_number || !String(table_number).trim()) {
    return NextResponse.json({ error: "Table number is required." }, { status: 400 });
  }
  if (!["ONLINE", "ON_COMPLETION"].includes(payment_method)) {
    return NextResponse.json({ error: "Choose a valid payment method." }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Your order has no items." }, { status: 400 });
  }

  // Re-price server-side against the live, available menu — never trust
  // prices sent from the client.
  const ids = items.map((i) => Number(i.menu_item_id)).filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ error: "Your order has no valid items." }, { status: 400 });
  }
  const placeholders = ids.map(() => "?").join(",");
  const menuRows = await query(
    `SELECT id, name, price, is_available FROM menu_items WHERE id IN (${placeholders})`,
    ids
  );
  const menuById = new Map(menuRows.map((m) => [m.id, m]));

  const lineItems = [];
  for (const raw of items) {
    const menuItem = menuById.get(Number(raw.menu_item_id));
    const quantity = Number(raw.quantity);
    if (!menuItem) {
      return NextResponse.json({ error: "One of the items is no longer on the menu." }, { status: 409 });
    }
    if (!menuItem.is_available) {
      return NextResponse.json(
        { error: `${menuItem.name} is no longer available.` },
        { status: 409 }
      );
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return NextResponse.json({ error: "Check the quantities in your order." }, { status: 400 });
    }
    lineItems.push({ menu_item_id: menuItem.id, item_name: menuItem.name, unit_price: menuItem.price, quantity });
  }

  const trackingToken = generateTrackingToken();
  const paymentStatus = payment_method === "ONLINE" ? "PAID" : "UNPAID";

  // The order and all of its line items are saved together or not at all.
  const orderId = transaction((run) => {
    const { insertId } = run(
      `INSERT INTO orders (table_number, status, payment_method, payment_status, tracking_token)
       VALUES (?, 'CONFIRMED', ?, ?, ?)`,
      [String(table_number).trim(), payment_method, paymentStatus, trackingToken]
    );
    for (const li of lineItems) {
      run(
        "INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)",
        [insertId, li.menu_item_id, li.item_name, li.unit_price, li.quantity]
      );
    }
    return insertId;
  });

  const total = lineItems.reduce((sum, li) => sum + li.unit_price * li.quantity, 0);

  return NextResponse.json(
    {
      order: {
        id: orderId,
        table_number: String(table_number).trim(),
        status: "CONFIRMED",
        payment_method,
        payment_status: paymentStatus,
        tracking_token: trackingToken,
        total,
        items: lineItems,
      },
    },
    { status: 201 }
  );
}

// Staff/Manager order lists. FR-07/FR-08: staff work confirmed + ready
// orders; FR-06: manager sees everything to decide what to cancel.
export async function GET(request) {
  const user = await requireRole(["admin", "manager", "staff"]);
  if (!user) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const table = searchParams.get("table");

  const clauses = [];
  const params = [];
  if (status) {
    const statuses = status.split(",").map((s) => s.trim().toUpperCase());
    clauses.push(`o.status IN (${statuses.map(() => "?").join(",")})`);
    params.push(...statuses);
  }
  if (table) {
    clauses.push("o.table_number = ?");
    params.push(table);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const orders = await query(
    `SELECT o.* FROM orders o ${where} ORDER BY o.created_at DESC, o.id DESC LIMIT 200`,
    params
  );

  if (orders.length === 0) return NextResponse.json({ orders: [] });

  const orderIds = orders.map((o) => o.id);
  const itemPlaceholders = orderIds.map(() => "?").join(",");
  const allItems = await query(
    `SELECT * FROM order_items WHERE order_id IN (${itemPlaceholders})`,
    orderIds
  );
  const itemsByOrder = new Map();
  for (const it of allItems) {
    if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
    itemsByOrder.get(it.order_id).push(it);
  }

  const result = orders.map((o) => ({
    ...o,
    items: itemsByOrder.get(o.id) || [],
    total: (itemsByOrder.get(o.id) || []).reduce((sum, li) => sum + li.unit_price * li.quantity, 0),
  }));

  return NextResponse.json({ orders: result });
}

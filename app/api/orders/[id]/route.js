import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import { requireRole } from "../../../../lib/auth";

async function loadOrder(id) {
  const [order] = await query("SELECT * FROM orders WHERE id = ?", [id]);
  if (!order) return null;
  const items = await query("SELECT * FROM order_items WHERE order_id = ?", [id]);
  const total = items.reduce((sum, li) => sum + li.unit_price * li.quantity, 0);
  return { ...order, items, total };
}

// FR-09: Live Order Tracking. Customers authenticate with the private
// tracking token issued at checkout instead of a login. Staff/manager can
// also open any order by id from their dashboards.
export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const order = await loadOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const staffUser = await requireRole(["admin", "manager", "staff"]);
  if (!staffUser) {
    if (!token || token !== order.tracking_token) {
      return NextResponse.json({ error: "Not authorized to view this order." }, { status: 403 });
    }
  }

  return NextResponse.json({ order });
}

const NEXT_STATUS = {
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED"],
};

// FR-06 (Manager cancels), FR-07 (Staff marks prepared/ready),
// FR-08 (Staff marks served).
export async function PATCH(request, { params }) {
  const user = await requireRole(["admin", "manager", "staff"]);
  if (!user) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { id } = await params;
  const order = await loadOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || !body.status) {
    return NextResponse.json({ error: "A target status is required." }, { status: 400 });
  }
  const targetStatus = String(body.status).toUpperCase();

  if (targetStatus === "CANCELLED") {
    if (user.role !== "admin" && user.role !== "manager") {
      return NextResponse.json(
        { error: "Only a manager can cancel an order." },
        { status: 403 }
      );
    }
    if (order.status === "SERVED" || order.status === "CANCELLED") {
      return NextResponse.json(
        { error: `An order that is already ${order.status.toLowerCase()} cannot be cancelled.` },
        { status: 409 }
      );
    }
    const reason = (body.reason || "Item no longer available").trim();
    await query("UPDATE orders SET status = 'CANCELLED', cancel_reason = ? WHERE id = ?", [
      reason,
      id,
    ]);
    const updated = await loadOrder(id);
    return NextResponse.json({ order: updated });
  }

  const allowed = NEXT_STATUS[order.status] || [];
  if (!allowed.includes(targetStatus)) {
    return NextResponse.json(
      { error: `Cannot move an order from ${order.status} to ${targetStatus}.` },
      { status: 409 }
    );
  }

  await query("UPDATE orders SET status = ? WHERE id = ?", [targetStatus, id]);
  const updated = await loadOrder(id);
  return NextResponse.json({ order: updated });
}

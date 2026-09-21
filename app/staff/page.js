"use client";

import { useCallback, useEffect, useState } from "react";
import RoleGate from "../../components/RoleGate";
import DashboardHeader from "../../components/DashboardHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatMoney } from "../../lib/format";

const COLUMNS = [
  { status: "CONFIRMED", title: "Confirmed", action: "PREPARING", actionLabel: "Start preparing" },
  { status: "PREPARING", title: "Preparing", action: "READY", actionLabel: "Mark ready" },
  { status: "READY", title: "Ready to serve", action: "SERVED", actionLabel: "Mark served" },
];

function StaffDashboard() {
  const [orders, setOrders] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=CONFIRMED,PREPARING,READY");
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch {
      // keep showing last known state; next poll will retry
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function advance(order, nextStatus) {
    setBusyId(order.id);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't update that order.");
      } else {
        await load();
      }
    } catch {
      setError("Connection issue — please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {error && (
        <div className="max-w-5xl mx-auto px-5 pt-4">
          <p className="text-brick-600 text-sm">{error}</p>
        </div>
      )}
      <div className="max-w-5xl mx-auto px-5 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status}>
              <h2 className="font-display text-lg text-char-900 mb-3 flex items-center justify-between">
                {col.title}
                <span className="text-sm font-body text-char-700/50">{colOrders.length}</span>
              </h2>
              <div className="space-y-3">
                {colOrders.length === 0 && (
                  <p className="text-sm text-char-700/50 border border-dashed border-char-900/15 rounded-lg px-4 py-6 text-center">
                    Nothing here right now.
                  </p>
                )}
                {colOrders.map((order) => (
                  <div key={order.id} className="rounded-lg border border-char-900/15 bg-white px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-char-900">Table {order.table_number}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <ul className="mt-2 text-sm text-char-700/80 space-y-0.5">
                      {order.items.map((it) => (
                        <li key={it.id}>{it.quantity}× {it.item_name}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-char-700/50 mt-2">
                      #{order.id} · {formatMoney(order.total)} · {order.payment_status === "PAID" ? "Paid" : "Pay later"}
                    </p>
                    <button
                      onClick={() => advance(order, col.action)}
                      disabled={busyId === order.id}
                      className="focus-ring mt-3 w-full rounded-full bg-char-900 text-linen text-sm font-medium py-2 hover:bg-char-800 disabled:opacity-50 transition-colors"
                    >
                      {busyId === order.id ? "Updating…" : col.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StaffPage() {
  return (
    <RoleGate roles={["staff", "admin"]}>
      {(user) => (
        <main className="min-h-screen">
          <DashboardHeader title="MeetPoint · Staff" user={user} />
          <StaffDashboard />
        </main>
      )}
    </RoleGate>
  );
}

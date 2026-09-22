"use client";

import { useCallback, useEffect, useState } from "react";
import RoleGate from "../../components/RoleGate";
import DashboardHeader from "../../components/DashboardHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatMoney } from "../../lib/format";

const CANCELLABLE = ["CONFIRMED", "PREPARING", "READY"];

function ManagerDashboard() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("ACTIVE");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch {
      // next poll retries
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, [load]);

  const visibleOrders =
    filter === "ACTIVE"
      ? orders.filter((o) => !["SERVED", "CANCELLED"].includes(o.status))
      : filter === "ALL"
        ? orders
        : orders.filter((o) => o.status === filter);

  async function confirmCancel() {
    if (!cancelTarget) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${cancelTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          reason: reason || "Item no longer available",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't cancel that order.");
      } else {
        setCancelTarget(null);
        setReason("");
        await load();
      }
    } catch {
      setError("Connection issue — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="font-display text-2xl text-char-900">Orders</h1>
        <div className="flex gap-2 flex-wrap">
          {["ACTIVE", "READY", "SERVED", "CANCELLED", "ALL"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`focus-ring text-sm rounded-full px-3.5 py-1.5 border ${
                filter === f
                  ? "bg-char-900 text-linen border-char-900"
                  : "border-char-900/20 text-char-700 hover:border-char-900/50"
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-brick-600 text-sm mb-4">{error}</p>}

      <div className="border border-char-900/10 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-char-900/5 text-char-700/70">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Order</th>
              <th className="text-left px-4 py-2.5 font-medium">Table</th>
              <th className="text-left px-4 py-2.5 font-medium">Items</th>
              <th className="text-left px-4 py-2.5 font-medium">Total</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="text-left px-4 py-2.5 font-medium">Payment</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-char-900/10">
            {visibleOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 text-char-900">#{order.id}</td>
                <td className="px-4 py-3 text-char-900">
                  {order.table_number}
                </td>
                <td className="px-4 py-3 text-char-700/80">
                  {order.items
                    .map((it) => `${it.quantity}× ${it.item_name}`)
                    .join(", ")}
                </td>
                <td className="px-4 py-3 text-char-900">
                  {formatMoney(order.total)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-char-700/80">
                  {order.payment_status === "PAID" ? "Paid" : "On completion"}
                </td>
                <td className="px-4 py-3 text-right">
                  {CANCELLABLE.includes(order.status) && (
                    <button
                      onClick={() => setCancelTarget(order)}
                      className="focus-ring text-sm text-brick-600 hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {visibleOrders.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-char-700/50"
                >
                  No orders here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {cancelTarget && (
        <div className="fixed inset-0 z-20 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-char-900/40"
            onClick={() => setCancelTarget(null)}
          />
          <div className="relative bg-linen rounded-lg shadow-xl max-w-sm w-full p-6">
            <h2 className="font-display text-xl text-char-900">
              Cancel order #{cancelTarget.id}?
            </h2>
            <p className="text-sm text-char-700/70 mt-1">
              Table {cancelTarget.table_number} will be notified with the reason
              below.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Ran out of beef tehari"
              rows={3}
              className="focus-ring w-full mt-4 rounded-lg border border-char-900/20 px-3 py-2 bg-white text-char-900"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setCancelTarget(null)}
                className="focus-ring flex-1 rounded-full border border-char-900/20 py-2.5 text-sm font-medium text-char-900"
              >
                Keep order
              </button>
              <button
                onClick={confirmCancel}
                disabled={busy}
                className="focus-ring flex-1 rounded-full bg-brick-600 text-linen py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {busy ? "Cancelling…" : "Cancel order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManagerPage() {
  return (
    <RoleGate roles={["manager", "admin"]}>
      {(user) => (
        <main className="min-h-screen">
          <DashboardHeader
            title="MeetPoint · Manager"
            user={user}
            links={[
              { href: "/manager", label: "Orders" },
              { href: "/manager/menu", label: "Menu" },
            ]}
          />
          <ManagerDashboard />
        </main>
      )}
    </RoleGate>
  );
}

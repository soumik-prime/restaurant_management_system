"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatMoney, STATUS_LABELS, STATUS_STEPS } from "../../../lib/format";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

export default function TrackOrderPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/orders/${id}?token=${token || ""}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Couldn't load this order.");
          return;
        }
        setOrder(data.order);
        setError("");
      } catch {
        if (!cancelled) setError("Connection lost. Retrying…");
      }
    }

    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id, token]);

  if (error && !order) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-2xl text-char-900">{error}</h1>
        <Link href="/menu" className="focus-ring mt-6 text-char-900 underline">
          Start a new order
        </Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-char-700/60">Loading your order…</p>
      </main>
    );
  }

  const isCancelled = order.status === "CANCELLED";
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <main className="min-h-screen pb-16">
      <Header right={<span className="text-sm text-char-700/60">Table {order.table_number}</span>} />

      <div className="max-w-xl mx-auto px-5 pt-10">
        <p className="text-sm text-char-700/60">Order #{order.id}</p>
        <h1 className="font-display text-3xl text-char-900 mt-1">
          {isCancelled ? "Order cancelled" : STATUS_LABELS[order.status]}
        </h1>

        {isCancelled ? (
          <div className="mt-6 rounded-lg bg-brick-500/10 border border-brick-500/30 px-4 py-3">
            <p className="text-brick-600 font-medium">This order was cancelled.</p>
            {order.cancel_reason && (
              <p className="text-brick-600/80 text-sm mt-1">Reason: {order.cancel_reason}</p>
            )}
            <p className="text-char-700/70 text-sm mt-2">
              Please speak with staff, or start a new order.
            </p>
          </div>
        ) : (
          <ol className="mt-8 flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <li key={step} className="flex-1 flex items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      i <= currentStepIndex
                        ? "bg-ember-500 text-white"
                        : "bg-char-900/10 text-char-700/50"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs text-center w-16 ${
                      i <= currentStepIndex ? "text-char-900 font-medium" : "text-char-700/50"
                    }`}
                  >
                    {STATUS_LABELS[step]}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 -mt-5 ${
                      i < currentStepIndex ? "bg-ember-500" : "bg-char-900/10"
                    }`}
                  />
                )}
              </li>
            ))}
          </ol>
        )}

        <section className="mt-12">
          <h2 className="text-sm font-medium text-char-700/70 uppercase tracking-wide">Your items</h2>
          <ul className="mt-3 divide-y divide-char-900/10 border-y border-char-900/10">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between py-3 text-char-900">
                <span>{item.item_name} × {item.quantity}</span>
                <span>{formatMoney(item.unit_price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between mt-3 font-medium text-char-900">
            <span>Total</span>
            <span>{formatMoney(order.total)}</span>
          </div>
          <p className="text-sm text-char-700/60 mt-2">
            {order.payment_status === "PAID"
              ? "Paid online"
              : "Pay on completion — settle up when your order is served"}
          </p>
        </section>

        <Link href="/menu" className="focus-ring inline-block mt-10 text-char-900 underline">
          Order something else
        </Link>
      </div>

      <Footer />
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "../../lib/format";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const CART_KEY = "rms_cart";

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ONLINE");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let savedCart = {};
    try {
      savedCart = JSON.parse(sessionStorage.getItem(CART_KEY) || "{}");
    } catch {
      savedCart = {};
    }
    setCart(savedCart);

    fetch("/api/menu")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);
  const total = cartEntries.reduce((sum, [id, qty]) => {
    const item = itemsById.get(Number(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  async function placeOrder(e) {
    e.preventDefault();
    setError("");

    if (!tableNumber.trim()) {
      setError("Enter your table number.");
      return;
    }
    if (cartEntries.length === 0) {
      setError("Your order is empty.");
      return;
    }
    if (paymentMethod === "ONLINE") {
      if (card.number.replace(/\s/g, "").length < 12 || !card.expiry || card.cvc.length < 3) {
        setError("Enter valid card details, or choose Pay on completion instead.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_number: tableNumber.trim(),
          payment_method: paymentMethod,
          items: cartEntries.map(([id, qty]) => ({ menu_item_id: Number(id), quantity: qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't place your order. Please try again.");
        setSubmitting(false);
        return;
      }
      sessionStorage.removeItem(CART_KEY);
      router.push(`/track/${data.order.id}?token=${data.order.tracking_token}`);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (!loading && cartEntries.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-2xl text-char-900">Your order is empty</h1>
        <p className="text-char-700/70 mt-2">Add something from the menu before checking out.</p>
        <Link
          href="/menu"
          className="focus-ring mt-6 rounded-full bg-char-900 text-linen px-6 py-3 font-medium hover:bg-char-800"
        >
          Back to menu
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-16">
      <Header />

      <div className="max-w-xl mx-auto px-5 pt-8">
        <Link href="/menu" className="text-sm text-char-700/70 hover:text-char-900">
          ← Back to menu
        </Link>
        <h1 className="font-display text-3xl text-char-900 mt-4">Checkout</h1>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-char-700/70 uppercase tracking-wide">Order summary</h2>
          <ul className="mt-3 divide-y divide-char-900/10 border-y border-char-900/10">
            {cartEntries.map(([id, qty]) => {
              const item = itemsById.get(Number(id));
              if (!item) return null;
              return (
                <li key={id} className="flex justify-between py-3 text-char-900">
                  <span>{item.name} × {qty}</span>
                  <span>{formatMoney(item.price * qty)}</span>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-between mt-3 font-medium text-char-900">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </section>

        <form onSubmit={placeOrder} className="mt-10 space-y-8">
          <div>
            <label htmlFor="table" className="block text-sm font-medium text-char-700/70 uppercase tracking-wide mb-2">
              Table number
            </label>
            <input
              id="table"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. 12"
              className="focus-ring w-full rounded-lg border border-char-900/20 px-4 py-3 bg-white text-char-900"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-char-700/70 uppercase tracking-wide mb-2">
              Payment
            </span>
            <div className="space-y-2">
              <label className="flex items-center gap-3 rounded-lg border border-char-900/20 px-4 py-3 cursor-pointer has-[:checked]:border-char-900">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                  className="accent-char-900"
                />
                <span className="text-char-900">Pay online now</span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-char-900/20 px-4 py-3 cursor-pointer has-[:checked]:border-char-900">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "ON_COMPLETION"}
                  onChange={() => setPaymentMethod("ON_COMPLETION")}
                  className="accent-char-900"
                />
                <span className="text-char-900">Pay when my order is served</span>
              </label>
            </div>

            {paymentMethod === "ONLINE" && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <input
                  placeholder="Card number"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value })}
                  className="focus-ring col-span-2 rounded-lg border border-char-900/20 px-4 py-3 bg-white text-char-900"
                />
                <input
                  placeholder="MM/YY"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                  className="focus-ring rounded-lg border border-char-900/20 px-4 py-3 bg-white text-char-900"
                />
                <input
                  placeholder="CVC"
                  value={card.cvc}
                  onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                  className="focus-ring rounded-lg border border-char-900/20 px-4 py-3 bg-white text-char-900"
                />
                <p className="col-span-2 text-xs text-char-700/50">
                  Simulated payment for demonstration — no real card is charged.
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-brick-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="focus-ring w-full rounded-full bg-char-900 text-linen py-3.5 font-medium hover:bg-char-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Placing order…" : `Place order · ${formatMoney(total)}`}
          </button>
        </form>
      </div>

      <Footer />
    </main>
  );
}

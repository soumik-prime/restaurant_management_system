"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "../../lib/format";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import DishImage from "../../components/DishImage";
import VegBadge from "../../components/VegBadge";

const CART_KEY = "rms_cart";

export default function MenuPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState({}); // { [menuItemId]: quantity }
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Couldn't load the menu. Please refresh.");
        setLoading(false);
      });

    try {
      const saved = JSON.parse(sessionStorage.getItem(CART_KEY) || "{}");
      setCart(saved);
    } catch {
      // ignore malformed cart
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return ["All", ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        (item.description || "").toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [items, search, activeCategory]);

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);
  const cartCount = cartEntries.reduce((sum, [, qty]) => sum + qty, 0);
  const cartTotal = cartEntries.reduce((sum, [id, qty]) => {
    const item = itemsById.get(Number(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  function setQty(id, qty) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  function addItem(id) {
    setQty(id, (cart[id] || 0) + 1);
  }

  function goToCheckout() {
    if (cartCount === 0) return;
    router.push("/checkout");
  }

  return (
    <main className="min-h-screen pb-28 flex flex-col">
      <Header
        right={
          <button
            onClick={() => setCartOpen(true)}
            className="focus-ring relative rounded-full border border-char-900/20 px-4 py-2 text-sm font-medium text-char-900 hover:border-char-900/50 transition-colors"
          >
            Your order
            {cartCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-ember-500 text-white text-xs w-5 h-5">
                {cartCount}
              </span>
            )}
          </button>
        }
      />

      <div className="max-w-6xl mx-auto px-5 pt-8 flex-1 w-full">
        <h1 className="font-display text-3xl text-char-900">Today's menu</h1>
        <p className="text-char-700/70 mt-1">Tap a dish to add it to your order.</p>

        {!loading && !error && items.length > 0 && (
          <div className="mt-6 space-y-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes…"
              className="focus-ring w-full sm:max-w-xs rounded-full border border-char-900/20 px-4 py-2.5 bg-white text-char-900 text-sm"
            />
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`focus-ring text-sm rounded-full px-3.5 py-1.5 border transition-colors ${
                    activeCategory === cat
                      ? "bg-char-900 text-linen border-char-900"
                      : "border-char-900/20 text-char-700 hover:border-char-900/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <p className="mt-10 text-char-700/60">Loading menu…</p>}
        {error && <p className="mt-10 text-brick-600">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <p className="mt-10 text-char-700/60">No items are available right now. Please check with staff.</p>
        )}

        {!loading && !error && items.length > 0 && filteredItems.length === 0 && (
          <p className="mt-10 text-char-700/60">No dishes match "{search}". Try another search or category.</p>
        )}

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-char-900/10 bg-white overflow-hidden flex flex-col"
            >
              <div className="relative">
                <DishImage item={item} />
                {item.is_featured ? (
                  <span className="absolute top-2 left-2 rounded-full bg-ember-500 text-white text-xs font-medium px-2.5 py-1">
                    Popular
                  </span>
                ) : null}
              </div>

              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start gap-2">
                  <VegBadge isVeg={!!item.is_veg} />
                  <p className="font-medium text-char-900 leading-snug">{item.name}</p>
                </div>
                {item.description && (
                  <p className="text-sm text-char-700/70 mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-3 pt-1">
                  <span className="text-ember-600 font-medium">{formatMoney(item.price)}</span>

                  {cart[item.id] ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQty(item.id, (cart[item.id] || 0) - 1)}
                        className="focus-ring w-8 h-8 rounded-full border border-char-900/20 text-char-900 hover:border-char-900/50"
                        aria-label={`Remove one ${item.name}`}
                      >
                        −
                      </button>
                      <span className="w-5 text-center font-medium">{cart[item.id]}</span>
                      <button
                        onClick={() => addItem(item.id)}
                        className="focus-ring w-8 h-8 rounded-full border border-char-900/20 text-char-900 hover:border-char-900/50"
                        aria-label={`Add one more ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addItem(item.id)}
                      className="focus-ring shrink-0 rounded-full bg-char-900 text-linen px-4 py-2 text-sm font-medium hover:bg-char-800 transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />

      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-char-900 text-linen">
          <button
            onClick={goToCheckout}
            className="focus-ring w-full max-w-6xl mx-auto flex items-center justify-between px-5 py-4"
          >
            <span className="font-medium">{cartCount} item{cartCount > 1 ? "s" : ""} · {formatMoney(cartTotal)}</span>
            <span className="font-medium">Checkout →</span>
          </button>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-20 flex justify-end">
          <div className="absolute inset-0 bg-char-900/40" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-sm bg-linen h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-char-900/10">
              <h2 className="font-display text-xl text-char-900">Your order</h2>
              <button onClick={() => setCartOpen(false)} className="focus-ring text-char-700/70 hover:text-char-900">
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cartEntries.length === 0 && <p className="text-char-700/60">Nothing added yet.</p>}
              <ul className="space-y-4">
                {cartEntries.map(([id, qty]) => {
                  const item = itemsById.get(Number(id));
                  if (!item) return null;
                  return (
                    <li key={id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-char-900">{item.name}</p>
                        <p className="text-sm text-char-700/70">{formatMoney(item.price)} × {qty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQty(item.id, qty - 1)}
                          className="focus-ring w-7 h-7 rounded-full border border-char-900/20"
                        >
                          −
                        </button>
                        <span className="w-5 text-center">{qty}</span>
                        <button
                          onClick={() => setQty(item.id, qty + 1)}
                          className="focus-ring w-7 h-7 rounded-full border border-char-900/20"
                        >
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="px-5 py-4 border-t border-char-900/10">
              <div className="flex justify-between font-medium text-char-900 mb-4">
                <span>Total</span>
                <span>{formatMoney(cartTotal)}</span>
              </div>
              <button
                onClick={goToCheckout}
                disabled={cartCount === 0}
                className="focus-ring w-full rounded-full bg-char-900 text-linen py-3 font-medium disabled:opacity-40 hover:bg-char-800 transition-colors"
              >
                Continue to checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

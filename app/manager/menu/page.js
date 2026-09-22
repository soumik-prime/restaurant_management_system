"use client";

import { useCallback, useEffect, useState } from "react";
import RoleGate from "../../../components/RoleGate";
import DashboardHeader from "../../../components/DashboardHeader";
import { formatMoney } from "../../../lib/format";

const EMPTY_FORM = {
  id: null,
  name: "",
  description: "",
  price: "",
  category: "",
  image_url: "",
  is_veg: true,
  is_featured: false,
  is_available: true,
};

function MenuManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/menu?all=1");
    const data = await res.json();
    if (res.ok) setItems(data.items || []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function startNew() {
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  }

  function startEdit(item) {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      image_url: item.image_url || "",
      is_veg: !!item.is_veg,
      is_featured: !!item.is_featured,
      is_available: !!item.is_available,
    });
    setShowForm(true);
    setError("");
  }

  async function saveItem(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      image_url: form.image_url,
      is_veg: form.is_veg,
      is_featured: form.is_featured,
      is_available: form.is_available,
    };
    try {
      const res = form.id
        ? await fetch(`/api/menu/${form.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/menu", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't save this item.");
      } else {
        setShowForm(false);
        await load();
      }
    } catch {
      setError("Connection issue — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailability(item) {
    await fetch(`/api/menu/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_available: !item.is_available }),
    });
    await load();
  }

  async function removeItem(item) {
    if (!confirm(`Remove "${item.name}" from the menu permanently?`)) return;
    await fetch(`/api/menu/${item.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-char-900">Menu</h1>
        <button
          onClick={startNew}
          className="focus-ring rounded-full bg-char-900 text-linen px-4 py-2 text-sm font-medium hover:bg-char-800"
        >
          Add item
        </button>
      </div>

      <div className="border border-char-900/10 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-char-900/5 text-char-700/70">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Photo</th>
              <th className="text-left px-4 py-2.5 font-medium">Name</th>
              <th className="text-left px-4 py-2.5 font-medium">Category</th>
              <th className="text-left px-4 py-2.5 font-medium">Price</th>
              <th className="text-left px-4 py-2.5 font-medium">Available</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-char-900/10">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-char-900/10 flex items-center justify-center text-char-700/40 text-xs">
                      No photo
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-char-900">
                  <div className="flex items-center gap-2">
                    {item.name}
                    {item.is_featured ? (
                      <span className="rounded-full bg-ember-500/15 text-ember-600 text-xs font-medium px-2 py-0.5">
                        Popular
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-char-700/80">{item.category}</td>
                <td className="px-4 py-3 text-char-900">
                  {formatMoney(item.price)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`focus-ring rounded-full px-3 py-1 text-xs font-medium ${
                      item.is_available
                        ? "bg-olive-500/15 text-olive-600"
                        : "bg-char-900/10 text-char-700/60"
                    }`}
                  >
                    {item.is_available ? "Available" : "Unavailable"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                  <button
                    onClick={() => startEdit(item)}
                    className="focus-ring text-sm text-char-900 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeItem(item)}
                    className="focus-ring text-sm text-brick-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-char-700/50"
                >
                  No menu items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-char-900/40"
            onClick={() => setShowForm(false)}
          />
          <form
            onSubmit={saveItem}
            className="relative bg-linen rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-display text-xl text-char-900">
              {form.id ? "Edit item" : "New item"}
            </h2>
            <div>
              <label className="block text-sm font-medium text-char-700/70 mb-1">
                Name
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="focus-ring w-full rounded-lg border border-char-900/20 px-3 py-2 bg-white text-char-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-char-700/70 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
                className="focus-ring w-full rounded-lg border border-char-900/20 px-3 py-2 bg-white text-char-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-char-700/70 mb-1">
                Photo URL or local path{" "}
                <span className="text-char-700/40 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.image_url}
                onChange={(e) =>
                  setForm({ ...form, image_url: e.target.value })
                }
                placeholder="https://…  or  /images/dish.jpg"
                className="focus-ring w-full rounded-lg border border-char-900/20 px-3 py-2 bg-white text-char-900"
              />
              {form.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="mt-2 w-full h-32 rounded-lg object-cover border border-char-900/10"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                  onLoad={(e) => (e.currentTarget.style.display = "block")}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-char-700/70 mb-1">
                  Price
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-char-900/20 px-3 py-2 bg-white text-char-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-char-700/70 mb-1">
                  Category
                </label>
                <input
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="focus-ring w-full rounded-lg border border-char-900/20 px-3 py-2 bg-white text-char-900"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-char-900">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) =>
                    setForm({ ...form, is_available: e.target.checked })
                  }
                  className="accent-char-900"
                />
                Available to customers
              </label>
              <label className="flex items-center gap-2 text-sm text-char-900">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) =>
                    setForm({ ...form, is_featured: e.target.checked })
                  }
                  className="accent-ember-500"
                />
                Mark as &quot;Popular&quot;
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-char-700/70 mb-1.5">
                Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_veg: true })}
                  className={`focus-ring flex-1 rounded-lg border py-2 text-sm font-medium ${
                    form.is_veg
                      ? "border-olive-600 bg-olive-500/10 text-olive-600"
                      : "border-char-900/20 text-char-700"
                  }`}
                >
                  Vegetarian
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_veg: false })}
                  className={`focus-ring flex-1 rounded-lg border py-2 text-sm font-medium ${
                    !form.is_veg
                      ? "border-brick-600 bg-brick-500/10 text-brick-600"
                      : "border-char-900/20 text-char-700"
                  }`}
                >
                  Contains meat
                </button>
              </div>
            </div>

            {error && <p className="text-brick-600 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="focus-ring flex-1 rounded-full border border-char-900/20 py-2.5 text-sm font-medium text-char-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="focus-ring flex-1 rounded-full bg-char-900 text-linen py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ManagerMenuPage() {
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
          <MenuManager />
        </main>
      )}
    </RoleGate>
  );
}

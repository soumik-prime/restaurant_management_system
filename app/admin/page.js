"use client";

import { useCallback, useEffect, useState } from "react";
import RoleGate from "../../components/RoleGate";
import DashboardHeader from "../../components/DashboardHeader";

const EMPTY_FORM = { id: null, name: "", email: "", password: "", role: "staff" };

function AccountsManager() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (res.ok) setUsers(data.users || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startNew() {
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  }

  function startEdit(user) {
    setForm({ id: user.id, name: user.name, email: user.email, password: "", role: user.role });
    setShowForm(true);
    setError("");
  }

  async function saveUser(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      let res;
      if (form.id) {
        res = await fetch(`/api/users/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            role: form.role,
            ...(form.password ? { password: form.password } : {}),
          }),
        });
      } else {
        res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't save this account.");
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

  async function toggleActive(user) {
    await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !user.is_active }),
    });
    await load();
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-char-900">Staff accounts</h1>
        <button
          onClick={startNew}
          className="focus-ring rounded-full bg-char-900 text-linen px-4 py-2 text-sm font-medium hover:bg-char-800"
        >
          Add account
        </button>
      </div>

      <div className="border border-char-900/10 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-char-900/5 text-char-700/70">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Name</th>
              <th className="text-left px-4 py-2.5 font-medium">Email</th>
              <th className="text-left px-4 py-2.5 font-medium">Role</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-char-900/10">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-char-900">{u.name}</td>
                <td className="px-4 py-3 text-char-700/80">{u.email}</td>
                <td className="px-4 py-3 text-char-700/80 capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(u)}
                    className={`focus-ring rounded-full px-3 py-1 text-xs font-medium ${
                      u.is_active ? "bg-olive-500/15 text-olive-600" : "bg-brick-500/15 text-brick-600"
                    }`}
                  >
                    {u.is_active ? "Active" : "Deactivated"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(u)} className="focus-ring text-sm text-char-900 hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-char-700/50">
                  No manager or staff accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-char-900/40" onClick={() => setShowForm(false)} />
          <form onSubmit={saveUser} className="relative bg-linen rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4">
            <h2 className="font-display text-xl text-char-900">
              {form.id ? "Edit account" : "New account"}
            </h2>
            <div>
              <label className="block text-sm font-medium text-char-700/70 mb-1">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="focus-ring w-full rounded-lg border border-char-900/20 px-3 py-2 bg-white text-char-900"
              />
            </div>
            {!form.id && (
              <div>
                <label className="block text-sm font-medium text-char-700/70 mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-char-900/20 px-3 py-2 bg-white text-char-900"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-char-700/70 mb-1">
                {form.id ? "New password (optional)" : "Password"}
              </label>
              <input
                required={!form.id}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="focus-ring w-full rounded-lg border border-char-900/20 px-3 py-2 bg-white text-char-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-char-700/70 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="focus-ring w-full rounded-lg border border-char-900/20 px-3 py-2 bg-white text-char-900"
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
              </select>
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

export default function AdminPage() {
  return (
    <RoleGate roles={["admin"]}>
      {(user) => (
        <main className="min-h-screen">
          <DashboardHeader title="MeetPoint · Admin" user={user} />
          <AccountsManager />
        </main>
      )}
    </RoleGate>
  );
}

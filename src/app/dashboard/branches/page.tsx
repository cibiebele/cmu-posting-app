"use client";
import { useEffect, useState } from "react";
type Branch = { _id: string; name: string; code: string; status: string };
export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  async function load() {
    const r = await fetch("/api/branches");
    const d = await r.json();
    if (r.ok) setBranches(d.branches);
    else setError(d.error);
  }
  useEffect(() => {
    load();
  }, []);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const r = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error);
      return;
    }
    setName("");
    setCode("");
    load();
  }
  async function update(b: Branch, patch: Record<string, string>) {
    setError("");
    const r = await fetch(`/api/branches/${b._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error);
      return;
    }
    setEditing(null);
    load();
  }
  async function remove(b: Branch) {
    if (
      !window.confirm(
        `Delete ${b.name}? This is only possible if no members are assigned to it.`,
      )
    )
      return;
    setError("");
    const r = await fetch(`/api/branches/${b._id}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error);
      return;
    }
    load();
  }
  return (
    <div>
      <h1 className="text-3xl font-bold">Branches</h1>
      <p className="text-slate-500 mt-1">Create and maintain CMU branches.</p>
      <div className="grid md:grid-cols-[320px_1fr] gap-6 mt-7">
        <form
          onSubmit={add}
          className="bg-white border rounded-xl p-5 h-fit space-y-3"
        >
          <h2 className="font-semibold">Add branch</h2>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Branch name"
            className="w-full border rounded-lg p-3 text-sm"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Branch code (optional)"
            className="w-full border rounded-lg p-3 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full bg-blue-700 text-white rounded-lg p-3">
            Create branch
          </button>
        </form>
        <section className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold">Branch directory</h2>
          <div className="mt-4 divide-y">
            {branches.map((b) => (
              <div key={b._id} className="py-3">
                {editing === b._id ? (
                  <div className="grid gap-2">
                    <input
                      className="border rounded p-2 text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      aria-label="Branch name"
                    />
                    <input
                      className="border rounded p-2 text-sm"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      aria-label="Branch code"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          update(b, { name: editName, code: editCode })
                        }
                        className="text-sm bg-blue-700 text-white rounded px-3 py-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="text-sm border rounded px-3 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-xs text-slate-500">
                        {b.code || "No code"} · {b.status}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <button
                        onClick={() => {
                          setEditing(b._id);
                          setEditName(b.name);
                          setEditCode(b.code || "");
                        }}
                        className="text-sm border rounded-lg px-3 py-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          update(b, {
                            status:
                              b.status === "active" ? "inactive" : "active",
                          })
                        }
                        className="text-sm border rounded-lg px-3 py-2"
                      >
                        {b.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => remove(b)}
                        className="text-sm border border-red-200 text-red-700 rounded-lg px-3 py-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {branches.length === 0 && (
              <p className="text-sm text-slate-500 py-4">No branches yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

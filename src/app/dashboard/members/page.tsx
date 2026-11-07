"use client";
import { useEffect, useState } from "react";
type Branch = { _id: string; name: string };
type Member = {
  _id: string;
  name: string;
  membershipNumber: string;
  role: string;
  status: string;
  branch: { name: string } | null;
};
export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState("");
  const [form, setForm] = useState({
    name: "",
    membershipNumber: "",
    phone: "",
    address: "",
    gender: "Male",
    branch: "",
    role: "member",
  });
  const [saving, setSaving] = useState(false);
  async function load() {
    setLoading(true);
    try {
      const [u, b] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/branches"),
      ]);
      const ud = await u.json(),
        bd = await b.json();
      if (!u.ok) throw new Error(ud.error);
      if (!b.ok) throw new Error(bd.error);
      setMembers(ud.users);
      setBranches(bd.branches.filter((x: Branch) => x));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load data");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setInvite("");
    try {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unable to register member");
      setInvite(d.invitationUrl);
      setForm({
        name: "",
        membershipNumber: "",
        phone: "",
        address: "",
        gender: "Male",
        branch: "",
        role: "member",
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to register member");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div>
      <h1 className="text-3xl font-bold">Members</h1>
      <p className="text-slate-500 mt-1">
        Register members and manage membership records.
      </p>
      <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] gap-6 mt-7">
        <section className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold">Member directory</h2>
          {loading ? (
            <p className="text-sm text-slate-500 mt-4">Loading…</p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3 pr-3">Name</th>
                    <th className="py-3 pr-3">Branch</th>
                    <th className="py-3 pr-3">Role</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m._id} className="border-b last:border-0">
                      <td className="py-3 pr-3">
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-slate-500">{m.membershipNumber}</div>
                      </td>
                      <td className="py-3 pr-3">{m.branch?.name || "—"}</td>
                      <td className="py-3 pr-3 capitalize">
                        {m.role.replaceAll("_", " ")}
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {members.length === 0 && (
                <p className="py-5 text-sm text-slate-500">
                  No members registered yet.
                </p>
              )}
            </div>
          )}
        </section>
        <section className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold">Register a member</h2>
          <form onSubmit={create} className="grid gap-3 mt-4">
            <input
              required
              placeholder="Full name"
              className="border rounded-lg p-3 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              required
              type="text"
              placeholder="Membership number"
              className="border rounded-lg p-3 text-sm"
              value={form.membershipNumber}
              onChange={(e) => setForm({ ...form, membershipNumber: e.target.value })}
            />
            <input
              placeholder="Phone number (optional)"
              className="border rounded-lg p-3 text-sm"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <textarea
              required
              placeholder="Residential address"
              className="border rounded-lg p-3 text-sm"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <select
              className="border rounded-lg p-3 text-sm"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option>Male</option>
              <option>Female</option>
            </select>
            <select
              required
              className="border rounded-lg p-3 text-sm"
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              className="border rounded-lg p-3 text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="member">Member</option>
              <option value="coordinator">Coordinator</option>
              <option value="assistant_coordinator">
                Assistant Coordinator
              </option>
              <option value="posting_officer">Posting Officer</option>
              <option value="admin">Admin</option>
            </select>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {invite && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm">
                <p className="font-semibold text-green-800">
                  Member created. Copy and share this invitation link:
                </p>
                <input
                  readOnly
                  value={invite}
                  className="w-full mt-2 border rounded p-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(invite)}
                  className="text-green-800 underline mt-2"
                >
                  Copy invitation link
                </button>
                <p className="text-xs text-green-800 mt-2">
                  The invitation expires in 48 hours by default.
                </p>
              </div>
            )}
            <button
              disabled={saving || branches.length === 0}
              className="rounded-lg bg-blue-700 text-white p-3 font-semibold disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create member & generate invitation"}
            </button>
            {branches.length === 0 && (
              <p className="text-xs text-amber-700">
                Create an active branch before registering members.
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}

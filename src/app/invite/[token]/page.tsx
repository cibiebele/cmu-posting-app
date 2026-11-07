"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unable to accept invitation");
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to complete registration",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white rounded-2xl border p-8 shadow-sm space-y-5"
      >
        <div>
          <p className="text-sm font-semibold text-blue-700">CMU ONE</p>
          <h1 className="text-2xl font-bold mt-2">Set up your account</h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose a secure password to activate your membership.
          </p>
        </div>
        {done ? (
          <div className="space-y-3">
            <p className="text-green-700">
              Your account has been activated successfully.
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full rounded-lg bg-blue-700 text-white p-3"
            >
              Continue to sign in
            </button>
          </div>
        ) : (
          <>
            <label className="block text-sm font-medium">
              New password
              <input
                type="password"
                minLength={10}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border p-3"
              />
              <span className="text-xs text-slate-500">
                At least 10 characters.
              </span>
            </label>
            <label className="block text-sm font-medium">
              Confirm password
              <input
                type="password"
                minLength={10}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-lg border p-3"
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              disabled={busy}
              className="w-full rounded-lg bg-blue-700 text-white p-3"
            >
              {busy ? "Activating…" : "Activate account"}
            </button>
          </>
        )}
      </form>
    </main>
  );
}

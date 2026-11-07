"use client";

import { useEffect, useState } from "react";

type Branch = {
  _id: string;
  name: string;
};

export default function RegisterPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    membershipNumber: "",
    gender: "",
    address: "",
    branch: "",
  });

  useEffect(() => {
    async function loadBranches() {
      try {
        const response = await fetch("/api/public/branches");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load branches.");
        }

        setBranches(data.branches || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load branches."
        );
      } finally {
        setLoading(false);
      }
    }

    loadBranches();
  }, []);

  function updateField(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "membershipNumber"
        ? value.toUpperCase()
        : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Loading registration form...
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-5">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
            ✓
          </div>

          <h1 className="mb-3 text-2xl font-bold">
            Registration Successful!
          </h1>

          <p className="leading-7 text-gray-600">
            Your CMU One registration has been completed successfully.
            Thank you for registering. You may now close this page.
          </p>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">

      <div className="mx-auto max-w-xl">

        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            CMU One
          </h1>

          <p className="mt-2 text-gray-600">
            Member Registration
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Complete the form below to register as a CMU member.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm sm:p-8"
        >

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Full Name *
            </label>

            <input
              required
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Enter your full name"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Membership Number *
            </label>

            <input
              required
              name="membershipNumber"
              value={form.membershipNumber}
              onChange={updateField}
              placeholder="Enter your membership number"
              maxLength={30}
              className="w-full rounded-lg border p-3 uppercase outline-none focus:border-blue-500"
            />

            <p className="mt-1 text-xs text-gray-500">
              Your membership number must be unique.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Gender *
            </label>

            <select
              required
              name="gender"
              value={form.gender}
              onChange={updateField}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Residential Address *
            </label>

            <textarea
              required
              name="address"
              value={form.address}
              onChange={updateField}
              rows={3}
              placeholder="Enter your residential address"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Branch *
            </label>

            <select
              required
              name="branch"
              value={form.branch}
              onChange={updateField}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select your branch</option>

              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>

            {branches.length === 0 && (
              <p className="mt-2 text-sm text-red-600">
                No active branches are currently available for registration.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || branches.length === 0}
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Registering..." : "Complete Registration"}
          </button>

          <p className="text-center text-xs text-gray-500">
            By registering, you confirm that the information provided is correct.
          </p>

        </form>

      </div>
    </main>
  );
}
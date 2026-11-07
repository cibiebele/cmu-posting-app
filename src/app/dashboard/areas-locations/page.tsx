"use client";

import { useCallback, useEffect, useState } from "react";

type Area = {
  _id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
};

type Location = {
  _id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  area: Area | string;
};

const emptyArea = {
  name: "",
  description: "",
};

const emptyLocation = {
  name: "",
  description: "",
  area: "",
};

export default function AreasLocationsPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [areaForm, setAreaForm] = useState(emptyArea);
  const [locationForm, setLocationForm] = useState(emptyLocation);

  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [areaResponse, locationResponse] = await Promise.all([
        fetch("/api/areas"),
        fetch("/api/locations"),
      ]);

      const areaData = await areaResponse.json();
      const locationData = await locationResponse.json();

      if (!areaResponse.ok || !locationResponse.ok) {
        throw new Error("Unable to load areas and locations");
      }

      setAreas(areaData.areas || []);
      setLocations(locationData.locations || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function saveArea(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const url = editingArea
        ? `/api/areas/${editingArea}`
        : "/api/areas";

      const response = await fetch(url, {
        method: editingArea ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(areaForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save area");
      }

      setMessage(data.message);
      setAreaForm(emptyArea);
      setEditingArea(null);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save area"
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveLocation(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const url = editingLocation
        ? `/api/locations/${editingLocation}`
        : "/api/locations";

      const response = await fetch(url, {
        method: editingLocation ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(locationForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save location");
      }

      setMessage(data.message);
      setLocationForm(emptyLocation);
      setEditingLocation(null);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save location"
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    type: "areas" | "locations",
    item: Area | Location
  ) {
    const newStatus =
      item.status === "active" ? "inactive" : "active";

    const confirmed = window.confirm(
      `Change "${item.name}" to ${newStatus}?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/${type}/${item._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update status");
      }

      setMessage(data.message);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update status"
      );
    }
  }

  async function archiveItem(
    type: "areas" | "locations",
    item: Area | Location
  ) {
    const confirmed = window.confirm(
      `Archive "${item.name}"? Existing records will be preserved.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/${type}/${item._id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to archive item");
      }

      setMessage(data.message);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to archive item"
      );
    }
  }

  function editArea(area: Area) {
    setEditingArea(area._id);
    setAreaForm({
      name: area.name,
      description: area.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editLocation(location: Location) {
    setEditingLocation(location._id);

    setLocationForm({
      name: location.name,
      description: location.description || "",
      area:
        typeof location.area === "string"
          ? location.area
          : location.area._id,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelAreaEdit() {
    setEditingArea(null);
    setAreaForm(emptyArea);
  }

  function cancelLocationEdit() {
    setEditingLocation(null);
    setLocationForm(emptyLocation);
  }

  const activeAreas = areas.filter(
    (area) => area.status === "active"
  );

  const activeLocations = locations.filter(
    (location) => location.status === "active"
  );

  function getAreaName(location: Location) {
    if (typeof location.area === "string") {
      return areas.find((a) => a._id === location.area)?.name || "Unknown";
    }

    return location.area?.name || "Unknown";
  }

  if (loading) {
    return <div className="p-8">Loading Areas & Locations...</div>;
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6">

      <div>
        <h1 className="text-2xl font-bold">
          Areas & Locations
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage officiating areas and their assigned locations.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total Areas</p>
          <h2 className="mt-2 text-3xl font-bold">
            {areas.length}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Active Areas</p>
          <h2 className="mt-2 text-3xl font-bold">
            {activeAreas.length}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Active Locations</p>
          <h2 className="mt-2 text-3xl font-bold">
            {activeLocations.length}
          </h2>
        </div>

      </div>

      {/* AREA FORM */}

      <section className="rounded-xl border bg-white p-6">

        <h2 className="mb-5 text-lg font-semibold">
          {editingArea ? "Edit Area" : "Add New Area"}
        </h2>

        <form onSubmit={saveArea} className="space-y-4">

          <div>
            <label className="mb-1 block text-sm font-medium">
              Area Name
            </label>

            <input
              required
              value={areaForm.name}
              onChange={(e) =>
                setAreaForm({
                  ...areaForm,
                  name: e.target.value,
                })
              }
              placeholder="e.g. Main Auditorium"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>

            <textarea
              value={areaForm.description}
              onChange={(e) =>
                setAreaForm({
                  ...areaForm,
                  description: e.target.value,
                })
              }
              placeholder="Optional description"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="flex gap-2">

            <button
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingArea
                  ? "Update Area"
                  : "Add Area"}
            </button>

            {editingArea && (
              <button
                type="button"
                onClick={cancelAreaEdit}
                className="rounded-lg border px-5 py-3"
              >
                Cancel
              </button>
            )}

          </div>
        </form>
      </section>

      {/* LOCATION FORM */}

      <section className="rounded-xl border bg-white p-6">

        <h2 className="mb-5 text-lg font-semibold">
          {editingLocation ? "Edit Location" : "Add New Location"}
        </h2>

        <form onSubmit={saveLocation} className="space-y-4">

          <div>
            <label className="mb-1 block text-sm font-medium">
              Location Name
            </label>

            <input
              required
              value={locationForm.name}
              onChange={(e) =>
                setLocationForm({
                  ...locationForm,
                  name: e.target.value,
                })
              }
              placeholder="e.g. Main Entrance"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Select Area
            </label>

            <select
              required
              value={locationForm.area}
              onChange={(e) =>
                setLocationForm({
                  ...locationForm,
                  area: e.target.value,
                })
              }
              className="w-full rounded-lg border p-3"
            >
              <option value="">Choose an area</option>

              {activeAreas.map((area) => (
                <option key={area._id} value={area._id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>

            <textarea
              value={locationForm.description}
              onChange={(e) =>
                setLocationForm({
                  ...locationForm,
                  description: e.target.value,
                })
              }
              placeholder="Optional description"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="flex gap-2">

            <button
              disabled={saving || activeAreas.length === 0}
              className="rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingLocation
                  ? "Update Location"
                  : "Add Location"}
            </button>

            {editingLocation && (
              <button
                type="button"
                onClick={cancelLocationEdit}
                className="rounded-lg border px-5 py-3"
              >
                Cancel
              </button>
            )}

          </div>

          {activeAreas.length === 0 && (
            <p className="text-sm text-red-600">
              Create and activate an area before adding locations.
            </p>
          )}

        </form>
      </section>

      {/* AREAS TABLE */}

      <section className="overflow-hidden rounded-xl border bg-white">

        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">Registered Areas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">

            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">Area</th>
                <th className="p-4">Locations</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {areas.map((area) => {
                const count = locations.filter(
                  (location) =>
                    (typeof location.area === "string"
                      ? location.area
                      : location.area?._id) === area._id
                ).length;

                return (
                  <tr key={area._id} className="border-t">

                    <td className="p-4">
                      <p className="font-medium">{area.name}</p>
                      <p className="text-xs text-gray-500">
                        {area.description}
                      </p>
                    </td>

                    <td className="p-4">{count}</td>

                    <td className="p-4">
                      <span
                        className={
                          area.status === "active"
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        {area.status}
                      </span>
                    </td>

                    <td className="space-x-3 p-4">
                      <button
                        onClick={() => editArea(area)}
                        className="text-blue-600"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => updateStatus("areas", area)}
                        className="text-orange-600"
                      >
                        {area.status === "active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>

                      <button
                        onClick={() => archiveItem("areas", area)}
                        className="text-red-600"
                      >
                        Archive
                      </button>
                    </td>

                  </tr>
                );
              })}

              {areas.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    No areas have been added.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </section>

      {/* LOCATIONS TABLE */}

      <section className="overflow-hidden rounded-xl border bg-white">

        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Registered Locations
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">

            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">Location</th>
                <th className="p-4">Area</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {locations.map((location) => (
                <tr key={location._id} className="border-t">

                  <td className="p-4">
                    <p className="font-medium">{location.name}</p>
                    <p className="text-xs text-gray-500">
                      {location.description}
                    </p>
                  </td>

                  <td className="p-4">{getAreaName(location)}</td>

                  <td className="p-4">
                    <span
                      className={
                        location.status === "active"
                          ? "text-green-600"
                          : "text-gray-500"
                      }
                    >
                      {location.status}
                    </span>
                  </td>

                  <td className="space-x-3 p-4">
                    <button
                      onClick={() => editLocation(location)}
                      className="text-blue-600"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        updateStatus("locations", location)
                      }
                      className="text-orange-600"
                    >
                      {location.status === "active"
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    <button
                      onClick={() =>
                        archiveItem("locations", location)
                      }
                      className="text-red-600"
                    >
                      Archive
                    </button>
                  </td>

                </tr>
              ))}

              {locations.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    No locations have been added.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </section>

    </main>
  );
}
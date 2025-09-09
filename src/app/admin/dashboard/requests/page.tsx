"use client";
import { useEffect, useState } from "react";

export default function PendingRequests() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/requests/pending");
      if (!res.ok) return;
      const data = await res.json();
      setRequests(data.requests || []);
    }
    load();
  }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    let setPassword: string | undefined = undefined;

    // Only ask password when approving
    if (action === "approve") {
      setPassword = prompt("Set a password for this user:") || undefined;
      if (!setPassword) return alert("Password is required to approve.");
    }

    const res = await fetch(`/api/requests/handle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, action, setPassword }),
    });

    if (!res.ok) {
      const err = await res.json();
      return alert("Failed to update request: " + (err.error || ""));
    }

    setRequests((prev) => prev.filter((r) => r._id !== id));
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Pending Requests</h1>
      {requests.length === 0 ? (
        <p className="text-gray-500">No pending requests.</p>
      ) : (
        <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Gym</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3 capitalize">{r.role}</td>
                  <td className="p-3">{r.gym?.name || "—"}</td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => handleAction(r._id, "approve")}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(r._id, "reject")}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

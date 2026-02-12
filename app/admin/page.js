"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "../../context/AdminContext";
import { LogOut, Mail, User, Calendar } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const { admin, adminToken, loading, logoutAdmin } = useAdmin();
  const [contacts, setContacts] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !adminToken) {
      router.push("/admin/login");
    }
  }, [loading, adminToken, router]);

  useEffect(() => {
    if (adminToken) {
      fetchContacts();
    }
  }, [adminToken]);

  const fetchContacts = async () => {
    try {
      setFetchLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/contacts?admin=${adminToken}`);
      const data = await res.json();

      if (res.ok && data.contacts) {
        setContacts(data.contacts);
      } else {
        setError(data?.error || "Failed to fetch contacts");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!adminToken) {
    return null;
  }

  return (
    <main className="w-full min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-comfortaa font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">Welcome, {admin?.username}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-lg">
            <div className="text-gray-400 text-sm">Total Contacts</div>
            <div className="text-4xl font-bold text-primary mt-2">{contacts.length}</div>
          </div>
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-lg">
            <div className="text-gray-400 text-sm">With Email</div>
            <div className="text-4xl font-bold text-secondary mt-2">
              {contacts.filter((c) => c.email).length}
            </div>
          </div>
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-lg">
            <div className="text-gray-400 text-sm">Last 24h</div>
            <div className="text-4xl font-bold text-green-400 mt-2">
              {
                contacts.filter((c) => {
                  const date = new Date(c.createdAt);
                  return Date.now() - date.getTime() < 24 * 60 * 60 * 1000;
                }).length
              }
            </div>
          </div>
        </div>

        {/* Messages Table */}
        <div className="bg-zinc-900 border border-white/5 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold">Contact Messages</h2>
            <button
              onClick={fetchContacts}
              disabled={fetchLoading}
              className="bg-primary text-black px-4 py-2 rounded font-medium disabled:opacity-50 hover:opacity-90"
            >
              {fetchLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="px-6 py-4 bg-red-900/20 border-b border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          {contacts.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              No contacts yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Message</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr
                      key={contact._id}
                      className="border-t border-white/5 hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          {contact.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Mail size={16} />
                            {contact.email}
                          </a>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 max-w-xs ">
                        {contact.message}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

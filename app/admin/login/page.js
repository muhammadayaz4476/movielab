"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "../../../context/AdminContext";
import { Lock, User } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const { adminToken, loading, loginAdmin } = useAdmin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && adminToken) {
      router.push("/admin");
    }
  }, [loading, adminToken, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill all fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await loginAdmin(username, password);
    if (result.success) {
      router.push("/admin");
    } else {
      setError(result.error || "Login failed");
    }
    setIsLoading(false);
  };

  return (
    <main className="w-full min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-comfortaa font-bold mb-2">Admin Login</h1>
          <p className="text-gray-400">Access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white outline-none focus:border-primary transition-colors"
                placeholder="Enter username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white outline-none focus:border-primary transition-colors"
                placeholder="Enter password"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-black font-semibold py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity mt-6"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Only authorized admins can access this page
        </p>
      </div>
    </main>
  );
}

"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState(null);

  // Check for saved admin on mount
  useEffect(() => {
    const savedAdminToken = Cookies.get("movielab_admin_token");
    if (savedAdminToken) {
      setAdminToken(savedAdminToken);
      setAdmin({ token: savedAdminToken });
    }
    setLoading(false);
  }, []);

  const loginAdmin = async (username, password) => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.admin) {
        // Create a simple token (in production, use JWT)
        const token = `${data.admin.id}-${Date.now()}`;
        setAdmin(data.admin);
        setAdminToken(token);
        Cookies.set("movielab_admin_token", token, { expires: 7 });
        return { success: true };
      } else {
        return { success: false, error: data?.error || "Login failed" };
      }
    } catch (error) {
      console.error("Admin login error:", error);
      return { success: false, error: "Network error" };
    } finally {
      setLoading(false);
    }
  };

  const logoutAdmin = () => {
    setAdmin(null);
    setAdminToken(null);
    Cookies.remove("movielab_admin_token");
  };

  return (
    <AdminContext.Provider value={{ admin, adminToken, loading, loginAdmin, logoutAdmin }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
};

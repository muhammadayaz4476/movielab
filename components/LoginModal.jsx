"use client";
import React, { useState } from "react";
import { X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const LoginModal = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login } = useAuth();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsLoading(true);
    await login(username);
    setIsLoading(false);
  };

  if (!isLoginModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsLoginModalOpen(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden"
        >
          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
              <User size={32} />
            </div>
            <h2 className="text-2xl font-bold font-comfortaa text-white mb-2">
              Sync Your List
            </h2>
            <p className="text-zinc-400 text-center text-sm">
              Enter a username to save your "Watch Later" list and access it
              from anywhere. No password required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Username (e.g. MovieBuff99)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 transition-all placeholder:text-zinc-600"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-black font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all font-comfortaa disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Continue"}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LoginModal;

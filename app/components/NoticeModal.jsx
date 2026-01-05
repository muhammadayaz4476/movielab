"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";

const NoticeModal = ({ isOpen, onClose, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-100 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#0f0f0f] border border-zinc-800 rounded-3xl z-101 shadow-2xl p-8 text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-primary" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 font-comfortaa">
              Feature Coming Soon
            </h3>

            <p className="text-gray-400 text-sm font-poppins leading-relaxed mb-8">
              {message ||
                "We are still working on this feature. Please check back later!"}
            </p>

            <button
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary/90 text-black font-semibold text-lg py-4 rounded-2xl transition-all active:scale-95 font-poppins"
            >
              Got it
            </button>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-full transition-colors group"
            >
              <X className="w-5 h-5 text-gray-500 group-hover:text-white" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NoticeModal;

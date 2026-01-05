"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Facebook, Twitter, Check } from "lucide-react";

const ShareModal = ({ isOpen, onClose, title, url }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      color: "bg-[#25D366]",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        title
      )}%20${encodeURIComponent(url)}`,
    },
    {
      name: "Facebook",
      icon: <Facebook className="w-6 h-6 fill-current" />,
      color: "bg-[#1877F2]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,
    },
    {
      name: "X",
      icon: <Twitter className="w-6 h-6 fill-current" />,
      color: "bg-black border border-gray-700",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        title
      )}&url=${encodeURIComponent(url)}`,
    },
    {
      name: "Email",
      icon: <Mail className="w-6 h-6" />,
      color: "bg-gray-600",
      url: `mailto:?subject=${encodeURIComponent(
        title
      )}&body=${encodeURIComponent(url)}`,
    },
  ];

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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#0f0f0f] border border-gray-800 rounded-2xl z-101 shadow-2xl p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Share</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-6 overflow-x-auto pb-4 no-scrollbar">
              {shareLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group min-w-[70px]"
                >
                  <div
                    className={`${link.color} w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110 shadow-lg`}
                  >
                    {link.icon}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {link.name}
                  </span>
                </a>
              ))}
            </div>

            {/* Link Copy Section */}
            <div className="bg-[#1a1a1a] rounded-xl flex items-center p-2 mt-4 border border-gray-800">
              <div className="flex-1 truncate px-3 text-sm text-gray-300">
                {url}
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-[#3ea6ff] text-black hover:bg-[#65b8ff]"
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : null}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Start at checkbox (visual only for now) */}
            <div className="mt-6 flex items-center gap-3 pt-6 border-t border-gray-800">
              <div className="w-5 h-5 border-2 border-gray-500 rounded flex items-center justify-center cursor-pointer"></div>
              <span className="text-sm text-gray-300">
                Start at <span className="text-gray-500 ml-1">0:00</span>
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;

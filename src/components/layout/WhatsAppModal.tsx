"use client";

import { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { getWhatsAppLink } from "@/lib/utils";

export function WhatsAppModal() {
  const [show, setShow] = useState(false);
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "911234567890";

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-20">
      {/* Backdrop - transparent */}
      <div
        className="absolute inset-0"
        onClick={() => setShow(false)}
      />

      {/* Modal - only WhatsApp button */}
      <div className="relative w-full max-w-sm animate-scaleIn space-y-2">
        {/* Close button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShow(false)}
            className="bg-gray-800/80 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={getWhatsAppLink(phone, "VP BHAI")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1fb855] text-white font-extrabold text-lg px-6 py-3.5 rounded-full shadow-lg shadow-green-500/25 transition-all hover:scale-[1.03] hover:shadow-green-400/40"
        >
          <FaWhatsapp className="w-7 h-7" />
          WhatsApp पर संपर्क करे
        </a>
      </div>
    </div>
  );
}

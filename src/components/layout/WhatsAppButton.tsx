"use client";

import { FaWhatsapp } from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import { getWhatsAppLink } from "@/lib/utils";

export function WhatsAppButton() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "911234567890";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
      {/* Refresh Button */}
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 hover:shadow-blue-300/50 hover:shadow-xl"
        aria-label="Refresh page"
      >
        <FiRefreshCw size={22} />
      </button>

      {/* WhatsApp Button */}
      <a
        href={getWhatsAppLink(phone, "Hi, I need help with Satta Result")}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-green-300/50 hover:shadow-xl"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp size={28} />
      </a>
    </div>
  );
}

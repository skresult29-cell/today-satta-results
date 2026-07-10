import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#0d1b2a] text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-white text-lg font-extrabold mb-3">
              TODAY<span className="text-[#e63946]">SATTA</span><span className="text-[#d4a017]">RESULT</span>
            </h3>
            <p className="text-sm leading-relaxed">
              TodaySattaResult.com is India&apos;s most trusted platform for superfast live Satta King results.
              Get instant updates for Gali, Desawar, Ghaziabad, Faridabad, Shri Ganesh, Delhi Bazar
              and 100+ games with complete monthly chart records from 2015 to 2026.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Today Satta Result
                </Link>
              </li>
              <li>
                <Link href="/charts" className="hover:text-white transition-colors">
                  Satta King Chart Records
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Satta King Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-white transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
            <p className="mt-4 text-xs text-gray-500 leading-relaxed">
              This website is for informational purposes only. We do not encourage or promote gambling in any form.
              Please follow the laws applicable in your region.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} TodaySattaResult.com &mdash; All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

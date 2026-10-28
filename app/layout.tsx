import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TriageSync 2.0 + MedPass — Emergency Medical Dispatch & Identity",
  description:
    "Autonomous emergency coordination, hospital capability matching, and offline-first identity.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col font-sans bg-[#040406] text-zinc-100 selection:bg-white/20 selection:text-white">
        {/* Minimal High-End Header */}
        <header className="sticky top-0 z-50 tactile-panel border-b border-white/[0.08] px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3 touch-target focus:outline-none focus:ring-1 focus:ring-white/40 rounded-lg group"
              aria-label="TriageSync 2.0 Home"
            >
              <span className="telemetry-pip bg-[#00E599] shadow-[0_0_8px_#00E599]" />
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-semibold tracking-wider text-white uppercase">
                  TriageSync
                </span>
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                  / MEDPASS 2.0
                </span>
              </div>
            </Link>

            {/* Clean Typographic Navigation */}
            <nav className="flex items-center gap-1 sm:gap-4 font-mono text-[11px] tracking-wider uppercase">
              <Link
                href="/medpass"
                className="touch-target px-3 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                MedPass
              </Link>
              <Link
                href="/hospital/dashboard"
                className="touch-target px-3 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                ER Radar
              </Link>
              <Link
                href="/incident/new"
                className="touch-target px-3 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Report Emergency
              </Link>
              <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-white/[0.08]">
                <span className="text-[10px] text-zinc-500">PUNE SECTOR 01</span>
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {children}
        </main>

        {/* Clean Architectural Footer */}
        <footer className="mt-auto border-t border-white/[0.06] bg-black/40 backdrop-blur-md px-6 py-8 text-xs font-mono text-zinc-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span className="text-zinc-400">
                Prototype demonstration system. Not a certified medical device.
              </span>
            </div>
            <div className="text-zinc-400 text-[11px] tracking-wider">
              IEEE 830 / ISO 29148 SPECIFICATION • ED25519 VERIFIABLE
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

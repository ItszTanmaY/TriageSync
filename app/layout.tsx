import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import { Activity, ShieldAlert, Radio, HeartPulse } from "lucide-react";

export const metadata: Metadata = {
  title: "TriageSync 2.0 + MedPass | Autonomous Emergency Coordination",
  description:
    "Next-generation emergency identity, capability-aware hospital routing, QueuePredict load balancing, and offline-first coordination.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#00f0ff",
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
      <body className="min-h-screen flex flex-col font-sans bg-[#040711] text-slate-100">
        {/* Top Emergency System Status Banner */}
        <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3 touch-target focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-lg pr-2"
              aria-label="TriageSync 2.0 Home"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/25">
                <HeartPulse className="w-6 h-6 text-slate-950 stroke-[2.5]" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-lg text-white">
                    TriageSync<span className="text-cyan-400"> 2.0</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 uppercase tracking-widest">
                    MedPass
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Pune Emergency Command Grid
                </span>
              </div>
            </Link>

            {/* Quick Navigation Links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/medpass"
                className="touch-target px-3 py-2 text-xs font-semibold rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
              >
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="hidden md:inline">MedPass</span>
              </Link>
              <Link
                href="/hospital/dashboard"
                className="touch-target px-3 py-2 text-xs font-semibold rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
              >
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">Hospital ER</span>
              </Link>
              <Link
                href="/command"
                className="touch-target px-3 py-2 text-xs font-semibold rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Command Grid</span>
              </Link>
              <div className="pl-2 border-l border-slate-800 flex items-center">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden lg:inline">Grid Online</span>
                </div>
              </div>
            </nav>
          </div>
        </header>

        {/* Main Application Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Mandatory Footer with Compliance Notice */}
        <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 py-6 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <p className="font-semibold text-slate-300">
                Prototype demonstration system. Not a certified medical device.
              </p>
            </div>
            <p className="text-slate-500">
              Structured under IEEE 830 / ISO 29148 • DPDP Act (India) data minimisation aligned
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

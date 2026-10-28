import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/navigation/Navbar";
import Link from "next/link";
import { ShieldCheck, HeartPulse, Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "TriageSync 2.0 + MedPass — Emergency Medical Coordination & Identity PWA",
  description:
    "Life-saving emergency ambulance routing, hospital capability matching, QueuePredict load balancing, and offline Ed25519 identity.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0284C7",
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
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans bg-[#F8FAFC] text-slate-900 antialiased selection:bg-sky-500/20 selection:text-sky-900">
        {/* Responsive Mobile-First Navigation Header */}
        <Navbar />

        {/* Main Application Canvas */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {children}
        </main>

        {/* Clinical Medical Institutional Footer */}
        <footer className="mt-auto border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-8 text-xs text-slate-600">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 font-bold">
                <HeartPulse className="w-4 h-4 text-sky-600 animate-pulse" />
                <span>TriageSync 2.0</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>
                  Prototype demonstration system. <strong>Not a certified medical device.</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] text-slate-500">
              <Link href="/medpass" className="hover:text-sky-600 transition-colors flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> MedPass Card
              </Link>
              <Link href="/hospital/dashboard" className="hover:text-sky-600 transition-colors flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-sky-600" /> ER Radar
              </Link>
              <Link href="/command" className="hover:text-sky-600 transition-colors">
                Command Map
              </Link>
              <span className="text-slate-400">|</span>
              <span className="tracking-wider uppercase">IEEE 830 • Ed25519 VERIFIABLE</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

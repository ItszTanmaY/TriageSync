import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { ResponsiveNavbar } from "@/components/navigation/ResponsiveNavbar";

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
        <AuthProvider>
          {/* Responsive Header with Frosted Glass Blur & Mobile Hamburger Drawer */}
          <ResponsiveNavbar />

          {/* Main Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
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
                IEEE 830 / ISO 29148 SPECIFICATION • ED25519 VERIFIABLE • RESILIENTLINK OUTBOX
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

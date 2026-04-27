import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "chAIn",
  description:
    "Privacy gateway and agent knowledge network for sensitive industries.",
};

export const viewport: Viewport = {
  themeColor: "#fafaf9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="min-h-full bg-[var(--background)] text-[var(--foreground)] [font-family:ui-sans-serif,system-ui,sans-serif]"
      >
        <Header />
        <main className="mx-auto max-w-6xl px-6 pb-24">{children}</main>
      </body>
    </html>
  );
}

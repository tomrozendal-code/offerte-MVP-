import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TabBar } from "@/components/ui/TabBar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MVP Offerte",
  description: "Spreek de klus in, controleer, verstuur. Je offerte is in een paar minuten klaar.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Offerte" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={`${inter.variable} min-h-dvh antialiased`}>
        <div className="pb-[calc(env(safe-area-inset-bottom)+84px)]">{children}</div>
        <TabBar />
      </body>
    </html>
  );
}

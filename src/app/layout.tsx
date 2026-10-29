import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { TabBar } from "@/components/ui/TabBar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const serif = Source_Serif_4({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["500", "600"],
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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a2233" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={`${inter.variable} ${serif.variable} min-h-dvh antialiased`}>
        <div className="pb-[calc(env(safe-area-inset-bottom)+84px)]">{children}</div>
        <TabBar />
      </body>
    </html>
  );
}

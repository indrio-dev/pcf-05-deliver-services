import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Fielder | Fresh Produce at Peak Quality",
  description: "Discover local harvests at their peak. Science-backed predictions tell you exactly when fruit and produce reach optimal freshness.",
  keywords: ["fresh produce", "local farms", "harvest predictions", "peak freshness", "farm to table"],
  openGraph: {
    title: "Fielder | Fresh Produce at Peak Quality",
    description: "Discover local harvests at their peak.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${mono.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

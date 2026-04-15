import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Cormorant_SC, Jost } from "next/font/google";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant-garamond",
});

const cormorantSC = Cormorant_SC({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-cormorant-sc",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-jost",
});

export const metadata: Metadata = {
  title: "BeeFrequency",
  description: "Espace de pilotage — From poison to nectar",
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BeeFrequency",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#B8821E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${cormorantGaramond.variable} ${cormorantSC.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-creme-sacree text-brun-chaud font-ui">
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

// Google Fonts via <link> (au lieu de next/font/google) pour éviter le
// fetch au build qui échoue quand l'IP VPS est rate-limitée par Google Fonts.
// Les variables CSS --font-cormorant-garamond / --font-cormorant-sc / --font-jost
// sont redéfinies en dur ci-dessous · globals.css les consomme via --font-display /
// --font-caps / --font-ui.
const FONT_VARS_STYLE = `
:root {
  --font-cormorant-garamond: "Cormorant Garamond", Georgia, serif;
  --font-cormorant-sc: "Cormorant SC", "Cormorant Garamond", Georgia, serif;
  --font-jost: "Jost", "Helvetica Neue", Arial, sans-serif;
}
`;

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
    <html lang="fr" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cormorant+SC:wght@400&family=Jost:wght@300;400&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: FONT_VARS_STYLE }} />
      </head>
      <body className="min-h-full flex flex-col bg-creme-sacree text-brun-chaud font-ui">
        {children}
      </body>
    </html>
  );
}

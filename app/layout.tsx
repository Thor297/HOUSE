import type { Metadata, Viewport } from "next";
import "./globals.css";

// Bewusst kein next/font/google-Webfont: Ein natives System-Font-Stack
// (SF Pro auf iPhone/iPad/Mac) passt zur geforderten Apple-nahen
// Klarheit, lädt ohne externe Netzwerkabhängigkeit und ist damit auch
// für Build-Umgebungen ohne Zugriff auf fonts.googleapis.com robust.
// Definiert in app/globals.css als --font-sans / --font-mono.

export const metadata: Metadata = {
  title: "Mein Haus",
  description: "Digitaler Hausmanager und Dokumentenarchiv",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

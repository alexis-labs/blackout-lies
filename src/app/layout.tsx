import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Laughing Cat Caper",
  description: "A noir pixel art LLM-ready interrogation game.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caso Vitoria: Cajamar File",
  description: "A noir pixel art interrogation game inspired by a real case.",
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

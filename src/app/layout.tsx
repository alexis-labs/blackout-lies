import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Blackout Lies",
    template: "%s | Blackout Lies",
  },
  applicationName: "Blackout Lies",
  description:
    "A noir pixel art interrogation game where players question suspects, track contradictions, and solve a fictional case with a local engine or optional OpenAI responses.",
  keywords: [
    "Blackout Lies",
    "noir game",
    "pixel art game",
    "detective game",
    "interrogation game",
    "mystery game",
    "narrative game",
    "interactive fiction",
    "browser game",
    "web game",
    "AI game",
    "OpenAI game",
    "LLM game",
    "Next.js game",
    "React game",
    "TypeScript game",
    "Tailwind CSS",
    "itch.io game",
  ],
  authors: [{ name: "Alexis Labs" }],
  creator: "Alexis Labs",
  publisher: "Alexis Labs",
  category: "game",
  openGraph: {
    title: "Blackout Lies",
    description:
      "Question suspects, pressure contradictions, and inspect case files in a noir pixel art interrogation game.",
    type: "website",
    siteName: "Blackout Lies",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Blackout Lies",
    description:
      "A noir pixel art detective interrogation game built with Next.js and TypeScript.",
  },
  robots: {
    index: true,
    follow: true,
  },
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

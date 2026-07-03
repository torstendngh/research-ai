import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/tailwind-utils";
import fonts from "@/lib/fonts";
import { Analytics } from "@vercel/analytics/next";

const description =
  "Drop in papers, PDFs, and links, and ResearchAI turns them into a grounded chat, mind maps, flashcards, quizzes, and podcasts — every answer cited back to your sources.";

export const metadata: Metadata = {
  title: {
    default: "ResearchAI — AI research workspace for your sources",
    template: "%s — ResearchAI",
  },
  description,
  keywords: [
    "AI research assistant",
    "research workspace",
    "PDF chat",
    "RAG",
    "mind maps",
    "flashcards",
    "AI podcast generator",
    "NotebookLM alternative",
  ],
  openGraph: {
    type: "website",
    siteName: "ResearchAI",
    title: "ResearchAI — AI research workspace for your sources",
    description,
    images: ["/marketing/chat.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ResearchAI — AI research workspace for your sources",
    description,
    images: ["/marketing/chat.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(fonts, "h-full antialiased", "bg-white text-zinc-800")}
    >
      <body className="h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

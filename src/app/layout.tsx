import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/tailwind-utils";
import fonts from "@/lib/fonts";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "ResearchAI",
  description: "ResearchAI",
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

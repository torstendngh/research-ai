import { Inter, Geist_Mono, Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/tailwind-utils";

const regularFont = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const displayFont = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"]
});

const regularMonoFont = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export default cn(
  regularFont.variable,
  displayFont.variable,
  regularMonoFont.variable,
);

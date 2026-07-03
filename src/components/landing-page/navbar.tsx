"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LogoIcon from "@/components/shared/icons/logo-icon";

const Navbar = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`bg-zinc-900 rounded-b-xl p-1 gap-1 flex items-center justify-between shadow-xl fixed top-0 z-50 transition-all duration-300 left-2 right-2 sm:left-auto sm:right-16 sm:w-auto ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-full pointer-events-none"
      }`}
    >
      <Link
        href={"/"}
        className="rounded-lg text-zinc-100 pl-2 pr-3 py-1 font-semibold tracking-tight hover:bg-zinc-800 cursor-pointer flex items-center gap-1.5"
      >
        <LogoIcon className="size-4" />
        ResearchAI
      </Link>
      <Link
        href={"/login"}
        className="rounded-lg text-zinc-900 px-3 py-1 font-medium tracking-tight hover:bg-zinc-100 bg-white cursor-pointer shrink-0"
      >
        Get started
      </Link>
    </nav>
  );
};

export default Navbar;

"use client"

import LogoIcon from "@/components/shared/icons/logo-icon";
import { useNavbar } from "./navbar-context";

const Logo = () => {
  const { isNavbarOpen } = useNavbar();
  return (
    <div className="flex items-center gap-2 p-4">
      <LogoIcon className="size-5" />
      {isNavbarOpen && <h1 className="text-xl tracking-tighter leading-0 mt-0.25">ResearchAI</h1>}
    </div>
  );
};

export default Logo;

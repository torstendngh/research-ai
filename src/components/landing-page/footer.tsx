import Link from "next/link";
import CenterContent from "./center-content";
import LogoIcon from "@/components/shared/icons/logo-icon";

const Footer = () => {
  return (
    <footer className="py-16">
      <CenterContent>
        <div className="flex flex-col md:flex-row items-center md:justify-between justify-center gap-6 border-t border-zinc-100 pt-8">
          <span className="flex items-center gap-2 font-semibold tracking-tight text-zinc-800">
            <LogoIcon className="size-4" />
            ResearchAI
          </span>
          <Link
            href="/login"
            className="tracking-tight font-medium text-zinc-800 hover:underline underline-offset-2"
          >
            Sign in
          </Link>
          <span className="tracking-tight text-zinc-400">
            © {new Date().getFullYear()} ResearchAI
          </span>
        </div>
      </CenterContent>
    </footer>
  );
};

export default Footer;
